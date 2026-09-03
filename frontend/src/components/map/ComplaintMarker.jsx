import React from 'react';
import { ISSUE_CATEGORIES } from '../../services/complaintService';

export default function ComplaintMarker({ complaint, isSelected, onClick }) {
  const categoryInfo = ISSUE_CATEGORIES[complaint.category] || ISSUE_CATEGORIES.infrastructure;
  const pinColor = categoryInfo.color;
  const glowColor = categoryInfo.glowColor;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(complaint);
      }}
      className={`relative cursor-pointer transition-transform duration-200 group transform -translate-x-1/2 -translate-y-full ${
        isSelected ? 'scale-125 z-40' : 'hover:scale-115 z-20'
      }`}
      title={`${complaint.title} (${categoryInfo.label})`}
    >
      {/* Tooltip on hover */}
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-50">
        <div className="bg-slate-900/95 text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2">
          <span className="font-bold">{categoryInfo.icon} {complaint.subcategory || categoryInfo.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase bg-slate-800 text-slate-300">
            ▲ {complaint.upvote_count || 1}
          </span>
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
      </div>

      {/* Teardrop Pin Shape ported directly from Flutter MapPinShape */}
      <div
        className="flex items-center justify-center transition-all duration-300"
        style={{
          width: '42px',
          height: '42px',
          transform: 'rotate(45deg)',
          backgroundColor: pinColor,
          borderRadius: '24px 24px 4px 24px', // Flutter teardrop radius
          border: isSelected ? '3px solid #F59E0B' : '2.5px solid #FFFFFF',
          boxShadow: `0 4px 14px ${glowColor}, 0 2px 6px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Counter-rotate icon inside by -45deg so it stays upright */}
        <span
          className="text-base select-none"
          style={{ transform: 'rotate(-45deg)', color: '#ffffff' }}
        >
          {categoryInfo.icon}
        </span>
      </div>

      {/* Pulse effect if selected or urgent */}
      {isSelected && (
        <span
          className="absolute -inset-1 rounded-full animate-ping opacity-40 pointer-events-none"
          style={{ backgroundColor: pinColor }}
        />
      )}
    </div>
  );
}
