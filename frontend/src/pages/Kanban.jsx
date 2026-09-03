import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/complaintService';
import KanbanBoard from '../components/kanban/KanbanBoard';
import AssignmentModal from '../components/kanban/AssignmentModal';
import ComplaintDetails from '../components/map/ComplaintDetails';

const DEPARTMENTS = [
  'All Departments',
  'Road Maintenance & Infrastructure',
  'Electrical & Streetlight Division',
  'Sanitation & Solid Waste Management',
  'Water Supply & Sewage Board',
  'Campus Quick Response Unit',
];

export default function KanbanPage() {
  const [complaints, setComplaints] = useState([]);
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [severityFilter, setSeverityFilter] = useState('All');

  // Live synchronization via complaintService
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

  // Status transition handler
  const handleStatusChange = async (id, newStatus) => {
    await complaintService.updateComplaintStatus(id, newStatus);
  };

  // Department assignment handler
  const handleAssignSubmit = async (complaintId, authorityId, department) => {
    await complaintService.assignComplaint(complaintId, authorityId, department);
    setAssigningComplaint(null);
  };

  // Filter complaints based on search query, department, and severity
  const filteredComplaints = complaints.filter((c) => {
    const matchSearch =
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDept =
      departmentFilter === 'All Departments' ||
      (c.assigned_department &&
        c.assigned_department.toLowerCase() === departmentFilter.toLowerCase());

    const matchSeverity =
      severityFilter === 'All' || c.severity.toLowerCase() === severityFilter.toLowerCase();

    return matchSearch && matchDept && matchSeverity;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header & Metrics Bar */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                UniSafe <span className="text-blue-500 font-medium text-lg">Authority Kanban</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Triage, assign, and track lifecycle of campus civic complaints
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues, IDs..."
                className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-60"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Kanban Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <KanbanBoard
          complaints={filteredComplaints}
          onStatusChange={handleStatusChange}
          onOpenAssign={(c) => setAssigningComplaint(c)}
          onSelectComplaint={(c) => setSelectedComplaint(c)}
        />
      </main>

      {/* Assignment Modal */}
      {assigningComplaint && (
        <AssignmentModal
          complaint={assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
          onAssign={handleAssignSubmit}
        />
      )}

      {/* Complaint Details Modal (on card click) */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <ComplaintDetails
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onStatusChange={handleStatusChange}
            onOpenAssign={(c) => {
              setSelectedComplaint(null);
              setAssigningComplaint(c);
            }}
          />
        </div>
      )}
    </div>
  );
}
