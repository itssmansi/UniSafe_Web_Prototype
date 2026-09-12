import React from 'react';

export default function HeatmapLegend({
  categoryConfig,
  viewMode = 'hybrid',
  counts = { LOW: 0, MEDIUM: 0, HIGH: 0 }
}) {
  const gradientCss = categoryConfig?.gradientCss || 'linear-gradient(to right, #3B82F6 0%, #06B6D4 25%, #10B981 50%, #F59E0B 72%, #F97316 88%, #DC2626 100%)';
  const categoryLabel = categoryConfig?.label || 'All Issues';
  const themeColor = categoryConfig?.themeColor || '#0B192C';

  return (
    <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-3.5 shadow-lg text-xs text-[#0B192C] font-sans w-72 transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: themeColor }}
          />
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-[#0B192C] truncate max-w-[150px]">
            {categoryLabel}
          </span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
          {viewMode}
        </span>
      </div>

      {/* Dynamic Thermal Gradient Bar */}
      <div className="space-y-1.5 mb-3">
        <div 
          className="w-full h-3 rounded-full shadow-inner border border-black/10 transition-all duration-300"
          style={{ background: gradientCss }}
        />
        <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-tight px-0.5">
          <span>Low Density</span>
          <span>Moderate</span>
          <span>Critical Core</span>
        </div>
      </div>

      {/* Severity Breakdown Badges */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200/60 rounded-lg p-1.5 text-center">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
            <span className="text-[9px] font-bold text-emerald-800">LOW</span>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-900 mt-0.5">
            {counts.LOW || 0}
          </span>
        </div>

        <div className="flex flex-col items-center bg-amber-50 border border-amber-200/60 rounded-lg p-1.5 text-center">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            <span className="text-[9px] font-bold text-amber-800">MED</span>
          </div>
          <span className="text-[11px] font-extrabold text-amber-900 mt-0.5">
            {counts.MEDIUM || 0}
          </span>
        </div>

        <div className="flex flex-col items-center bg-red-50 border border-red-200/60 rounded-lg p-1.5 text-center">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
            <span className="text-[9px] font-bold text-red-800">HIGH</span>
          </div>
          <span className="text-[11px] font-extrabold text-red-900 mt-0.5">
            {counts.HIGH || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
