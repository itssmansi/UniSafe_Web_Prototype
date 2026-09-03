import React, { useState, useEffect } from 'react';
import InteractiveMap from '../components/map/InteractiveMap';
import { complaintService } from '../services/complaintService';

export default function MapPage({ onBack }) {
  const [complaints, setComplaints] = useState([]);
  
  useEffect(() => {
    const unsubscribe = complaintService.subscribe((data) => {
      setComplaints(data);
    });
    return unsubscribe;
  }, []);

  const handleMapClick = async (coords) => {
    // Quick mock for adding a new pin on click (simulating the flutter bottom sheet)
    const title = window.prompt("Enter issue title for this location:");
    if (!title) return;
    
    await complaintService.createComplaint({
      title,
      latitude: coords.lat,
      longitude: coords.lng,
      category: 'infrastructure' // defaulting for the quick mock
    });
  };

  const handleMarkerClick = (complaint) => {
    alert(`Complaint: ${complaint.title}\nStatus: ${complaint.status}`);
  };

  return (
    <div className="w-full h-screen p-0 m-0 overflow-hidden">
      <InteractiveMap 
        onBack={onBack} 
        complaints={complaints}
        onMapClick={handleMapClick}
        onMarkerClick={handleMarkerClick}
      />
    </div>
  );
}
