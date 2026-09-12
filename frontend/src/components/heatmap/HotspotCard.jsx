import React from 'react';

export default function HotspotCard({ zone, isSelected, onSelect }) {
  const { zone_type, severity, complaint_count, radius_meters } = zone;

  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let accentBar = 'bg-[#10B981]';
  if (severity === 'MEDIUM') {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    accentBar = 'bg-[#D97706]';
  }
  if (severity === 'HIGH') {
    badgeStyle = 'bg-red-50 text-red-700 border-red-200';
    accentBar = 'bg-[#DC2626]';
  }

  return (
    <div
      onClick={() => onSelect(zone)}
      className={`relative p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer text-left border flex flex-col justify-between font-sans overflow-hidden group ${
        isSelected
          ? 'bg-white border-[#0B192C] ring-2 ring-[#0B192C]/20 shadow-md translate-x-1'
          : 'bg-white border-gray-200/90 hover:border-gray-300 hover:shadow-xs hover:translate-x-0.5'
      }`}
    >
      {/* Thermal Accent Strip */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${accentBar}`} />

      <div className="pl-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-[#0B192C] capitalize text-sm truncate">
            {zone_type || 'General Hotspot'}
          </h4>
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border uppercase tracking-wider ${badgeStyle}`}
          >
            {severity}
          </span>
        </div>

        <div className="mt-2 text-xs text-[#64748B] font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#0B192C]">{complaint_count || 0}</span>
            <span>reports</span>
            <span className="text-gray-300">·</span>
            <span>{radius_meters}m radius</span>
          </div>

          <span className="text-[11px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            Locate →
          </span>
        </div>
      </div>
    </div>
  );
}
