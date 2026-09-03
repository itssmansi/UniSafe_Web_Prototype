import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import MapPage from './pages/Map';
import KanbanPage from './pages/Kanban';

function DevPreview() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'kanban'

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Dev Switcher Banner */}
      <nav className="bg-slate-900 border-b border-slate-800 text-white px-6 py-2.5 flex items-center justify-between z-50 sticky top-0 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
            Pranav's Scope Dev Sandbox
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Testing independently without modifying shared <code className="text-amber-400">App.jsx</code>
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🗺️</span> Interactive Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'kanban'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📋</span> Kanban Board
          </button>
        </div>
      </nav>

      {/* Render Active View */}
      <div className="flex-1">
        {activeTab === 'map' ? <MapPage /> : <KanbanPage />}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DevPreview />
  </React.StrictMode>
);
