import React, { useState } from 'react';

const DEPARTMENTS = [
  { id: 'dept-roads', name: 'Road Maintenance & Infrastructure', officer: 'Officer K. Sharma', icon: '🛣️' },
  { id: 'dept-electric', name: 'Electrical & Streetlight Division', officer: 'Officer V. Deshmukh', icon: '⚡' },
  { id: 'dept-sanitation', name: 'Sanitation & Solid Waste Management', officer: 'Officer R. Patil', icon: '🧹' },
  { id: 'dept-water', name: 'Water Supply & Sewage Board', officer: 'Officer S. Mehta', icon: '🚰' },
  { id: 'dept-emergency', name: 'Campus Quick Response Unit', officer: 'Officer A. Khan', icon: '🚨' },
];

export default function AssignmentModal({ complaint, onClose, onAssign }) {
  const [selectedDeptId, setSelectedDeptId] = useState(DEPARTMENTS[0].id);

  if (!complaint) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const dept = DEPARTMENTS.find((d) => d.id === selectedDeptId);
    if (dept) {
      onAssign(complaint.id, dept.id, dept.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Assign Department</h3>
            <p className="text-xs text-slate-400 mt-0.5">Complaint #{complaint.id} • {complaint.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <p className="text-xs text-slate-600">
            Select the designated municipal authority or campus team to handle this issue. Assigning will automatically move the complaint to <span className="font-semibold text-blue-600">In Progress</span>.
          </p>

          <div className="space-y-2">
            {DEPARTMENTS.map((dept) => (
              <label
                key={dept.id}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                  selectedDeptId === dept.id
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{dept.icon}</span>
                  <div>
                    <div className="font-semibold text-xs text-slate-900 leading-tight">{dept.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{dept.officer}</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="department"
                  value={dept.id}
                  checked={selectedDeptId === dept.id}
                  onChange={() => setSelectedDeptId(dept.id)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
