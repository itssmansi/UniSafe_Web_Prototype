import React from 'react';
import { severityStyles, getCategoryIcon } from '../map/ComplaintMarker';

export default function ComplaintCard({
  complaint,
  onStatusChange,
  onOpenAssign,
  onSelect,
}) {
  const icon = getCategoryIcon(complaint.category);
  const severityStyle = severityStyles[complaint.severity] || severityStyles.medium;

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-md hover:border-slate-600 transition-all flex flex-col gap-3 group">
      {/* Top row: Category & Severity */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="font-bold text-xs text-white tracking-wide">{complaint.category}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${severityStyle}`}>
          {complaint.severity}
        </span>
      </div>

      {/* Description */}
      <p
        onClick={() => onSelect && onSelect(complaint)}
        className="text-xs text-slate-300 line-clamp-3 leading-relaxed cursor-pointer hover:text-white transition"
      >
        {complaint.description}
      </p>

      {/* Photo thumbnail if present */}
      {complaint.original_photo_url && (
        <div
          onClick={() => onSelect && onSelect(complaint)}
          className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-700 cursor-pointer"
        >
          <img
            src={complaint.original_photo_url}
            alt="Complaint preview"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent flex items-end p-2">
            <span className="text-[10px] text-slate-300 font-medium">📸 View Evidence</span>
          </div>
        </div>
      )}

      {/* Meta info & Assigned Department */}
      <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-1.5 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>By: <strong className="text-slate-200 font-medium">{complaint.citizen_name || 'Citizen'}</strong></span>
          <span>#{complaint.id}</span>
        </div>

        {complaint.assigned_department ? (
          <div className="flex items-center gap-1.5 text-blue-400 font-medium bg-blue-950/40 border border-blue-800/30 px-2 py-1 rounded-lg">
            <span>🏢</span>
            <span className="truncate">{complaint.assigned_department}</span>
          </div>
        ) : (
          <div className="text-amber-400/80 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded-lg text-center font-medium">
            ⚠️ Unassigned
          </div>
        )}
      </div>

      {/* Actions row based on current status */}
      <div className="pt-1 flex items-center gap-1.5">
        {complaint.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={() => onOpenAssign && onOpenAssign(complaint)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-2 rounded-xl text-[11px] transition shadow-sm"
            >
              Assign Dept
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(complaint.id, 'in_progress')}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-1.5 px-2 rounded-xl text-[11px] transition"
              title="Start Work directly"
            >
              Start ➔
            </button>
          </>
        )}

        {complaint.status === 'in_progress' && (
          <button
            type="button"
            onClick={() => onStatusChange(complaint.id, 'resolved')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-2 rounded-xl text-[11px] transition shadow-sm flex items-center justify-center gap-1"
          >
            <span>✅</span> Mark Resolved
          </button>
        )}

        {complaint.status === 'resolved' && (
          <button
            type="button"
            onClick={() => onStatusChange(complaint.id, 'in_progress')}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-1.5 px-2 rounded-xl text-[11px] transition"
          >
            ↺ Reopen Issue
          </button>
        )}
      </div>
    </div>
  );
}
