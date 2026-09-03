import React from 'react';
import InteractiveMap from '../components/map/InteractiveMap';

export default function MapPage({ onBack }) {
  return (
    <div className="w-full h-screen p-0 m-0 overflow-hidden">
      <InteractiveMap onBack={onBack} />
    </div>
  );
}
