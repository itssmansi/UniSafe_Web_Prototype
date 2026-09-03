import React from 'react';

// Status styling
const statusColors = {
  pending: {
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    ring: 'ring-amber-400/30',
    text: 'text-amber-600',
    label: 'Pending',
  },
  in_progress: {
    bg: 'bg-blue-600',
    border: 'border-blue-300',
    ring: 'ring-blue-400/30',
    text: 'text-blue-600',
    label: 'In Progress',
  },
  resolved: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-300',
    ring: 'ring-emerald-400/30',
    text: 'text-emerald-600',
    label: 'Resolved',
  },
};

// Severity badge styling
const severityStyles = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
};

// Category icon helper
const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'streetlight':
      return '💡';
    case 'pothole':
      return '🕳️';
    case 'garbage':
      return '🗑️';
    case 'water leak':
      return '💧';
    case 'safety':
      return '🚨';
    default:
      return '📍';
  }
};

export default function ComplaintMarker({ complaint, isSelected, onClick }) {
  const status = statusColors[complaint.status] || statusColors.pending;
  const icon = getCategoryIcon(complaint.category);

  return (
    <button
      type="button"
      onClick={() => onClick(complaint)}
      className={`group relative flex flex-col items-center transition-all duration-200 transform -translate-x-1/2 -translate-y-full hover:scale-110 focus:outline-none ${
        isSelected ? 'scale-125 z-30' : 'z-10'
      }`}
      title={`${complaint.category}: ${complaint.description}`}
    >
      {/* Tooltip on hover */}
      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center whitespace-nowrap z-40">
        <div className="bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-xl flex items-center gap-2">
          <span className="font-semibold">{complaint.category}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            complaint.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-200'
          }`}>
            {complaint.severity}
          </span>
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
      </div>

      {/* Pin Body */}
      <div
        className={`w-9 h-9 rounded-full ${status.bg} border-2 ${status.border} shadow-lg flex items-center justify-center text-base text-white ring-4 ${status.ring}`}
      >
        <span>{icon}</span>
      </div>

      {/* Pin pointer tip */}
      <div className={`w-2.5 h-2.5 ${status.bg} rotate-45 -mt-1 rounded-sm shadow-sm`} />
    </button>
  );
}

export { statusColors, severityStyles, getCategoryIcon };
