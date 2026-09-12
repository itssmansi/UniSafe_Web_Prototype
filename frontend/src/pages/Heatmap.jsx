import React, { useEffect, useState, useMemo, useRef, useCallback, Component } from 'react';
import 'leaflet.heat';

import HeatmapHeader from '../components/heatmap/HeatmapHeader';
import HeatmapFilters from '../components/heatmap/HeatmapFilters';
import HeatmapLegend from '../components/heatmap/HeatmapLegend';
import HotspotCard from '../components/heatmap/HotspotCard';
import HotspotDetails from '../components/heatmap/HotspotDetails';
import { ActiveHotspotsStat, HighRiskAreasStat, ClusteredComplaintsStat } from '../components/heatmap/HeatmapStats';
import { fetchHeatmapData } from '../services/heatmapService';

// Monkey-patch simpleheat & L.HeatLayer to prevent IndexSizeError when canvas dimension is 0
function patchSimpleHeat() {
  if (typeof window === 'undefined') return;

  if (window.simpleheat && window.simpleheat.prototype && !window.simpleheat._patched) {
    const origDraw = window.simpleheat.prototype.draw;
    window.simpleheat.prototype.draw = function (minOpacity) {
      if (!this._width || !this._height || this._width <= 0 || this._height <= 0) {
        return this;
      }
      try {
        return origDraw.call(this, minOpacity);
      } catch (e) {
        return this;
      }
    };
    window.simpleheat._patched = true;
  }

  if (window.L && window.L.HeatLayer && window.L.HeatLayer.prototype && !window.L.HeatLayer._patched) {
    const origRedraw = window.L.HeatLayer.prototype._redraw;
    window.L.HeatLayer.prototype._redraw = function () {
      if (!this._map) return;
      try {
        const size = this._map.getSize();
        if (!size || size.x <= 0 || size.y <= 0) return;
        return origRedraw.call(this);
      } catch (e) {
        return;
      }
    };
    window.L.HeatLayer._patched = true;
  }
}
patchSimpleHeat();

