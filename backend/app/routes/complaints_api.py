import requests
import pandas as pd
from flask import Blueprint, request, jsonify

from app.services.notification_service import get_supabase_headers, get_supabase_url, log_complaint_action
from app.services.email_service import (
    send_status_in_progress_email, 
    send_resolved_email,
    send_threshold_citizen_email,
    send_threshold_authority_email
)
from app.services.authority_assignment_service import assign_complaint_authority
from app.notifications.events import (
    notify_complaint_submitted, 
    notify_status_changed, 
    notify_threshold_reached,
    notify_complaint_assigned,
    notify_complaint_reopened,
    notify_critical_complaint
)

from app.heatmap.processor import process_heatmap_pipeline
from app.heatmap.persistence import persist_heatmap_results

complaints_api = Blueprint("complaints_api", __name__)

COMMUNITY_THRESHOLD = 10

def _fetch_one(table, column, value):
    url = f"{get_supabase_url()}/rest/v1/{table}?{column}=eq.{value}&select=*"
    try:
        resp = requests.get(url, headers=get_supabase_headers())
        if resp.status_code == 200 and len(resp.json()) > 0:
            return resp.json()[0]
    except Exception as e:
        print(f"Error fetching {table}: {e}")
    return None

def _update(table, id_val, payload):
    url = f"{get_supabase_url()}/rest/v1/{table}?id=eq.{id_val}"
    try:
        resp = requests.patch(url, headers=get_supabase_headers(), json=payload)
        if resp.status_code in [200, 204]:
            return _fetch_one(table, "id", id_val)
    except Exception as e:
        print(f"Error updating {table}: {e}")
    return None

def trigger_heatmap_update(triggering_complaint=None):
    try:
        url = f"{get_supabase_url()}/rest/v1/complaints?select=*"
        resp = requests.get(url, headers=get_supabase_headers())
        if resp.status_code == 200:
            complaints = resp.json()
            if complaints:
                df = pd.DataFrame(complaints)
                pipeline_output = process_heatmap_pipeline(df)
                
                # Simple duplicate prevention for critical complaints:
                # Only notify if the triggering complaint itself just landed in a high-risk zone
                if triggering_complaint:
                    t_id = triggering_complaint.get("id")
                    zone_id = None
                    for dp in pipeline_output.get("heatmap_data_points", []):
                        if dp.get("source_id") == t_id:
                            zone_id = dp.get("heatmap_zone_id")
                            break
                    if zone_id:
                        for z in pipeline_output.get("heatmap_zones", []):
                            if z.get("id") == zone_id and z.get("risk_score", 0) >= 60:
                                notify_critical_complaint(triggering_complaint, z.get("risk_score"))
                                break

                persist_heatmap_results(pipeline_output)
    except Exception as e:
        print(f"Heatmap update failed: {e}")

