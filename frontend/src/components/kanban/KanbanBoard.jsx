import React from 'react';
import ComplaintCard from './ComplaintCard';

const COLUMNS = [
  {
    id: 'pending',
    title: 'Pending Review',
    subtitle: 'New civic reports awaiting assignment',
    color: 'border-amber-500/50',
    dot: 'bg-amber-500',
    badge: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    subtitle: 'Assigned & actively being resolved',
    color: 'border-blue-500/50',
    dot: 'bg-blue-500',
    badge: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  },
  {
    id: 'resolved',
    title: 'Resolved / Completed',
    subtitle: 'Issues fixed with resolution proof',
    color: 'border-emerald-500/50',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  },
];

export default function KanbanBoard({
  complaints = [],
  onStatusChange,
  onOpenAssign,
  onSelectComplaint,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {COLUMNS.map((col) => {
        const colComplaints = complaints.filter((c) => c.status === col.id);

        return (
          <div
            key={col.id}
            className={`bg-slate-900/60 backdrop-blur-md rounded-3xl border ${col.color} p-4 flex flex-col min-h-[600px] shadow-xl`}
          >
            {/* Column Header */}
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${col.dot} shadow-sm`} />
                <div>
                  <h2 className="font-bold text-sm text-white">{col.title}</h2>
                  <p className="text-[11px] text-slate-400">{col.subtitle}</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${col.badge}`}>
                {colComplaints.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {colComplaints.length === 0 ? (
                <div className="h-44 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4 text-slate-500">
                  <span className="text-2xl mb-1">📭</span>
                  <p className="text-xs font-medium">No complaints in this column</p>
                </div>
              ) : (
                colComplaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onStatusChange={onStatusChange}
                    onOpenAssign={onOpenAssign}
                    onSelect={onSelectComplaint}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