// Locked to OpenStreetMap Streets
const STREET_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const STREET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Distinct Thermal Gradients & Category Metadata (Official 4 Categories + Subcategories, No Icons)
export const CATEGORY_CONFIG = {
  all: {
    id: 'all',
    label: 'All Categories',
    themeColor: '#0B192C',
    gradient: {
      0.15: '#3B82F6', // Cobalt Blue
      0.35: '#06B6D4', // Radiant Cyan
      0.55: '#10B981', // Emerald Green
      0.72: '#F59E0B', // Amber Yellow
      0.88: '#F97316', // Hot Orange
      1.00: '#DC2626'  // Blazing Crimson Core
    },
    gradientCss: 'linear-gradient(to right, #3B82F6 0%, #06B6D4 25%, #10B981 50%, #F59E0B 72%, #F97316 88%, #DC2626 100%)',
    subcategories: []
  },
  infrastructure: {
    id: 'infrastructure',
    label: 'Infrastructure',
    themeColor: '#EF4444',
    lightBg: '#FEF2F2',
    gradient: {
      0.15: '#FEF3C7',
      0.35: '#F59E0B',
      0.55: '#EA580C',
      0.75: '#DC2626',
      1.00: '#991B1B'
    },
    gradientCss: 'linear-gradient(to right, #FEF3C7 0%, #F59E0B 30%, #EA580C 60%, #DC2626 85%, #991B1B 100%)',
    subcategories: [
      { id: 'drainage', label: 'Drainage', keywords: ['drainage', 'open drain', 'sewage'] },
      { id: 'water_supply', label: 'Water Supply', keywords: ['water', 'water supply', 'water pipe', 'leakage'] },
      { id: 'roads_potholes', label: 'Roads & Potholes', keywords: ['road', 'potholes', 'road damage', 'prolonged road work'] },
      { id: 'streetlights', label: 'Streetlights', keywords: ['streetlight', 'streetlights', 'nonfunctional street lights'] },
      { id: 'water_logging', label: 'Water Logging', keywords: ['water logging', 'waterlogging'] },
      { id: 'general_infrastructure', label: 'General Infrastructure', keywords: ['infrastructure'] }
    ]
  },
  sanitation: {
    id: 'sanitation',
    label: 'Sanitation',
    themeColor: '#F59E0B',
    lightBg: '#FFFBEB',
    gradient: {
      0.15: '#FEF9C3',
      0.35: '#FDE047',
      0.55: '#F59E0B',
      0.75: '#D97706',
      1.00: '#B45309'
    },
    gradientCss: 'linear-gradient(to right, #FEF9C3 0%, #FDE047 30%, #F59E0B 60%, #D97706 85%, #B45309 100%)',
    subcategories: [
      { id: 'garbage_roads', label: 'Garbage on Roads', keywords: ['garbage scattered on road', 'garbage on road'] },
      { id: 'garbage_bins', label: 'Garbage & Waste Bins', keywords: ['garbage', 'overflowing bins', 'waste bins', 'garbage collection', 'untimely garbage collection / overflowing bins'] },
      { id: 'public_washrooms', label: 'Public Washrooms', keywords: ['public washroom cleanliness', 'washroom', 'toilet'] },
      { id: 'waterfront_dumping', label: 'Waterfront Dumping', keywords: ['garbage dumping near beach/river', 'waterfront dumping', 'beach dumping'] }
    ]
  },
  safety: {
    id: 'safety',
    label: 'Safety',
    themeColor: '#3B82F6',
    lightBg: '#EFF6FF',
    gradient: {
      0.15: '#DBEAFE',
      0.35: '#60A5FA',
      0.55: '#2563EB',
      0.75: '#1D4ED8',
      1.00: '#1E3A8A'
    },
    gradientCss: 'linear-gradient(to right, #DBEAFE 0%, #60A5FA 30%, #2563EB 60%, #1D4ED8 85%, #1E3A8A 100%)',
    subcategories: [
      { id: 'theft_robbery', label: 'Theft & Robbery', keywords: ['theft', 'theft / robbery', 'robbery'] },
      { id: 'women_safety', label: 'Women Safety & Harassment', keywords: ['women safety', 'harassment / eve-teasing', 'eve-teasing', 'harassment'] },
      { id: 'violence_assault', label: 'Assault & Violence', keywords: ['assault / violence', 'assault', 'violence'] },
      { id: 'open_manholes', label: 'Open Manholes', keywords: ['open manholes', 'open manhole'] },
      { id: 'pedestrian_footpath', label: 'Pedestrian Footpaths', keywords: ['non-existent footpath', 'footpath'] },
      { id: 'illegal_parking', label: 'Illegal Parking', keywords: ['illegal parking'] },
      { id: 'stray_animals', label: 'Stray Animal Threat', keywords: ['stray animal threat', 'stray dog', 'stray animal'] },
      { id: 'hazards', label: 'Fire & Electrical Hazards', keywords: ['fire hazard', 'electrical hazard', 'exposed wires', 'hazard'] }
    ]
  },
  greenery: {
    id: 'greenery',
    label: 'Greenery',
    themeColor: '#10B981',
    lightBg: '#ECFDF5',
    gradient: {
      0.15: '#D1FAE5',
      0.35: '#34D399',
      0.55: '#10B981',
      0.75: '#059669',
      1.00: '#064E3B'
    },
    gradientCss: 'linear-gradient(to right, #D1FAE5 0%, #34D399 30%, #10B981 60%, #059669 85%, #064E3B 100%)',
    subcategories: [
      { id: 'landscape_maintenance', label: 'Landscape Maintenance', keywords: ['poor landscape maintenance', 'landscape maintenance', 'greenery', 'overgrown vegetation', 'watering required for plants', 'trees', 'illegal tree cutting', 'need tree plantation'] },
      { id: 'green_space_dumping', label: 'Dumping in Green Areas', keywords: ['waste dumping in green area', 'encroachment on green spaces'] }
    ]
  }
};

