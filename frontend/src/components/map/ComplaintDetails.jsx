import React from 'react';
import { statusColors, severityStyles, getCategoryIcon } from './ComplaintMarker';

export default function ComplaintDetails({
  complaint,
  onClose,
  onStatusChange,
  onOpenAssign,
}) {
  if (!complaint) return null;

  const status = statusColors[complaint.status] || statusColors.pending;
  const severityStyle = severityStyles[complaint.severity] || severityStyles.medium;
  const icon = getCategoryIcon(complaint.category);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{complaint.category}</h3>
            <p className="text-xs text-slate-400 mt-0.5">ID: #{complaint.id}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-600">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${severityStyle}`}>
            {complaint.severity} Severity
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white ${status.bg}`}>
            {status.label}
          </span>
          {complaint.assigned_department && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              🏢 {complaint.assigned_department}
            </span>
          )}
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Description
          </h4>
          <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {complaint.description}
          </p>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-400 block">Reported By:</span>
            <span className="font-medium text-slate-700">{complaint.citizen_name || 'Citizen'}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Reported Time:</span>
            <span className="font-medium text-slate-700">
              {new Date(complaint.created_at).toLocaleDateString()} at{' '}
              {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Coordinates:</span>
            <span className="font-mono text-slate-700">
              {complaint.latitude?.toFixed(4)}, {complaint.longitude?.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Last Updated:</span>
            <span className="font-medium text-slate-700">
              {new Date(complaint.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Photos section */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Evidence Photos
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Original Photo */}
            <div>
              <p className="text-[11px] text-slate-500 font-medium mb-1">📸 Reported Issue</p>
              {complaint.original_photo_url ? (
                <img
                  src={complaint.original_photo_url}
                  alt="Reported Issue"
                  className="w-full h-32 object-cover rounded-xl border border-slate-200 shadow-sm hover:opacity-95 transition"
                />
              ) : (
                <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                  No Photo
                </div>
              )}
            </div>

            {/* Resolution Photo */}
            <div>
              <p className="text-[11px] text-slate-500 font-medium mb-1">✅ Resolution Proof</p>
              {complaint.resolution_photo_url ? (
                <img
                  src={complaint.resolution_photo_url}
                  alt="Resolved Issue"
                  className="w-full h-32 object-cover rounded-xl border border-emerald-300 shadow-sm"
                />
              ) : (
                <div className="w-full h-32 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-center p-2 text-xs text-slate-400">
                  {complaint.status === 'resolved' ? 'No proof attached' : 'Pending resolution'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Authority Actions */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center gap-2">
        {complaint.status === 'pending' && (
          <>
            {onOpenAssign && (
              <button
                type="button"
                onClick={() => onOpenAssign(complaint)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-xl text-xs transition shadow-sm"
              >
                Assign Authority
              </button>
            )}
            <button
              type="button"
              onClick={() => onStatusChange && onStatusChange(complaint.id, 'in_progress')}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-3 rounded-xl text-xs transition shadow-sm"
            >
              Start Work
            </button>
          </>
        )}

        {complaint.status === 'in_progress' && (
          <button
            type="button"
            onClick={() => onStatusChange && onStatusChange(complaint.id, 'resolved')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-xl text-xs transition shadow-sm"
          >
            Mark as Resolved ✅
          </button>
        )}

        {complaint.status === 'resolved' && (
          <button
            type="button"
            onClick={() => onStatusChange && onStatusChange(complaint.id, 'in_progress')}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-3 rounded-xl text-xs transition"
          >
            Reopen Issue ↺
          </button>
        )}
      </div>
    </div>
  );
}
