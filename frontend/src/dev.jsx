import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import MapPage from './pages/Map';
import KanbanPage from './pages/Kanban';

function DevPreview() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'map' | 'kanban'

  if (activeTab === 'map') {
    return <MapPage onBack={() => setActiveTab('home')} />;
  }

  if (activeTab === 'kanban') {
    return <KanbanPage onBack={() => setActiveTab('home')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans">
      {/* App Bar matching Flutter */}
      <nav className="bg-white px-4 py-3 flex items-center shadow-sm">
        <h1 className="text-xl font-medium text-gray-800">UniSafe Home</h1>
      </nav>

      {/* Centered Buttons */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1E3A8A] font-medium rounded-full transition shadow-sm border border-gray-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Open Heatmap
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kanban')}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1E3A8A] font-medium rounded-full transition shadow-sm border border-gray-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Open Kanban Board
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DevPreview />
  </React.StrictMode>
);
