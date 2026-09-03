import React, { useState, useEffect } from 'react';
import { complaintService, ISSUE_CATEGORIES } from '../services/complaintService';
import InteractiveMap from '../components/map/InteractiveMap';
import ComplaintDetails from '../components/map/ComplaintDetails';
import ComplaintModal from '../components/map/ComplaintModal';

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [hiddenCategories, setHiddenCategories] = useState(new Set());

  // Subscribe to live complaints
  useEffect(() => {
    const unsubscribe = complaintService.subscribe((data) => {
      setComplaints(data);
      if (selectedComplaint) {
        const updated = data.find((c) => c.id === selectedComplaint.id);
        setSelectedComplaint(updated || null);
      }
    });
    return unsubscribe;
  }, [selectedComplaint]);

  // Handle map click to pin & open report modal
  const handleMapClick = (coords) => {
    setPinnedCoords(coords);
    setIsReportModalOpen(true);
  };

  // Submit report
  const handleCreateReport = async (data) => {
    await complaintService.createComplaint(data);
    setIsReportModalOpen(false);
  };

  // Update status
  const handleStatusChange = async (id, newStatus) => {
    await complaintService.updateComplaintStatus(id, newStatus);
  };

  // Upvote
  const handleUpvote = async (id) => {
    await complaintService.upvoteComplaint(id);
  };

  // Toggle category visibility
  const toggleCategory = (catKey) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) {
        next.delete(catKey);
      } else {
        next.add(catKey);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header & Metrics Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                UniSafe <span className="text-blue-500 font-semibold text-lg">Interactive Map</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Community civic issue reporting & live resolution tracking
            </p>
          </div>

          {/* Category Filter Chips (Ported from Flutter kCategoryStyles) */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(ISSUE_CATEGORIES).map(([key, cat]) => {
              const isHidden = hiddenCategories.has(key);
              const count = complaints.filter((c) => c.category === key).length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCategory(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                    isHidden
                      ? 'bg-slate-800 border-slate-700 text-slate-500 line-through opacity-60'
                      : 'text-white'
                  }`}
                  style={{
                    backgroundColor: isHidden ? undefined : cat.color,
                    borderColor: isHidden ? undefined : cat.color,
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="bg-black/25 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => {
                setPinnedCoords({ lat: 28.6139, lng: 77.2090 });
                setIsReportModalOpen(true);
              }}
              className="ml-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <span>➕</span> Report Issue
            </button>
          </div>
        </div>
      </header>

      {/* Main Map Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full relative">
        <InteractiveMap
          complaints={complaints}
          selectedComplaint={selectedComplaint}
          onSelectComplaint={(complaint) => setSelectedComplaint(complaint)}
          onMapClick={handleMapClick}
          hiddenCategories={hiddenCategories}
        />

        {/* Selected Complaint Floating Details Drawer */}
        {selectedComplaint && (
          <div className="absolute top-8 right-8 z-40 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
            <ComplaintDetails
              complaint={selectedComplaint}
              onClose={() => setSelectedComplaint(null)}
              onStatusChange={handleStatusChange}
              onUpvote={handleUpvote}
            />
          </div>
        )}
      </main>

      {/* Report Modal */}
      <ComplaintModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleCreateReport}
        defaultCoords={pinnedCoords}
      />
    </div>
  );
}