@complaints_api.route("", methods=["POST"])
@complaints_api.route("/", methods=["POST"])
def create_complaint():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    payload = {
        "description": data.get("description", ""),
        "category": data.get("category", "General"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "image_url": data.get("image_url"),
        "status": "pending",
        "upvote_count": 0,
        "jurisdiction": data.get("jurisdiction", "Mumbai North")
    }
    
    payload["status"] = data.get("status", "pending")
    if "citizen_id" in data:
        payload["citizen_id"] = data["citizen_id"]
    
    url = f"{get_supabase_url()}/rest/v1/complaints"
    headers = get_supabase_headers()
    headers["Prefer"] = "return=representation"
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code not in [200, 201, 204]:
            return jsonify({"error": f"Failed to insert: {resp.text}"}), 400
            
        complaint = resp.json()[0] if isinstance(resp.json(), list) else resp.json()
        
        # Notify citizen
        notify_complaint_submitted(complaint)
        
        # Trigger Assignment Engine automatically
        assign_result = assign_complaint_authority(complaint)
        print(f"Auto-assignment result: {assign_result}")
        if assign_result and assign_result.get("assigned"):
            complaint["assigned_authority_id"] = assign_result.get("authority_id")
            notify_complaint_assigned(complaint)
        
        # Trigger Heatmap ML Pipeline
        trigger_heatmap_update(triggering_complaint=complaint)
        
        return jsonify(complaint), 200
        
    except Exception as e:
        print(f"Error creating complaint: {e}")
        return jsonify({"error": str(e)}), 500

@complaints_api.route("/<complaint_id>/status", methods=["POST"])
def update_status(complaint_id):
    data = request.json
    new_status = data.get("status")
    authority_id = data.get("authority_id")
    
    if not new_status or not authority_id:
        return jsonify({"error": "status and authority_id required"}), 400
        
    try:
        authority = _fetch_one("authorities", "id", authority_id)
        if not authority:
            return jsonify({"error": "Authority not found"}), 404
            
        old_complaint = _fetch_one("complaints", "id", complaint_id)
        if not old_complaint:
            return jsonify({"error": "Complaint not found"}), 404
        old_status = old_complaint.get("status")
        
        if (old_status or "").strip().lower() == new_status.strip().lower():
            return jsonify({"success": True, "complaint": old_complaint, "message": "Status unchanged"})
        
        complaint = _update("complaints", complaint_id, {"status": new_status})
        if not complaint:
            return jsonify({"error": "Update failed"}), 404
        
        citizen = _fetch_one("citizens", "id", complaint.get("citizen_id")) if complaint.get("citizen_id") else None
                
        msg = f"Complaint moved to {new_status}"
        log_complaint_action(complaint_id, authority_id, "STATUS_CHANGED", msg)
        
        if new_status.lower() == "reopened":
            notify_complaint_reopened(complaint, old_status, new_status)
        else:
            notify_status_changed(complaint, old_status, new_status)
        
        if new_status == "in_progress" and citizen:
            send_status_in_progress_email(citizen, complaint, authority.get("department", "Authority"))
        elif new_status == "resolved" and citizen:
            send_resolved_email(citizen, complaint, authority.get("department", "Authority"))
                
        return jsonify({"success": True, "complaint": complaint})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@complaints_api.route("/<complaint_id>/upvote", methods=["POST"])
def upvote_complaint(complaint_id):
    try:
        complaint = _fetch_one("complaints", "id", complaint_id)
        if not complaint:
            return jsonify({"error": "Complaint not found"}), 404
        
        previous_count = complaint.get("upvote_count", 0)
        new_count = previous_count + 1
        
        updated_complaint = _update("complaints", complaint_id, {"upvote_count": new_count})
        if not updated_complaint:
            return jsonify({"error": "Failed to update upvotes"}), 500
            
        notify_threshold_reached(updated_complaint, previous_count)
            
        if previous_count < COMMUNITY_THRESHOLD and new_count >= COMMUNITY_THRESHOLD:
            citizen = _fetch_one("citizens", "id", updated_complaint.get("citizen_id")) if updated_complaint.get("citizen_id") else None
            if citizen:
                send_threshold_citizen_email(citizen, updated_complaint)
            
            authority = _fetch_one("authorities", "id", updated_complaint.get("assigned_authority_id")) if updated_complaint.get("assigned_authority_id") else None
            if authority:
                send_threshold_authority_email(authority, updated_complaint)
                    
        return jsonify({"success": True, "upvote_count": new_count})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@complaints_api.route("/<complaint_id>/assign", methods=["POST"])
def assign_authority(complaint_id):
    try:
        complaint = _fetch_one("complaints", "id", complaint_id)
        if not complaint:
            return jsonify({"error": "Complaint not found"}), 404
            
        result = assign_complaint_authority(complaint)
        if result.get("assigned"):
            complaint["assigned_authority_id"] = result.get("authority_id")
            notify_complaint_assigned(complaint)
            
        return jsonify(result), 200 if result.get("assigned") else 400
        
    except Exception as e:
        print(f"Assignment error: {e}")
        return jsonify({"error": str(e)}), 500
