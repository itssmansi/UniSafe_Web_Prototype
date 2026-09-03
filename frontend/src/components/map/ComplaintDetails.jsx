import React from 'react';
import { ISSUE_CATEGORIES, KANBAN_COLUMNS } from '../../services/complaintService';

export default function ComplaintDetails({
  complaint,
  onClose,
  onStatusChange,
  onUpvote,
}) {
  if (!complaint) return null;

  const categoryInfo = ISSUE_CATEGORIES[complaint.category] || ISSUE_CATEGORIES.infrastructure;
  const currentCol = KANBAN_COLUMNS.find((c) => c.id === complaint.status) || KANBAN_COLUMNS[0];

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header Banner colored with Category's Flutter Color */}
      <div
        className="p-5 text-white flex items-start justify-between transition-colors shadow-sm"
        style={{ backgroundColor: categoryInfo.color }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
            {categoryInfo.icon}
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-extrabold bg-black/20 px-2 py-0.5 rounded-md">
              {categoryInfo.label}
            </span>
            <h3 className="font-bold text-lg leading-tight mt-1">{complaint.title}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-black/15 transition text-lg"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-600">
        {/* Subcategory & Status row */}
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {complaint.subcategory || categoryInfo.label}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: currentCol.color }}
            >
              ● {currentCol.name}
            </span>
            {/* Upvote Button */}
            <button
              type="button"
              onClick={() => onUpvote && onUpvote(complaint.id)}
              className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition flex items-center gap-1 shadow-sm"
              title="Upvote to increase urgency"
            >
              <span>▲ Upvote</span>
              <span className="bg-amber-200 px-1.5 py-0.2 rounded-full text-[10px]">
                {complaint.upvote_count || 1}
              </span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Description
          </h4>
          <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {complaint.description}
          </p>
        </div>

        {/* Location & Meta info */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-base">📍</span>
            <div>
              <span className="text-slate-400 block font-medium">Location Landmark</span>
              <span className="font-semibold text-slate-800">{complaint.address || 'Campus Map Area'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div>
              <span className="text-slate-400 block">Reported Time</span>
              <span className="font-medium text-slate-700">
                {new Date(complaint.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Coordinates</span>
              <span className="font-mono text-slate-700">
                {complaint.latitude?.toFixed(4)}, {complaint.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Evidence Photo */}
        {complaint.image_url && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Attached Photo
            </h4>
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-44">
              <img
                src={complaint.image_url}
                alt="Reported evidence"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Authority Actions: Move across the 4 Kanban columns */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Update Workflow Status:
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {KANBAN_COLUMNS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => onStatusChange && onStatusChange(complaint.id, col.id)}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition text-center ${
                complaint.status === col.id
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              style={{
                backgroundColor: complaint.status === col.id ? col.color : undefined,
              }}
            >
              {col.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