export function classifyCategory(raw) {
  if (!raw) {
    return {
      parentId: 'infrastructure',
      subId: 'general_infrastructure',
      parentLabel: 'Infrastructure',
      subLabel: 'General Infrastructure'
    };
  }

  const s = String(raw).trim().toLowerCase();

  // 1. Exact match against all subcategory keywords
  for (const [parentId, catCfg] of Object.entries(CATEGORY_CONFIG)) {
    if (parentId === 'all') continue;
    for (const sub of catCfg.subcategories || []) {
      for (const kw of sub.keywords) {
        if (s === kw.toLowerCase()) {
          return {
            parentId,
            subId: sub.id,
            parentLabel: catCfg.label,
            subLabel: sub.label
          };
        }
      }
    }
  }

  // 2. Substring match sorted longest keywords first
  const allKeywords = [];
  for (const [parentId, catCfg] of Object.entries(CATEGORY_CONFIG)) {
    if (parentId === 'all') continue;
    for (const sub of catCfg.subcategories || []) {
      for (const kw of sub.keywords) {
        allKeywords.push({
          parentId,
          subId: sub.id,
          parentLabel: catCfg.label,
          subLabel: sub.label,
          keyword: kw.toLowerCase()
        });
      }
    }
  }
  allKeywords.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const item of allKeywords) {
    if (s.includes(item.keyword)) {
      return {
        parentId: item.parentId,
        subId: item.subId,
        parentLabel: item.parentLabel,
        subLabel: item.subLabel
      };
    }
  }

  // 3. Fallback matching parent domain keywords
  if (s.includes('infra')) {
    return { parentId: 'infrastructure', subId: 'general_infrastructure', parentLabel: 'Infrastructure', subLabel: 'General Infrastructure' };
  }
  if (s.includes('sanit') || s.includes('waste')) {
    return { parentId: 'sanitation', subId: 'garbage_bins', parentLabel: 'Sanitation', subLabel: 'Garbage & Waste Bins' };
  }
  if (s.includes('safe') || s.includes('crime') || s.includes('police')) {
    return { parentId: 'safety', subId: 'theft_robbery', parentLabel: 'Safety', subLabel: 'Theft & Robbery' };
  }
  if (s.includes('green') || s.includes('park') || s.includes('tree') || s.includes('plant')) {
    return { parentId: 'greenery', subId: 'landscape_maintenance', parentLabel: 'Greenery', subLabel: 'Landscape Maintenance' };
  }

  return {
    parentId: 'infrastructure',
    subId: 'general_infrastructure',
    parentLabel: 'Infrastructure',
    subLabel: 'General Infrastructure'
  };
}

export function getCategoryKey(raw) {
  return classifyCategory(raw).parentId;
}

class HeatmapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Heatmap render error caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#F9FAFB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-[#DC2626] flex items-center justify-center font-bold text-lg mb-3">
            !
          </div>
          <h2 className="text-base font-bold text-[#0B192C]">Heatmap Loading Notice</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-md">
            {this.state.error?.message || 'A display glitch occurred while rendering the map.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-[#0B192C] text-white text-xs font-bold rounded-xl hover:bg-black transition cursor-pointer"
          >
            Reload Heatmap
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function HeatmapContent() {
  const [zones, setZones] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const layerMenuRef = useRef(null);

  // Close floating layer menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (layerMenuRef.current && !layerMenuRef.current.contains(event.target)) {
        setLayerMenuOpen(false);
      }
    }
    if (layerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [layerMenuOpen]);

  // Visualization settings
  const [viewMode, setViewMode] = useState('hybrid'); // 'hybrid' | 'heatmap' | 'epicenters'
  const [heatRadius, setHeatRadius] = useState(38);
  const [heatBlur, setHeatBlur] = useState(24);
  const [heatIntensity, setHeatIntensity] = useState(1.0);
  const [showControls, setShowControls] = useState(false);

  // Selected hotspot for details & focus
  const [selectedZone, setSelectedZone] = useState(null);

  // Leaflet Map & Layer Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const epicentersLayerRef = useRef([]);

  // Default Map Center: Mumbai
  const defaultCenter = [19.0760, 72.8777];

  // 1. Fetch heatmap & complaints data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadData = () => {
      fetchHeatmapData()
        .then((data) => {
          if (!isMounted) return;
          if (data && typeof data === 'object') {
            setZones(data.zones || []);
            setComplaints(data.complaints || []);
          } else if (Array.isArray(data)) {
            setZones(data);
          }
          setLoading(false);
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message || 'Failed to load heatmap data from server.');
            setLoading(false);
          }
        });
    };

    loadData();
    const intervalId = setInterval(loadData, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    patchSimpleHeat();
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const L = window.L;
    if (!L) {
      console.warn('Leaflet JS is not loaded yet.');
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    const tileLayer = L.tileLayer(STREET_TILE_URL, {
      attribution: STREET_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Invalidate size to ensure container dimensions are properly recognized
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {}
    }, 200);

    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Complaint counts grouped by parent category and by subcategory
  const { categoryCounts, subcategoryCounts } = useMemo(() => {
    const catCounts = {
      all: complaints.length,
      infrastructure: 0,
      sanitation: 0,
      safety: 0,
      greenery: 0
    };
    const subCounts = {};

    Object.values(CATEGORY_CONFIG).forEach((cfg) => {
      (cfg.subcategories || []).forEach((sub) => {
        subCounts[sub.id] = 0;
      });
    });

    complaints.forEach((c) => {
      const { parentId, subId } = classifyCategory(c.category);
      if (catCounts[parentId] !== undefined) {
        catCounts[parentId] += 1;
      }
      if (subCounts[subId] !== undefined) {
        subCounts[subId] += 1;
      } else {
        subCounts[subId] = 1;
      }
    });

    return { categoryCounts: catCounts, subcategoryCounts: subCounts };
  }, [complaints]);

  // Main 4 Categories filter options + All Categories
  const filterCategoryOptions = useMemo(() => {
    return [
      {
        id: 'all',
        label: 'All Categories',
        themeColor: '#0B192C',
        count: categoryCounts.all || 0
      },
      {
        id: 'infrastructure',
        label: 'Infrastructure',
        themeColor: CATEGORY_CONFIG.infrastructure.themeColor,
        count: categoryCounts.infrastructure || 0
      },
      {
        id: 'sanitation',
        label: 'Sanitation',
        themeColor: CATEGORY_CONFIG.sanitation.themeColor,
        count: categoryCounts.sanitation || 0
      },
      {
        id: 'safety',
        label: 'Safety',
        themeColor: CATEGORY_CONFIG.safety.themeColor,
        count: categoryCounts.safety || 0
      },
      {
        id: 'greenery',
        label: 'Greenery',
        themeColor: CATEGORY_CONFIG.greenery.themeColor,
        count: categoryCounts.greenery || 0
      }
    ];
  }, [categoryCounts]);

  // Subcategories available under currently active category
  const activeSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const cfg = CATEGORY_CONFIG[selectedCategory];
    if (!cfg || !cfg.subcategories) return [];

    return cfg.subcategories.map((sub) => ({
      id: sub.id,
      label: sub.label,
      count: subcategoryCounts[sub.id] || 0
    }));
  }, [selectedCategory, subcategoryCounts]);

  const activeCategoryConfig = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG.all;
  const activeSubcategoryConfig = activeSubcategories.find((s) => s.id === selectedSubcategory);

  // Filter zones and complaints by hierarchical category and subcategory
  const filteredZones = useMemo(() => {
    let list = zones.filter((z) => {
      const { parentId, subId } = classifyCategory(z.zone_type);
      if (selectedCategory !== 'all' && parentId !== selectedCategory) {
        return false;
      }
      if (selectedSubcategory !== 'all' && subId !== selectedSubcategory) {
        return false;
      }
      if (selectedSeverity !== 'All' && z.severity !== selectedSeverity) {
        return false;
      }
      return true;
    });
    const severityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    list.sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));
    return list;
  }, [zones, selectedCategory, selectedSubcategory, selectedSeverity]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const { parentId, subId } = classifyCategory(c.category);
      if (selectedCategory !== 'all' && parentId !== selectedCategory) {
        return false;
      }
      if (selectedSubcategory !== 'all' && subId !== selectedSubcategory) {
        return false;
      }
      return true;
    });
  }, [complaints, selectedCategory, selectedSubcategory]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'LOW':
        return '#10B981';
      case 'MEDIUM':
        return '#D97706';
      case 'HIGH':
      default:
        return '#DC2626';
    }
  };

  // 4. Render Professional Canvas-based Heatmap Layer with Category Color Palette
  useEffect(() => {
    patchSimpleHeat();
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L) return;

    // Safety check: ensure map container has non-zero size before drawing canvas
    try {
      const size = map.getSize();
      if (!size || size.x <= 0 || size.y <= 0) {
        return;
      }
    } catch (e) {
      return;
    }

    if (typeof L.heatLayer !== 'function') {
      return;
    }

    if (viewMode === 'epicenters') {
      if (heatLayerRef.current) {
        try {
          map.removeLayer(heatLayerRef.current);
        } catch (e) {}
        heatLayerRef.current = null;
      }
      return;
    }

    const heatPoints = [];

    filteredComplaints.forEach((c) => {
      const lat = parseFloat(c.latitude);
      const lng = parseFloat(c.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const upvotes = Number(c.upvote_count) || 0;
        const baseWeight = Math.min(0.35 + upvotes * 0.1, 0.9);
        heatPoints.push([lat, lng, baseWeight * heatIntensity]);
      }
    });

    filteredZones.forEach((z) => {
      const lat = parseFloat(z.latitude);
      const lng = parseFloat(z.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        let baseWeight = 0.55;
        if (z.severity === 'HIGH') baseWeight = 0.95;
        else if (z.severity === 'MEDIUM') baseWeight = 0.75;
        else baseWeight = 0.45;

        const count = Number(z.complaint_count) || 0;
        if (count >= 10) baseWeight = Math.min(baseWeight + 0.1, 1.0);

        heatPoints.push([lat, lng, baseWeight * heatIntensity]);
      }
    });

    const activeConfig = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG.all;

    const heatOptions = {
      minOpacity: 0.12,
      maxZoom: 16,
      max: 1.0,
      radius: heatRadius,
      blur: heatBlur,
      gradient: activeConfig.gradient
    };

    try {
      if (heatLayerRef.current) {
        heatLayerRef.current.setLatLngs(heatPoints);
        heatLayerRef.current.setOptions(heatOptions);
        if (typeof heatLayerRef.current._redraw === 'function') {
          heatLayerRef.current._redraw();
        }
      } else if (heatPoints.length > 0) {
        heatLayerRef.current = L.heatLayer(heatPoints, heatOptions).addTo(map);
      }
    } catch (e) {
      console.warn('Thermal heat layer render notice:', e);
    }
  }, [filteredComplaints, filteredZones, viewMode, heatRadius, heatBlur, heatIntensity, selectedCategory, selectedSubcategory]);

  // 5. Render Sleek Epicenter Nodes & Focused Catchment Area (No Cluttering Dashed Circles)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window.L;
    if (!map || !L) return;

    epicentersLayerRef.current.forEach((layer) => {
      try {
        map.removeLayer(layer);
      } catch (e) {}
    });
    epicentersLayerRef.current = [];

    if (viewMode === 'heatmap') return;

    filteredZones.forEach((zone) => {
      if (!zone.latitude || !zone.longitude) return;

      const { parentId, parentLabel, subLabel } = classifyCategory(zone.zone_type);
      const themeColor = CATEGORY_CONFIG[parentId]?.themeColor || '#0B192C';
      const isSelected = selectedZone?.id === zone.id;
      const count = Number(zone.complaint_count) || 1;
      const center = [zone.latitude, zone.longitude];

      // If selected, display a smooth, solid subtle catchment halo (no dashed line clutter)
      if (isSelected) {
        const catchmentHalo = L.circle(center, {
          radius: zone.radius_meters || 140,
          color: themeColor,
          weight: 2,
          fillColor: themeColor,
          fillOpacity: 0.12,
        }).addTo(map);
        epicentersLayerRef.current.push(catchmentHalo);
      }

      // Minimalist executive circular epicenter pin (no icons, pure count + theme border)
      const html = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isSelected ? '#0B192C' : '#FFFFFF'};
          color: ${isSelected ? '#FFFFFF' : '#0B192C'};
          border: 2px solid ${isSelected ? '#FFFFFF' : themeColor};
          border-radius: 9999px;
          box-shadow: ${isSelected ? '0 4px 14px rgba(0,0,0,0.35)' : '0 2px 6px rgba(0,0,0,0.18)'};
          min-width: 26px;
          height: 26px;
          padding: 0 6px;
          font-family: Inter, system-ui, sans-serif;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          user-select: none;
        ">
          <span>${count}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html,
        className: 'custom-epicenter-badge',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(center, { icon: customIcon }).addTo(map);

      const popupContent = `
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #0B192C; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 6px;">
            <div>
              <strong style="font-size: 13px; font-weight: 700;">${subLabel || zone.zone_type}</strong>
              <div style="font-size: 10px; color: #64748B; font-weight: 600;">${parentLabel}</div>
            </div>
            <span style="background-color: ${getSeverityColor(zone.severity)}; color: white; padding: 2px 7px; border-radius: 9999px; font-weight: 800; font-size: 9px; letter-spacing: 0.5px;">${zone.severity}</span>
          </div>
          <div style="color: #4B5563; line-height: 1.5;">
            <p style="margin: 3px 0;">Cluster: <strong style="color: #111827;">${count}</strong> complaints</p>
            <p style="margin: 3px 0;">Catchment: <strong style="color: #111827;">${zone.radius_meters}m</strong></p>
            ${zone.risk_score !== undefined ? `<p style="margin-top: 4px; font-weight: 700; color: #0B192C;">Risk Index: ${zone.risk_score}/100</p>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'custom-popup' });
      marker.on('click', () => handleSelectZone(zone));

      if (isSelected) {
        marker.openPopup();
      }

      epicentersLayerRef.current.push(marker);
    });
  }, [filteredZones, selectedZone, viewMode, selectedCategory, selectedSubcategory]);

  const handleSelectZone = useCallback((zone) => {
    setSelectedZone(zone);
    const map = mapInstanceRef.current;
    if (map && zone.latitude && zone.longitude) {
      map.flyTo([zone.latitude, zone.longitude], 14, { duration: 1.2 });
    }
  }, []);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedSeverity('All');
    setSelectedZone(null);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(defaultCenter, 12, { duration: 1.0 });
    }
  };

  const totalHotspots = filteredZones.length;
  const totalComplaints = filteredZones.reduce((acc, z) => acc + (z.complaint_count || 0), 0);
  const highRiskCount = filteredZones.filter((z) => z.severity === 'HIGH').length;
  const medRiskCount = filteredZones.filter((z) => z.severity === 'MEDIUM').length;
  const lowRiskCount = filteredZones.filter((z) => z.severity === 'LOW').length;

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] font-sans flex flex-col select-none overflow-x-hidden">
      <HeatmapHeader />

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full flex-1 max-w-7xl mx-auto px-4 md:px-8 pb-8 items-start">
        
        {/* LEFT RAIL */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4 lg:overflow-y-auto lg:h-[calc(100vh-120px)] custom-scrollbar pr-1 shrink-0">
          <HighRiskAreasStat count={highRiskCount} />
          <ClusteredComplaintsStat count={totalComplaints} />
          <ActiveHotspotsStat count={totalHotspots} />
          
          <HeatmapFilters
            categories={filterCategoryOptions}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            subcategories={activeSubcategories}
            selectedSubcategory={selectedSubcategory}
            setSelectedSubcategory={setSelectedSubcategory}
            selectedSeverity={selectedSeverity}
            setSelectedSeverity={setSelectedSeverity}
            onClearFilters={handleClearFilters}
          />

          <div className="bg-white border border-gray-200 rounded-[16px] p-5 shadow-sm space-y-3.5 flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                ACTIVE HOTSPOTS
              </span>
              <span className="text-[11px] font-bold text-gray-400">
                {totalHotspots} areas
              </span>
            </div>

            {filteredZones.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs flex-1">
                <p className="font-semibold text-gray-500">No Hotspots Found</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-[11px] text-[#0B192C] font-bold underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {filteredZones.map((zone) => (
                  <HotspotCard
                    key={zone.id}
                    zone={zone}
                    isSelected={selectedZone?.id === zone.id}
                    onSelect={handleSelectZone}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Map and Floating HUD */}
        <div className="flex-1 w-full flex flex-col lg:h-[calc(100vh-120px)]">
          <div className="relative flex-1 bg-gray-900 border border-gray-200 rounded-[20px] overflow-hidden shadow-sm min-h-[480px] h-[520px] lg:h-full">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-xs">
                <div className="w-8 h-8 border-3 border-[#0B192C] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-xs font-semibold text-[#0B192C]">
                  Loading Civic Risk Thermal Map...
                </p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white z-20">
                <div className="w-10 h-10 rounded-full bg-red-50 text-[#DC2626] flex items-center justify-center font-bold mb-2">
                  !
                </div>
                <h3 className="text-sm font-bold text-[#152937]">Unable to Load Heatmap</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-1.5 bg-[#0B192C] text-white text-xs font-semibold rounded-lg hover:bg-black transition cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            ) : null}

            {/* TOP-LEFT FLOATING LAYER DROPDOWN (4 Main Categories + Subcategories) */}
            <div className="absolute top-3.5 left-14 z-[1000] pointer-events-auto">
              <div ref={layerMenuRef} className="relative">
                <button
                  onClick={() => setLayerMenuOpen((prev) => !prev)}
                  className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 text-xs font-bold text-[#0B192C] hover:bg-gray-50 cursor-pointer transition"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeCategoryConfig?.themeColor || '#0B192C' }}
                  />
                  <span className="truncate max-w-[210px]">
                    {selectedCategory === 'all'
                      ? 'Layer: All Categories'
                      : selectedSubcategory === 'all'
                      ? `Layer: ${activeCategoryConfig?.label}`
                      : `Layer: ${activeCategoryConfig?.label} › ${activeSubcategoryConfig?.label || ''}`}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md shrink-0">
                    {filteredComplaints.length}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${layerMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {layerMenuOpen && (
                  <div className="absolute top-11 left-0 w-80 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-2.5 shadow-xl z-50 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                    {/* Category Selection Tabs / Grid */}
                    <div>
                      <div className="px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Main Categories
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {/* All Categories Option */}
                        <button
                          onClick={() => {
                            setSelectedCategory('all');
                            setSelectedSubcategory('all');
                            setSelectedZone(null);
                            setLayerMenuOpen(false);
                          }}
                          className={`col-span-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            selectedCategory === 'all'
                              ? 'bg-[#0B192C] text-white font-bold shadow-xs'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0 bg-[#0B192C]" />
                            <span>All Categories</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-600'
                            }`}
                          >
                            {categoryCounts.all || 0}
                          </span>
                        </button>

                        {/* 4 Official Main Categories */}
                        {filterCategoryOptions
                          .filter((cat) => cat.id !== 'all')
                          .map((cat) => {
                            const isCatActive = selectedCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => {
                                  setSelectedCategory(cat.id);
                                  setSelectedSubcategory('all');
                                  setSelectedZone(null);
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                                  isCatActive
                                    ? 'text-white font-bold shadow-xs'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                                style={{
                                  backgroundColor: isCatActive ? cat.themeColor : undefined
                                }}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: isCatActive ? '#FFFFFF' : cat.themeColor }}
                                  />
                                  <span className="truncate">{cat.label}</span>
                                </div>
                                <span
                                  className={`text-[10px] px-1 py-0.2 rounded-md font-bold shrink-0 ${
                                    isCatActive ? 'bg-white/25 text-white' : 'bg-gray-200/80 text-gray-600'
                                  }`}
                                >
                                  {cat.count}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Subcategories Drilldown Section */}
                    {selectedCategory !== 'all' && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between px-1 mb-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {activeCategoryConfig?.label} Sub-Categories
                          </span>
                          <span className="text-[10px] font-medium text-gray-400">
                            {activeSubcategories.length} types
                          </span>
                        </div>

                        <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                          {/* All in Category Option */}
                          <button
                            onClick={() => {
                              setSelectedSubcategory('all');
                              setSelectedZone(null);
                              setLayerMenuOpen(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              selectedSubcategory === 'all'
                                ? 'bg-[#0B192C] text-white font-bold shadow-xs'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: activeCategoryConfig?.themeColor }}
                              />
                              <span className="truncate">All {activeCategoryConfig?.label}</span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                selectedSubcategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {categoryCounts[selectedCategory] || 0}
                            </span>
                          </button>

                          {/* Specific Subcategory Options */}
                          {activeSubcategories.map((sub) => {
                            const isSubActive = selectedSubcategory === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setSelectedSubcategory(sub.id);
                                  setSelectedZone(null);
                                  setLayerMenuOpen(false);
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                                  isSubActive
                                    ? 'bg-[#0B192C] text-white font-bold shadow-xs'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{
                                      backgroundColor: isSubActive ? '#FFFFFF' : activeCategoryConfig?.themeColor
                                    }}
                                  />
                                  <span className="truncate">{sub.label}</span>
                                </div>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                    isSubActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {sub.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* TOP-RIGHT FLOATING HUD */}
            <div className="absolute top-3.5 right-3.5 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-1.5 shadow-lg flex items-center gap-1.5 text-xs">
                {/* View Mode Toggle (Clean Text Only) */}
                <div className="flex bg-gray-100/90 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode('hybrid')}
                    title="Hybrid: Thermal Heatmap + Epicenter Nodes"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'hybrid'
                        ? 'bg-[#0B192C] text-white shadow-xs font-bold'
                        : 'text-gray-600 hover:text-[#0B192C]'
                    }`}
                  >
                    Hybrid
                  </button>

                  <button
                    onClick={() => setViewMode('heatmap')}
                    title="Thermal Heatmap Density Only"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'heatmap'
                        ? 'bg-[#0B192C] text-white shadow-xs font-bold'
                        : 'text-gray-600 hover:text-[#0B192C]'
                    }`}
                  >
                    Heatmap
                  </button>

                  <button
                    onClick={() => setViewMode('epicenters')}
                    title="Hotspot Epicenters Only"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'epicenters'
                        ? 'bg-[#0B192C] text-white shadow-xs font-bold'
                        : 'text-gray-600 hover:text-[#0B192C]'
                    }`}
                  >
                    Hotspots
                  </button>
                </div>

                {/* Calibration HUD Toggle Button */}
                <button
                  onClick={() => setShowControls((prev) => !prev)}
                  title="Tune Heatmap Intensity & Blur"
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    showControls
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
              </div>

              {/* Calibration Controls Panel */}
              {showControls && (
                <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 shadow-xl text-xs w-64 space-y-3 transition-all animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-[#0B192C]">
                      Heat Calibration
                    </span>
                    <button
                      onClick={() => {
                        setHeatRadius(38);
                        setHeatBlur(24);
                        setHeatIntensity(1.0);
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-600 mb-1">
                      <span>Heat Radius</span>
                      <span className="font-bold text-[#0B192C]">{heatRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="65"
                      value={heatRadius}
                      onChange={(e) => setHeatRadius(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0B192C]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-600 mb-1">
                      <span>Diffusion Blur</span>
                      <span className="font-bold text-[#0B192C]">{heatBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="42"
                      value={heatBlur}
                      onChange={(e) => setHeatBlur(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0B192C]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-600 mb-1">
                      <span>Intensity Multiplier</span>
                      <span className="font-bold text-[#0B192C]">{heatIntensity.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.1"
                      value={heatIntensity}
                      onChange={(e) => setHeatIntensity(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0B192C]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* FLOATING LEGEND: Bottom-Left */}
            <div className="absolute bottom-4 left-4 z-[1000] hidden sm:block pointer-events-auto">
              <HeatmapLegend
                categoryConfig={
                  selectedSubcategory !== 'all' && activeSubcategoryConfig
                    ? { ...activeCategoryConfig, label: `${activeCategoryConfig.label} › ${activeSubcategoryConfig.label}` }
                    : activeCategoryConfig
                }
                viewMode={viewMode}
                counts={{ LOW: lowRiskCount, MEDIUM: medRiskCount, HIGH: highRiskCount }}
              />
            </div>

            {/* Reset View Button */}
            <button
              onClick={() => {
                const map = mapInstanceRef.current;
                if (map) map.flyTo(defaultCenter, 12, { duration: 1.0 });
              }}
              title="Reset Map to Mumbai Overview"
              className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl px-3 py-1.5 shadow-md text-xs font-bold text-[#0B192C] hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer pointer-events-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Mumbai View</span>
            </button>

            {/* Leaflet Map DOM Element */}
            <div
              ref={mapContainerRef}
              className="w-full h-full min-h-[480px] z-0"
              style={{ background: '#f8f9fa', minHeight: '480px' }}
            />
          </div>

          {/* Selected Hotspot Details */}
          {selectedZone && (
            <div className="w-full shrink-0 animate-in fade-in slide-in-from-bottom-2">
              <HotspotDetails
                zone={selectedZone}
                onClose={() => setSelectedZone(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Heatmap() {
  return (
    <HeatmapErrorBoundary>
      <HeatmapContent />
    </HeatmapErrorBoundary>
  );
}
