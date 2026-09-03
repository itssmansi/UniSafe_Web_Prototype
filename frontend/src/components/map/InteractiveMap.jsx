import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom category icons based on the UI screenshot
const createCategoryIcon = (color, svgPath) => {
  const svg = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="\"/><path d="\" fill="white" transform="scale(0.6) translate(8, 8)"/></svg>;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

const CATEGORIES = [
  { id: 'infrastructure', name: 'Infrastructure', color: '#EF4444', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'sanitation', name: 'Sanitation', color: '#F59E0B', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  { id: 'safety', name: 'Safety', color: '#3B82F6', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'greenery', name: 'Greenery', color: '#10B981', icon: 'M4 11a9 9 0 019 9M3 21l18-18M21 11a9 9 0 00-9-9' }
];

export default function InteractiveMap({ onBack }) {
  const [position, setPosition] = useState([19.1136, 72.8397]); // Mumbai Coordinates matching the image vaguely

  return (
    <div className="relative w-full h-screen font-sans bg-gray-100">
      {/* Map Container */}
      <MapContainer 
        center={position} 
        zoom={16} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Mock Marker representing the blue dot in the screenshot */}
        <Marker position={position}>
          <Popup>Selected Location</Popup>
        </Marker>
      </MapContainer>

      {/* Top Search Bar UI overlay */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex gap-3 pointer-events-none">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 pointer-events-auto flex-shrink-0"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        
        <div className="flex-1 bg-white/95 backdrop-blur rounded-full shadow-md flex items-center px-4 h-12 pointer-events-auto">
          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search anywhere..." 
            className="flex-1 bg-transparent border-none outline-none text-gray-700 font-medium placeholder-gray-400"
          />
        </div>
      </div>

      {/* Top Center Category Widget */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center gap-2 pointer-events-none">
        <div className="bg-gray-700/80 text-white text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm">
          Tap or drag a category below to report an issue
        </div>
        <div className="bg-white/95 backdrop-blur-md rounded-full shadow-lg px-6 py-3 flex gap-6 pointer-events-auto">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="flex flex-col items-center gap-1 cursor-pointer group">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110"
                style={{ backgroundColor: cat.color }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
                </svg>
              </div>
              <span className="text-[10px] text-gray-600 font-medium">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Right Floating Action Buttons */}
      <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-3 pointer-events-none">
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 pointer-events-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-blue-600 hover:bg-gray-50 pointer-events-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
