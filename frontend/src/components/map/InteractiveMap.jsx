import React, { useState, useEffect, useRef } from 'react';
import ComplaintMarker from './ComplaintMarker';
import { ISSUE_CATEGORIES } from '../../services/complaintService';

// Bounding box for Delhi / Metro Campus area (matching Flutter initialCenter LatLng(28.6139, 77.2090))
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };
const BOUNDS = {
  minLat: 28.5800,
  maxLat: 28.6600,
  minLng: 77.1600,
  maxLng: 77.2500,
};

function projectToPercent(lat, lng) {
  const y = 100 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  return {
    top: `${Math.max(4, Math.min(96, y))}%`,
    left: `${Math.max(4, Math.min(96, x))}%`,
  };
}

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
  hiddenCategories = new Set(),
}) {
  const [zoom, setZoom] = useState(1);
  const [activePinCoords, setActivePinCoords] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const debounceTimer = useRef(null);

  // Nominatim OpenStreetMap Search with Debounce (Ported from Flutter map_screen.dart)
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&format=json&limit=5`,
          {
            headers: {
              'User-Agent': 'UniSafe-Civic-App (Civic Complaint Reporting Platform)',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setSearchQuery(item.display_name.split(',')[0]);
    setSuggestions([]);
    setActivePinCoords({ lat, lng: lon });
    if (onMapClick) onMapClick({ lat, lng: lon });
  };

  // GPS Locate me (Ported from Flutter _goToMyLocation)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lng: parseFloat(pos.coords.longitude.toFixed(4)),
        };
        setMyLocation(coords);
        setActivePinCoords(coords);
        setIsLocating(false);
        if (onMapClick) onMapClick(coords);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err);
        // Fallback to default campus center
        setMyLocation(DEFAULT_CENTER);
        setActivePinCoords(DEFAULT_CENTER);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleMapSurfaceClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100;
    const coords = projectToCoords(percentX, percentY);
    setActivePinCoords(coords);
    if (onMapClick) onMapClick(coords);
  };

  // Filter complaints based on hidden categories
  const visibleComplaints = complaints.filter(
    (c) => !hiddenCategories.has(c.category)
  );

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-950 select-none">
      {/* Search Bar HUD (Ported from Flutter) */}
      <div className="absolute top-4 left-4 right-16 sm:right-auto sm:w-96 z-30">
        <div className="relative">
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 px-3.5 py-2.5 gap-2.5">
            <span className="text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search location (Nominatim OSM)..."
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium"
            />
            {isSearching && (
              <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-40 max-h-56 overflow-y-auto divide-y divide-slate-100">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 transition flex items-center gap-2"
                >
                  <span className="text-blue-500">📍</span>
                  <span className="truncate">{item.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Locate Me GPS Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        className="absolute top-4 right-4 z-30 w-11 h-11 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-xl border border-slate-200 flex items-center justify-center text-lg transition"
        title="Find My Location (GPS)"
      >
        {isLocating ? '⏳' : '🎯'}
      </button>

      {/* Map Canvas with OSM Styled Layer */}
      <div
        onClick={handleMapSurfaceClick}
        className="absolute inset-0 cursor-crosshair overflow-hidden transition-transform duration-300"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        {/* OpenStreetMap Visual Canvas */}
        <svg
          className="w-full h-full object-cover"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="campusGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="1000" height="700" fill="#0f172a" />
          <rect width="1000" height="700" fill="url(#campusGrid)" />

          {/* River / Water Canal */}
          <path
            d="M 120,0 C 180,240 140,480 320,700"
            stroke="#0284c7"
            strokeWidth="28"
            fill="none"
            opacity="0.4"
          />

          {/* Botanical Park / Green Zones */}
          <path
            d="M 450,120 Q 620,80 650,260 Q 550,320 420,240 Z"
            fill="#064e3b"
            opacity="0.5"
          />
          <path
            d="M 720,440 Q 900,420 920,620 Q 760,650 680,520 Z"
            fill="#064e3b"
            opacity="0.4"
          />

          {/* Major Expressways & Campus Arteries */}
          <path d="M 0,350 L 1000,350" stroke="#334155" strokeWidth="12" />
          <path d="M 0,350 L 1000,350" stroke="#f59e0b" strokeWidth="2" strokeDasharray="14,14" />

          <path d="M 520,0 L 520,700" stroke="#334155" strokeWidth="12" />
          <path d="M 520,0 L 520,700" stroke="#38bdf8" strokeWidth="2" strokeDasharray="10,10" />

          {/* Secondary Lanes */}
          <path d="M 260,0 L 260,700" stroke="#1e293b" strokeWidth="4" />
          <path d="M 780,0 L 780,700" stroke="#1e293b" strokeWidth="4" />
          <path d="M 0,180 L 1000,180" stroke="#1e293b" strokeWidth="4" />
          <path d="M 0,540 L 1000,540" stroke="#1e293b" strokeWidth="4" />

          {/* District Labels */}
          <text x="320" y="80" fill="#64748b" fontSize="13" fontWeight="700" letterSpacing="3">
            NORTH CAMPUS
          </text>
          <text x="580" y="320" fill="#64748b" fontSize="13" fontWeight="700" letterSpacing="3">
            CENTRAL CORRIDOR
          </text>
          <text x="440" y="660" fill="#64748b" fontSize="13" fontWeight="700" letterSpacing="3">
            SOUTH METRO PLAZA
          </text>
        </svg>

        {/* Render Complaint Markers with Teardrop Pin */}
        {visibleComplaints.map((complaint) => {
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

        {/* User's GPS Location Pulse (Ported from Flutter _myLocation Marker) */}
        {myLocation && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={projectToPercent(myLocation.lat, myLocation.lng)}
          >
            <div className="relative flex items-center justify-center">
              <span className="w-8 h-8 rounded-full bg-blue-500/40 animate-ping absolute" />
              <div className="w-5 h-5 rounded-full bg-blue-600 border-3 border-white shadow-xl flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </div>
        )}

        {/* Pinned Marker Prompt when user clicks map */}
        {activePinCoords && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full animate-bounce z-40"
            style={projectToPercent(activePinCoords.lat, activePinCoords.lng)}
          >
            <div className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1">
              <span>📍</span> Selected Pin
            </div>
          </div>
        )}
      </div>

      {/* Floating Zoom HUD */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.7, z + 0.15))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold transition"
        >
          1x
        </button>
      </div>

      {/* Flutter Category Legend Bar */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-3 text-xs">
        {Object.entries(ISSUE_CATEGORIES).map(([key, cat]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-slate-300 font-medium">{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
