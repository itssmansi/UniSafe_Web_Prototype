import React from 'react';

export default function HeatmapFilters({
  categories = [],
  selectedCategory,
  setSelectedCategory,
  subcategories = [],
  selectedSubcategory,
  setSelectedSubcategory,
  selectedSeverity,
  setSelectedSeverity,
  onClearFilters,
  uiStyle = 'sidebar'
}) {
  const severities = ['All', 'LOW', 'MEDIUM', 'HIGH'];
  const hasActiveFilters = selectedCategory !== 'all' || (selectedSubcategory && selectedSubcategory !== 'all') || selectedSeverity !== 'All';

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm space-y-4 font-sans w-full">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
          FILTER HOTSPOTS
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-[11px] font-bold text-[#DC2626] hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Category Selection */}
      <div>
        <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
          Problem Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            if (setSelectedSubcategory) {
              setSelectedSubcategory('all');
            }
          }}
          className="bg-[#F7F8F4] border border-[#EBE6DF] text-[#0B192C] text-xs font-semibold rounded-xl px-3 h-11 focus:outline-none focus:ring-1 focus:ring-[#0B192C] transition w-full cursor-pointer"
        >
          {categories.map((cat) => {
            const val = typeof cat === 'object' ? cat.id : cat;
            const label = typeof cat === 'object' ? cat.label : cat.charAt(0).toUpperCase() + cat.slice(1);
            const count = typeof cat === 'object' && cat.count !== undefined ? ` (${cat.count})` : '';
            return (
              <option key={val} value={val}>
                {label}{count}
              </option>
            );
          })}
        </select>
      </div>

      {/* Specific Subcategory Dropdown (Cascading) */}
      {selectedCategory !== 'all' && subcategories && subcategories.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
            Sub-Category
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="bg-[#F7F8F4] border border-[#EBE6DF] text-[#0B192C] text-xs font-semibold rounded-xl px-3 h-11 focus:outline-none focus:ring-1 focus:ring-[#0B192C] transition w-full cursor-pointer"
          >
            <option value="all">
              All {categories.find((c) => c.id === selectedCategory)?.label || 'Issues'} (
              {categories.find((c) => c.id === selectedCategory)?.count || 0})
            </option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.label} ({sub.count})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Severity Level Segmented Control */}
      <div>
        <label className="text-[11px] font-semibold text-[#64748B] block mb-1">
          Severity Level
        </label>
        <div className="grid grid-cols-4 gap-1 bg-[#F7F8F4] p-1 rounded-xl border border-[#EBE6DF]">
          {severities.map((sev) => {
            const isSelected = selectedSeverity === sev;

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`h-10 text-xs font-bold rounded-lg transition cursor-pointer text-center flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#0B192C] text-white shadow-2xs'
                    : 'text-[#152937] hover:bg-gray-200/50'
                }`}
              >
                {sev.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
