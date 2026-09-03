import React from 'react';
import { ISSUE_CATEGORIES, KANBAN_COLUMNS } from '../../services/complaintService';

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate || Date.now());
  const end = new Date(endDate || Date.now() + 86400000 * 2);

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `${startStr} - ${endStr}`;
}

export default function ComplaintCard({
  complaint,
  onStatusChange,
  onSelect,
}) {
  const categoryInfo = ISSUE_CATEGORIES[complaint.category] || ISSUE_CATEGORIES.infrastructure;
  const currentCol = KANBAN_COLUMNS.find((c) => c.id === complaint.status) || KANBAN_COLUMNS[0];

  return (
    <div
      onClick={() => onSelect && onSelect(complaint)}
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-200 transition-all cursor-pointer flex flex-col gap-2.5 group"
    >
      {/* Title & Owner Avatar Row (Ported from Flutter _buildTaskCard) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md text-white shadow-xs"
              style={{ backgroundColor: categoryInfo.color }}
            >
              {categoryInfo.icon} {complaint.subcategory || categoryInfo.label}
            </span>
          </div>
          <h4 className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 transition leading-snug">
            {complaint.title}
          </h4>
        </div>

        {/* Owner Avatar */}
        {complaint.owner && (
          <div className="relative shrink-0">
            {complaint.owner.image ? (
              <img
                src={complaint.owner.image}
                alt={complaint.owner.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                {complaint.owner.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description Snippet */}
      {complaint.description && (
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>
      )}

      {/* Date Range (Ported from Flutter shortDateFormatter - dateFormatter) */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1 font-medium">
          <span>📅</span>
          <span>{formatDateRange(complaint.start_date, complaint.end_date)}</span>
        </div>
        <div className="flex items-center gap-1 font-semibold text-amber-600">
          <span>▲</span>
          <span>{complaint.upvote_count || 1}</span>
        </div>
      </div>

      {/* Quick Move Across 4 Columns on hover/focus */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pt-2 flex items-center gap-1 border-t border-slate-100"
      >
        <span className="text-[10px] text-slate-400 mr-1 font-medium">Move:</span>
        {KANBAN_COLUMNS.map((col) => {
          const isCurrent = col.id === complaint.status;
          return (
            <button
              key={col.id}
              type="button"
              disabled={isCurrent}
              onClick={() => onStatusChange(complaint.id, col.id)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition ${
                isCurrent
                  ? 'text-white opacity-90 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              style={{
                backgroundColor: isCurrent ? col.color : undefined,
              }}
              title={`Move to ${col.name}`}
            >
              {col.name.slice(0, 4)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
