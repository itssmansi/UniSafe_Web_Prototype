import os
from flask import Blueprint, jsonify, request
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

main = Blueprint("main", __name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@main.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "Backend is running"
    })

@main.route("/complaints", methods=["GET"])
def get_complaints():
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        response = supabase.table("complaints").select("*").execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route("/kanban/tasks", methods=["GET"])
def get_kanban_tasks():
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        tasks = []
        
        # Helper to normalize status strings to kanban columns
        def map_to_kanban_status(st):
            if not st:
                return "planned"
            s = str(st).strip().lower().replace("_", "-")
            if s in ["pending", "open", "planned"]:
                return "planned"
            elif s in ["in-progress", "inprogress", "active"]:
                return "in-progress"
            elif s in ["in-review", "inreview", "review"]:
                return "in-review"
            elif s in ["resolved", "done", "closed", "verified"]:
                return "done"
            return "planned"

        # 1. Fetch complaints from the complaints table (sorted by upvote_count descending)
        comp_res = supabase.table("complaints").select("*").order("upvote_count", desc=True).execute()
        complaints = comp_res.data or []
        for c in complaints:
            upvotes = c.get("upvote_count") or 0
            tasks.append({
                "id": c.get("id"),
                "title": c.get("category") or c.get("title") or "Civic Issue",
                "description": c.get("description") or "",
                "category": c.get("category") or "General",
                "status": map_to_kanban_status(c.get("status")),
                "upvote_count": upvotes,
                "severity": "HIGH" if upvotes >= 10 else "MEDIUM" if upvotes >= 5 else "LOW",
                "created_at": c.get("created_at"),
                "authority_image_url": c.get("authority_image_url") or c.get("image_url"),
                "assigned_authority_id": c.get("assigned_authority_id"),
                "source_type": "complaint"
            })

        # 2. Fetch heatmap zones from heatmap_zones table
        zone_res = supabase.table("heatmap_zones").select("*").execute()
        zones = zone_res.data or []
        existing_ids = set(t["id"] for t in tasks)
        for z in zones:
            if z.get("id") not in existing_ids:
                tasks.append({
                    "id": z.get("id"),
                    "title": f"Zone: {z.get('zone_type', 'Hotspot')}",
                    "description": f"Civic Hotspot Cluster ({z.get('radius_meters', 100)}m radius)",
                    "category": z.get("zone_type") or "Hotspot",
                    "status": map_to_kanban_status(z.get("status")),
                    "upvote_count": 0,
                    "severity": z.get("severity") or "MEDIUM",
                    "created_at": z.get("created_at"),
                    "authority_image_url": z.get("authority_image_url"),
                    "assigned_authority_id": z.get("assigned_authority_id"),
                    "source_type": "zone"
                })

        return jsonify(tasks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from app.services.notification_service import create_notification

@main.route("/kanban/tasks/<zone_id>/status", methods=["PUT"])
def update_task_status(zone_id):
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        data = request.json
        status = data.get("status")
        
        # Map kanban status to complaint status
        comp_status_map = {
            "planned": "pending",
            "in-progress": "in_progress",
            "in-review": "in_review",
            "done": "resolved"
        }
        comp_status = comp_status_map.get(status, "pending")

        # Update complaints table
        comp_resp = supabase.table("complaints").update({"status": comp_status}).eq("id", zone_id).execute()

        # Update heatmap_zones table
        zone_resp = supabase.table("heatmap_zones").update({"status": status}).eq("id", zone_id).execute()

        zone_data = (zone_resp.data[0] if zone_resp.data else None) or (comp_resp.data[0] if comp_resp.data else {})
        if zone_data:
            create_notification(
                title="Complaint status changed",
                body=f"Issue was moved to {status}."
            )
            if status == "done":
                create_notification(
                    title="Complaint resolved",
                    body=f"Issue was resolved."
                )

        return jsonify(zone_data or {"status": status})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route("/kanban/tasks/<zone_id>/resolve", methods=["POST"])
def resolve_task(zone_id):
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        data = request.json
        image_url = data.get("authority_image_url")
        
        # Update complaints table
        supabase.table("complaints").update({
            "status": "in_review",
            "authority_image_url": image_url
        }).eq("id", zone_id).execute()

        # Update heatmap_zones table
        response = supabase.table("heatmap_zones").update({
            "status": "in-review",
            "authority_image_url": image_url
        }).eq("id", zone_id).execute()
        
        zone_data = response.data[0] if response.data else {}
        if zone_data:
            create_notification(
                title="Authority puts resolution in review",
                body=f"The issue resolution is now in review."
            )
                
        return jsonify(zone_data or {"status": "in-review"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route("/kanban/tasks/<zone_id>/verify", methods=["POST"])
def verify_task(zone_id):
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        data = request.json
        image_url = data.get("image_url")
        
        # Insert verification record
        supabase.table("complaint_verifications").insert({
            "zone_id": zone_id,
            "image_url": image_url,
            "is_verified": True
        }).execute()
        
        # Update complaints table to resolved
        comp_resp = supabase.table("complaints").update({
            "status": "resolved"
        }).eq("id", zone_id).execute()

        # Update heatmap_zones table to done
        response = supabase.table("heatmap_zones").update({
            "status": "done"
        }).eq("id", zone_id).execute()
        
        return jsonify(response.data[0] if response.data else (comp_resp.data[0] if comp_resp.data else {}))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route("/kanban/tasks/<zone_id>/reject", methods=["POST"])
def reject_task(zone_id):
    if not supabase:
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        data = request.json
        image_url = data.get("image_url")
        
        # Insert verification record
        supabase.table("complaint_verifications").insert({
            "zone_id": zone_id,
            "image_url": image_url,
            "is_verified": False
        }).execute()
        
        # Update complaints table back to in_progress
        comp_resp = supabase.table("complaints").update({
            "status": "in_progress"
        }).eq("id", zone_id).execute()

        # Update heatmap_zones table back to in-progress
        response = supabase.table("heatmap_zones").update({
            "status": "in-progress"
        }).eq("id", zone_id).execute()
        
        return jsonify(response.data[0] if response.data else (comp_resp.data[0] if comp_resp.data else {}))
    except Exception as e:
        return jsonify({"error": str(e)}), 500