import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/complaintService';
import InteractiveMap from '../components/map/InteractiveMap';
import ComplaintDetails from '../components/map/ComplaintDetails';
import ComplaintModal from '../components/map/ComplaintModal';
import AssignmentModal from '../components/kanban/AssignmentModal';

const CATEGORIES = ['All', 'Streetlight', 'Pothole', 'Garbage', 'Water Leak', 'Safety'];

export default function MapPage() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Subscribe to complaints service for live sync
  useEffect(() => {
    const unsubscribe = complaintService.subscribe((data) => {
      setComplaints(data);
      // Keep selected complaint in sync
      if (selectedComplaint) {
        const updated = data.find((c) => c.id === selectedComplaint.id);
        setSelectedComplaint(updated || null);
      }
    });
    return unsubscribe;
  }, [selectedComplaint]);

  // Handle map click to drop pin & open report modal
  const handleMapClick = (coords) => {
    setClickedCoords(coords);
    setSelectedComplaint(null);
    setIsReportModalOpen(true);
  };

  // Submit new complaint
  const handleCreateComplaint = async (formData) => {
    await complaintService.createComplaint(formData);
    setIsReportModalOpen(false);
  };

  // Quick status transition from drawer
  const handleStatusChange = async (id, newStatus) => {
    await complaintService.updateComplaintStatus(id, newStatus);
  };

  // Assign authority from modal
  const handleAssignSubmit = async (complaintId, authorityId, department) => {
    await complaintService.assignComplaint(complaintId, authorityId, department);
    setAssigningComplaint(null);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchCat = categoryFilter === 'All' || c.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || c.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchCat && matchStatus;
  });

  // Calculate quick stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header & Metrics Bar */}
      <header className="bg-slate-950/80 border-b border-slate-800 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                UniSafe <span className="text-blue-500 font-medium text-lg">Civic Map</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live geo-spatial tracking of campus & municipal complaints
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-slate-400">Total:</span>
              <span className="font-bold text-white">{totalCount}</span>
            </div>
            <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl px-3 py-1.5 flex items-center gap-2 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending:</span>
              <span className="font-bold">{pendingCount}</span>
            </div>
            <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl px-3 py-1.5 flex items-center gap-2 text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>In Progress:</span>
              <span className="font-bold">{inProgressCount}</span>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl px-3 py-1.5 flex items-center gap-2 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Resolved:</span>
              <span className="font-bold">{resolvedCount}</span>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={() => {
                setClickedCoords({ lat: 19.0760, lng: 72.8777 });
                setIsReportModalOpen(true);
              }}
              className="ml-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
            >
              <span>➕</span> Report Issue
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span>Filter by:</span>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Map Viewport */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full relative">
        <InteractiveMap
          complaints={filteredComplaints}
          selectedComplaint={selectedComplaint}
          onSelectComplaint={(complaint) => setSelectedComplaint(complaint)}
          onMapClick={handleMapClick}
        />

        {/* Floating Complaint Details Drawer/Card */}
        {selectedComplaint && (
          <div className="absolute top-8 right-8 z-30 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
            <ComplaintDetails
              complaint={selectedComplaint}
              onClose={() => setSelectedComplaint(null)}
              onStatusChange={handleStatusChange}
              onOpenAssign={(c) => setAssigningComplaint(c)}
            />
          </div>
        )}
      </main>

      {/* Citizen Report Modal */}
      <ComplaintModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleCreateComplaint}
        defaultCoords={clickedCoords || { lat: 19.0760, lng: 72.8777 }}
      />

      {/* Authority Assignment Modal */}
      {assigningComplaint && (
        <AssignmentModal
          complaint={assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
          onAssign={handleAssignSubmit}
        />
      )}
    </div>
  );
}
