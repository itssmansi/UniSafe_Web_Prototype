import React, { useState } from 'react';
import ComplaintMarker from './ComplaintMarker';

// City bounding box for coordinate translation (Default: Mumbai Metro area)
const BOUNDS = {
  minLat: 19.0500,
  maxLat: 19.1200,
  minLng: 72.8500,
  maxLng: 72.9200,
};

// Converts lat/long to percentage coordinates (0 - 100%) inside the map viewport
function projectToPercent(lat, lng) {
  const y = 100 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  return {
    top: `${Math.max(5, Math.min(95, y))}%`,
    left: `${Math.max(5, Math.min(95, x))}%`,
  };
}

// Converts percentage click inside map viewport back to lat/long
function projectToCoords(percentX, percentY) {
  const lat = BOUNDS.minLat + (1 - percentY / 100) * (BOUNDS.maxLat - BOUNDS.minLat);
  const lng = BOUNDS.minLng + (percentX / 100) * (BOUNDS.maxLng - BOUNDS.minLng);
  return {
    lat: parseFloat(lat.toFixed(4)),
    lng: parseFloat(lng.toFixed(4)),
  };
}

export default function InteractiveMap({
  complaints = [],
  selectedComplaint = null,
  onSelectComplaint,
  onMapClick,
}) {
  const [zoom, setZoom] = useState(1);
  const [activePinCoords, setActivePinCoords] = useState(null);

  const handleMapSurfaceClick = (e) => {
    // Only trigger if clicking directly on map container or background
    if (e.target.closest('button')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100;

    const coords = projectToCoords(percentX, percentY);
    setActivePinCoords(coords);

    if (onMapClick) {
      onMapClick(coords);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-3xl overflow-hidden shadow-inner border border-slate-200/80 bg-slate-950 select-none">
      {/* City Map Background Layer */}
      <div
        onClick={handleMapSurfaceClick}
        className="absolute inset-0 cursor-crosshair overflow-hidden transition-transform duration-300"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        {/* Styled Dark Mode City Grid Canvas */}
        <svg
          className="w-full h-full object-cover opacity-90"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="1" />
            </pattern>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Background fill */}
          <rect width="1000" height="700" fill="url(#mapGlow)" />
          <rect width="1000" height="700" fill="url(#grid)" />

          {/* Water body / Bay */}
          <path
            d="M0,0 L220,0 Q180,300 280,450 Q320,550 250,700 L0,700 Z"
            fill="#082f49"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* Parks & Green zones */}
          <rect x="420" y="140" width="160" height="120" rx="20" fill="#064e3b" opacity="0.4" />
          <rect x="680" y="380" width="200" height="140" rx="30" fill="#064e3b" opacity="0.35" />

          {/* Major Road Arteries */}
          <path
            d="M 280,700 C 350,500 450,300 520,0"
            stroke="#334155"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 280,700 C 350,500 450,300 520,0"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="12,12"
            fill="none"
          />

          <path
            d="M 220,380 C 450,420 700,320 1000,360"
            stroke="#334155"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M 220,380 C 450,420 700,320 1000,360"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="8,8"
            fill="none"
          />

          {/* Secondary streets */}
          <path d="M 400,0 L 400,700 M 600,0 L 600,700 M 800,0 L 800,700" stroke="#1e293b" strokeWidth="3" />
          <path d="M 0,200 L 1000,200 M 0,520 L 1000,520" stroke="#1e293b" strokeWidth="3" />

          {/* District Labels */}
          <text x="320" y="100" fill="#64748b" fontSize="14" fontWeight="600" letterSpacing="3">
            NORTH ZONE
          </text>
          <text x="740" y="240" fill="#64748b" fontSize="14" fontWeight="600" letterSpacing="3">
            CENTRAL METRO
          </text>
          <text x="480" y="620" fill="#64748b" fontSize="14" fontWeight="600" letterSpacing="3">
            SOUTH CORRIDOR
          </text>
          <text x="60" y="340" fill="#0284c7" fontSize="13" fontWeight="500" letterSpacing="2">
            WEST COASTAL BAY
          </text>
        </svg>

        {/* Render Complaint Markers */}
        {complaints.map((complaint) => {
          const position = projectToPercent(complaint.latitude, complaint.longitude);
          const isSelected = selectedComplaint?.id === complaint.id;

          return (
            <div
              key={complaint.id}
              className="absolute pointer-events-auto"
              style={{ top: position.top, left: position.left }}
            >
              <ComplaintMarker
                complaint={complaint}
                isSelected={isSelected}
                onClick={onSelectComplaint}
              />
            </div>
          );
        })}

        {/* Temporary Pin when user clicked on map to report */}
        {activePinCoords && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full animate-bounce"
            style={projectToPercent(activePinCoords.lat, activePinCoords.lng)}
          >
            <div className="bg-red-500 text-white font-bold text-xs px-2 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
              📍 Pin Here
            </div>
          </div>
        )}
      </div>

      {/* Map Floating UI HUD Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-xs text-slate-300 shadow-xl">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="font-semibold text-white">Live Civic Map</span>
        <span className="text-slate-500">•</span>
        <span>Click anywhere to report an issue</span>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.8, z - 0.15))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition"
          title="Zoom Out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition"
          title="Reset View"
        >
          1x
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-800 shadow-xl text-xs flex items-center gap-4 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/30" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-400/30" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-400/30" />
          <span>Resolved</span>
        </div>
      </div>
    </div>
  );
}
