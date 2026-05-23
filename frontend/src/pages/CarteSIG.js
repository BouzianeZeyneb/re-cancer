import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  useMap,
  useMapEvents
} from 'react-leaflet';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus, X, Pencil, Trash2, Layers, Filter, MousePointer2,
  Circle as CircleIcon, Square, Pentagon, RefreshCw,
  MapPin, Download, AlertTriangle, Users, Zap, Check, ChevronDown
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import '../styles/MapOverlays.css';
import api from '../utils/api';

// --- DATA CONSTANTS ---
const ALGERIA_CENTER = [28.5, 2.7];
const ALGERIA_BOUNDS = [[18.5, -9.0], [37.5, 12.5]];
const STORAGE_KEY = 'sig_oncotrack_v4';

const WILAYA_COORDS = {
  "Adrar": [27.87, 0.28], "Chlef": [36.16, 1.33], "Laghouat": [33.8, 2.87],
  "Oum El Bouaghi": [35.87, 7.11], "Batna": [35.556, 6.174], "Béjaïa": [36.752, 5.056],
  "Biskra": [34.85, 5.73], "Béchar": [31.62, -2.22], "Blida": [36.47, 2.83],
  "Bouira": [36.37, 3.9], "Tamanrasset": [22.785, 5.523], "Tébessa": [35.4, 8.12],
  "Tlemcen": [34.88, -1.316], "Tiaret": [35.37, 1.32], "Tizi Ouzou": [36.717, 4.05],
  "Alger": [36.737, 3.086], "Djelfa": [34.67, 3.26], "Jijel": [36.82, 5.77],
  "Sétif": [36.19, 5.41], "Saïda": [34.84, 0.15], "Skikda": [36.88, 6.9],
  "Sidi Bel Abbès": [35.19, -0.63], "Annaba": [36.9, 7.767], "Guelma": [36.46, 7.43],
  "Constantine": [36.365, 6.614], "Médéa": [36.26, 2.75], "Mostaganem": [35.93, 0.09],
  "M'Sila": [35.7, 4.54], "Mascara": [35.4, 0.14], "Ouargla": [31.95, 5.33],
  "Oran": [35.691, -0.641], "El Bayadh": [33.68, 1.02], "Illizi": [26.48, 8.47],
  "Bordj Bou Arréridj": [36.07, 4.76], "Boumerdès": [36.76, 3.48],
  "El Tarf": [36.77, 8.31], "Tindouf": [27.67, -8.14], "Tissemsilt": [35.6, 1.81],
  "El Oued": [33.36, 6.86], "Khenchela": [35.43, 7.14], "Souk Ahras": [36.28, 7.95],
  "Tipaza": [36.59, 2.45], "Mila": [36.45, 6.26], "Aïn Defla": [36.26, 1.97],
  "Naâma": [33.27, -0.31], "Aïn Témouchent": [35.3, -1.14], "Ghardaïa": [32.49, 3.67],
  "Relizane": [35.74, 0.55], "Timimoun": [29.26, 0.23],
  "Bordj Badji Mokhtar": [21.33, 0.95], "Ouled Djellal": [34.42, 5.07],
  "Béni Abbès": [30.13, -2.17], "In Salah": [27.19, 2.47],
  "In Guezzam": [19.57, 5.77], "Touggourt": [33.1, 6.06],
  "Djanet": [24.55, 9.48], "El M'Ghair": [33.95, 5.93], "El Meniaa": [30.58, 2.88]
};

const PROFESSION_COLORS = {
  'Agriculteur / Ouvrier agricole': '#10b981',
  'Ouvrier industriel / Usine': '#f97316',
  'Mineur / Extraction': '#78716c',
  'Pêcheur / Maritime': '#0ea5e9',
  'Enseignant / Éducation': '#8b5cf6',
  'Personnel de santé': '#ec4899',
  'Informatique / Bureautique': '#6366f1',
  'Commerce / Vente': '#f59e0b',
  'Artisan / Menuisier / Forgeron': '#a16207',
  'Chauffeur / Transport': '#14b8a6',
  'Fonctionnaire / Administration': '#64748b',
  'Militaire / Police': '#1e40af',
  'Retraité': '#9ca3af',
  'Sans emploi / Chômeur': '#d1d5db'
};

const RISK_LEVELS = {
  low: { color: '#22c55e', label: 'Faible' },
  medium: { color: '#f59e0b', label: 'Moyen' },
  high: { color: '#f97316', label: 'Élevé' },
  critical: { color: '#ef4444', label: 'Critique' }
};

const ZONE_TYPES = [
  { id: 'factory', label: 'Zone industrielle', icon: Pentagon },
  { id: 'nuclear', label: 'Zone nucléaire', icon: AlertTriangle },
  { id: 'agriculture', label: 'Pesticides / Agriculture', icon: AlertTriangle },
  { id: 'water', label: 'Eau polluée', icon: AlertTriangle },
  { id: 'sun', label: 'Exposition solaire', icon: AlertTriangle },
  { id: 'other', label: 'Autre risque', icon: AlertTriangle }
];

// --- HELPERS ---
const distanceBetween = (p1, p2) => {
  const R = 6371e3; // metres
  const φ1 = p1[0] * Math.PI / 180;
  const φ2 = p2[0] * Math.PI / 180;
  const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
  const Δλ = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getPolygonCenter = (pts) => {
  const lat = pts.reduce((sum, p) => sum + p.lat, 0) / pts.length;
  const lng = pts.reduce((sum, p) => sum + p.lng, 0) / pts.length;
  return [lat, lng];
};

function normalizeWilaya(s) {
  return s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "") || '';
}

const NORM_WILAYA_COORDS = Object.fromEntries(
  Object.entries(WILAYA_COORDS).map(([k, v]) => [normalizeWilaya(k), v])
);

function detectWilaya(centerCoords) {
  let nearest = null, minDist = Infinity;
  Object.entries(WILAYA_COORDS).forEach(([name, coords]) => {
    const d = distanceBetween(centerCoords, coords);
    if (d < minDist) { minDist = d; nearest = name; }
  });
  return nearest;
}

// (MapInstance and MapEvents removed as we switch to raw Leaflet)

// --- MAIN COMPONENT ---
export default function CarteSIG() {
  // State: Layers & Filters
  const [activeLayers, setActiveLayers] = useState({ cancer: true, risk: true, profession: false, fusion: false });
  const [filters, setFilters] = useState({ cancerType: '', gender: 'Tous', ageMin: '', ageMax: '', wilaya: '', profession: '' });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });
  const [isMapReady, setIsMapReady] = useState(false);

  // State: Data
  const [patients, setPatients] = useState([]);
  const [cancerStats, setCancerStats] = useState([]);
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedZone, setSelectedZone] = useState(null);

  // State: Drawing
  const [drawMode, setDrawMode] = useState('view');
  const [drawingState, setDrawingState] = useState({ vertices: [], startPoint: null, preview: null });

  // Refs to bypass closure stale state in Leaflet events
  const drawModeRef = useRef(drawMode);
  const drawingStateRef = useRef(drawingState);

  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { drawingStateRef.current = drawingState; }, [drawingState]);

  const mapRef = useRef(null);
  const location = useLocation();

  // Derived Data: Profession Map { wilaya: { prof: count } }
  const profMap = useMemo(() => {
    const map = {};
    patients.forEach(p => {
      // Filter by gender
      if (appliedFilters.gender !== 'Tous' && p.sexe !== appliedFilters.gender) return;

      // Filter by age
      const age = p.age || (p.date_naissance ? new Date().getFullYear() - new Date(p.date_naissance).getFullYear() : null);
      if (appliedFilters.ageMin && age < parseInt(appliedFilters.ageMin)) return;
      if (appliedFilters.ageMax && age > parseInt(appliedFilters.ageMax)) return;

      const w = p.wilaya ? p.wilaya.trim() : null, pr = p.profession;
      if (!w || !pr) return;
      if (!map[w]) map[w] = {};
      map[w][pr] = (map[w][pr] || 0) + 1;
    });
    return map;
  }, [patients, appliedFilters]);

  const availableProfessions = useMemo(() => {
    const fromDB = [...new Set(patients.map(p => p.profession).filter(Boolean))].sort();
    if (fromDB.length > 0) return fromDB;
    // Fallback if database is empty or no professions recorded
    return Object.keys(PROFESSION_COLORS).sort();
  }, [patients]);

  // Refs for map layers
  const cancerLayerRef = useRef(L.layerGroup());
  const riskLayerRef = useRef(L.layerGroup());
  const profLayerRef = useRef(L.layerGroup());
  const fusionLayerRef = useRef(L.layerGroup());
  const previewLayerRef = useRef(null);
  const vertexMarkersRef = useRef([]);

  // 1. Initialisation Leaflet
  useEffect(() => {
    if (mapRef.current) return;

    const container = document.getElementById('map');
    if (!container) return;

    mapRef.current = L.map('map', {
      center: [28.5, 2.7],
      zoom: 6,
      minZoom: 5,
      maxZoom: 16,
      maxBounds: L.latLngBounds([18.5, -9.0], [37.5, 12.5]),
      maxBoundsViscosity: 1.0
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© CartoDB' }
    ).addTo(mapRef.current);

    // Add layer groups
    cancerLayerRef.current.addTo(mapRef.current);
    riskLayerRef.current.addTo(mapRef.current);
    profLayerRef.current.addTo(mapRef.current);
    fusionLayerRef.current.addTo(mapRef.current);

    // Drawing Events
    mapRef.current.on('click', e => handleMapEvent('click', e));
    mapRef.current.on('dblclick', e => handleMapEvent('dblclick', e));
    mapRef.current.on('mousedown', e => handleMapEvent('mousedown', e));
    mapRef.current.on('mousemove', e => handleMapEvent('mousemove', e));
    mapRef.current.on('mouseup', e => handleMapEvent('mouseup', e));

    setTimeout(() => {
      mapRef.current.invalidateSize();
      setIsMapReady(true);
    }, 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // 1.5 Toggle DoubleClickZoom based on drawMode
  useEffect(() => {
    if (!mapRef.current) return;
    if (drawMode === 'view') {
      mapRef.current.doubleClickZoom.enable();
    } else {
      mapRef.current.doubleClickZoom.disable();
    }
  }, [drawMode]);

  // 2. InvalidateSize on location change
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 300);
    }
  }, [location.pathname]);

  // 3. Update Layers
  useEffect(() => {
    if (!mapRef.current) return;

    // CANCER LAYER
    cancerLayerRef.current.clearLayers();
    if (activeLayers.cancer) {
      cancerStats.forEach(s => {
        if (appliedFilters.wilaya && s.name !== appliedFilters.wilaya) return;
        const coords = NORM_WILAYA_COORDS[normalizeWilaya(s.name)];
        if (!coords) return;
        // More dramatic scaling for small numbers
        const radius = 15000 + (s.value * 8000);
        // Realistic thresholds for the current database size
        const color = s.value >= 15 ? '#ef4444' : s.value >= 7 ? '#f97316' : '#22c55e';
        L.circle(coords, { radius, fillColor: color, fillOpacity: 0.35, color: color, weight: 2 })
          .bindTooltip(`<b>${s.name}</b><br>${s.value} cas de cancer`)
          .addTo(cancerLayerRef.current);
      });
    }

    // RISK LAYER
    riskLayerRef.current.clearLayers();
    if (activeLayers.risk) {
      zones.forEach(z => {
        const style = { color: RISK_LEVELS[z.risk]?.color, fillColor: RISK_LEVELS[z.risk]?.color, fillOpacity: 0.25, weight: 2 };
        let layer;
        if (z.shapeType === 'polygon') layer = L.polygon(z.coordinates, style);
        else if (z.shapeType === 'rectangle') layer = L.rectangle(z.coordinates, style);
        else if (z.shapeType === 'circle') layer = L.circle(z.center, { radius: z.radius, ...style });

        if (layer) {
          layer.on('click', () => setSelectedZone(z));
          layer.addTo(riskLayerRef.current);
        }

        L.marker(z.center, {
          icon: L.divIcon({
            html: renderToStaticMarkup(<div style={{ background: '#fff', padding: 4, borderRadius: '50%', border: `2px solid ${RISK_LEVELS[z.risk]?.color}`, display: 'flex' }}><AlertTriangle size={12} color={RISK_LEVELS[z.risk]?.color} /></div>),
            className: '', iconSize: [20, 20], iconAnchor: [10, 10]
          })
        }).addTo(riskLayerRef.current);
      });
    }

    // PROFESSION LAYER
    profLayerRef.current.clearLayers();
    if (activeLayers.profession) {
      Object.entries(profMap).forEach(([wilaya, profs]) => {
        const coords = NORM_WILAYA_COORDS[normalizeWilaya(wilaya)];
        if (!coords) return;
        const profEntries = Object.entries(profs);
        profEntries.forEach(([prof, count], i) => {
          if (appliedFilters.profession && prof !== appliedFilters.profession) return;
          const color = PROFESSION_COLORS[prof] || '#64748b';

          // Use CircleMarker (pixel-based) for "Different Way" and better visibility
          const pixelRadius = 8 + Math.sqrt(count) * 4;

          // Offset in pixels for clustering effect
          const angle = (i / profEntries.length) * 2 * Math.PI;
          const offsetDist = 15; // pixels
          const latOffset = (offsetDist * Math.cos(angle)) / 111000;
          const lngOffset = (offsetDist * Math.sin(angle)) / (111000 * Math.cos(coords[0] * Math.PI / 180));

          L.circleMarker([coords[0] + latOffset, coords[1] + lngOffset], {
            radius: pixelRadius,
            fillColor: color,
            fillOpacity: 0.9,
            color: '#fff',
            weight: 2,
            className: 'profession-dot'
          })
            .bindTooltip(`<b>${wilaya} — ${prof}</b><br>${count} patients`)
            .addTo(profLayerRef.current);
        });
      });
    }

    // FUSION LAYER
    fusionLayerRef.current.clearLayers();
    if (activeLayers.fusion && activeLayers.profession && activeLayers.risk) {
      zones.forEach(z => {
        (z.linkedProfs || []).forEach(lp => {
          Object.entries(profMap).forEach(([wilaya, profs]) => {
            if (!profs[lp]) return;
            const wCoords = NORM_WILAYA_COORDS[normalizeWilaya(wilaya)];
            if (!wCoords) return;
            const dist = distanceBetween(z.center, wCoords);
            if (dist < 150000) {
              L.polyline([z.center, wCoords], { color: PROFESSION_COLORS[lp] || '#f97316', dashArray: '6,4', weight: 2, opacity: 0.6 })
                .bindTooltip(`Corrélation: ${lp} ↔ ${z.name}`)
                .addTo(fusionLayerRef.current);
            }
          });
        });
      });
    }

  }, [isMapReady, activeLayers, appliedFilters, cancerStats, zones, patients, profMap]);

  // Handle Layer Toggle
  const toggleLayer = (layer) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // State: Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ name: '', wilaya: '', city: '', type: 'factory', risk: 'medium', notes: '', linkedProfs: [] });

  // Load Data on filter change
  useEffect(() => {
    fetchCancerStats();
  }, [appliedFilters]);

  // Load patients once (or could be filtered too, but let's keep it simple for now)
  useEffect(() => {
    fetchPatients();
  }, []);

  // Sync Wilaya filter with selected zone
  useEffect(() => {
    if (selectedZone && selectedZone.wilaya) {
      setFilters(prev => ({ ...prev, wilaya: selectedZone.wilaya }));
      setAppliedFilters(prev => ({ ...prev, wilaya: selectedZone.wilaya }));
    }
  }, [selectedZone]);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients?limit=10000');
      setPatients(res.data.patients || []);
    } catch (e) { console.error("Error loading patients", e); }
  };

  const fetchCancerStats = async () => {
    try {
      const params = new URLSearchParams();
      if (appliedFilters.cancerType) params.append('type_cancer', appliedFilters.cancerType);
      if (appliedFilters.gender !== 'Tous') params.append('sexe', appliedFilters.gender);
      if (appliedFilters.ageMin) params.append('age_min', appliedFilters.ageMin);
      if (appliedFilters.ageMax) params.append('age_max', appliedFilters.ageMax);

      const res = await api.get(`/stats/dashboard?${params.toString()}`);
      setCancerStats(res.data.parWilaya || []);
    } catch (e) { console.error("Error loading cancer stats", e); }
  };

  // Drawing Logic Handlers
  const clearDraw = useCallback(() => {
    if (previewLayerRef.current) {
      mapRef.current?.removeLayer(previewLayerRef.current);
      previewLayerRef.current = null;
    }
    vertexMarkersRef.current.forEach(m => mapRef.current?.removeLayer(m));
    vertexMarkersRef.current = [];
    setDrawingState({ vertices: [], startPoint: null, preview: null });
  }, []);

  const handleMapEvent = (type, e) => {
    const currentMode = drawModeRef.current;
    const currentState = drawingStateRef.current;

    if (currentMode === 'view') return;

    if (currentMode === 'polygon') {
      if (type === 'click') {
        const newVertices = [...currentState.vertices, e.latlng];

        // Add vertex marker
        const marker = L.circleMarker(e.latlng, {
          radius: 5, color: '#3b82f6', fillColor: '#fff', fillOpacity: 1, weight: 2
        }).bindTooltip(`${newVertices.length}`, { permanent: true, className: 'vtx-label' }).addTo(mapRef.current);
        vertexMarkersRef.current.push(marker);

        // Update preview line
        if (previewLayerRef.current) mapRef.current.removeLayer(previewLayerRef.current);
        if (newVertices.length >= 2) {
          previewLayerRef.current = L.polyline(newVertices, { color: '#3b82f6', dashArray: '8,4', weight: 2 }).addTo(mapRef.current);
        }

        setDrawingState(prev => ({ ...prev, vertices: newVertices }));
      } else if (type === 'dblclick') {
        if (currentState.vertices.length < 3) return;

        const center = getPolygonCenter(currentState.vertices);
        openModal({
          shapeType: 'polygon',
          coordinates: currentState.vertices.map(v => [v.lat, v.lng]),
          center
        });
        setDrawMode('view');
        clearDraw();
      }
    }

    if (currentMode === 'rectangle') {
      if (type === 'mousedown') {
        setDrawingState(prev => ({ ...prev, startPoint: e.latlng }));
        mapRef.current.dragging.disable();
      } else if (type === 'mousemove' && currentState.startPoint) {
        if (previewLayerRef.current) mapRef.current.removeLayer(previewLayerRef.current);
        previewLayerRef.current = L.rectangle([currentState.startPoint, e.latlng], {
          color: '#3b82f6', dashArray: '8,4', fillOpacity: 0.08, weight: 2
        }).addTo(mapRef.current);
      } else if (type === 'mouseup' && currentState.startPoint) {
        mapRef.current.dragging.enable();
        const bounds = L.latLngBounds(currentState.startPoint, e.latlng);
        openModal({
          shapeType: 'rectangle',
          coordinates: [
            [bounds.getNorth(), bounds.getWest()],
            [bounds.getNorth(), bounds.getEast()],
            [bounds.getSouth(), bounds.getEast()],
            [bounds.getSouth(), bounds.getWest()]
          ],
          center: [bounds.getCenter().lat, bounds.getCenter().lng]
        });
        setDrawMode('view');
        clearDraw();
      }
    }

    if (currentMode === 'circle') {
      if (type === 'mousedown') {
        setDrawingState(prev => ({ ...prev, startPoint: e.latlng }));
        mapRef.current.dragging.disable();
      } else if (type === 'mousemove' && currentState.startPoint) {
        const r = currentState.startPoint.distanceTo(e.latlng);
        if (previewLayerRef.current) mapRef.current.removeLayer(previewLayerRef.current);
        previewLayerRef.current = L.circle(currentState.startPoint, {
          radius: r, color: '#3b82f6', dashArray: '8,4', fillOpacity: 0.08, weight: 2
        }).addTo(mapRef.current);
      } else if (type === 'mouseup' && currentState.startPoint) {
        mapRef.current.dragging.enable();
        const radius = currentState.startPoint.distanceTo(e.latlng);
        openModal({
          shapeType: 'circle',
          center: [currentState.startPoint.lat, currentState.startPoint.lng],
          radius
        });
        setDrawMode('view');
        clearDraw();
      }
    }
  };

  // Modal Handlers
  const openModal = (shape = null) => {
    let initial = { name: '', wilaya: '', city: '', type: 'factory', risk: 'medium', notes: '', linkedProfs: [] };
    if (shape) {
      const wilaya = detectWilaya(shape.center);
      initial = { ...initial, ...shape, wilaya };
    }
    setModalData(initial);
    setIsModalOpen(true);
  };

  const saveZone = () => {
    if (!modalData.name || !modalData.wilaya) return alert("Nom and Wilaya required");
    const newZone = { ...modalData, id: modalData.id || Date.now().toString() };
    const newZones = modalData.id ? zones.map(z => z.id === modalData.id ? newZone : z) : [...zones, newZone];
    setZones(newZones);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newZones));
    setIsModalOpen(false);
  };

  const deleteZone = (id) => {
    if (!window.confirm("Delete this zone?")) return;
    const newZones = zones.filter(z => z.id !== id);
    setZones(newZones);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newZones));
    if (selectedZone?.id === id) setSelectedZone(null);
  };

  // Exports
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(zones, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "oncotrack_zones.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportCSV = () => {
    let csv = "ID,Name,Wilaya,City,Type,Risk,Lat,Lng\n";
    zones.forEach(z => {
      csv += `${z.id},"${z.name}","${z.wilaya}","${z.city}","${z.type}","${z.risk}",${z.center[0]},${z.center[1]}\n`;
    });
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "oncotrack_zones.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Layout title="Carte SIG">
      <div className="sig-page">

        {/* HEADER */}
        <div className="sig-header-row">
          <div className="sig-title">
            <h1>Carte SIG</h1>
            <p>Analyse géospatiale des zones de risque</p>
          </div>
          <button className="btn btn-primary-gradient" onClick={() => openModal()} style={{ padding: '10px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> Ajouter Zone
          </button>
        </div>

        {/* CONTROLS GRID */}
        <div className="sig-controls-grid">

          {/* Card 1: Layers */}
          <div className="sig-card">
            <div className="card-header">
              <span className="card-title">Couches de données</span>
              <Layers size={14} color="#94a3b8" />
            </div>
            <div className="layer-list">
              <label className="layer-item">
                <input type="checkbox" checked={activeLayers.cancer} onChange={() => toggleLayer('cancer')} />
                <span>Cas de Cancer</span>
              </label>
              <label className="layer-item">
                <input type="checkbox" checked={activeLayers.risk} onChange={() => toggleLayer('risk')} />
                <span>Zones à Risque</span>
              </label>
              <label className="layer-item">
                <input type="checkbox" checked={activeLayers.profession} onChange={() => toggleLayer('profession')} />
                <span>Professions (Dots)</span>
              </label>
              <label className="layer-item">
                <input type="checkbox" checked={activeLayers.fusion} onChange={() => toggleLayer('fusion')} />
                <span>Mode Fusion</span>
              </label>
            </div>
          </div>

          {/* Card 2: Filters */}
          <div className="sig-card">
            <div className="card-header">
              <span className="card-title">Filtres épidémiologiques</span>
              <Filter size={14} color="#94a3b8" />
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <label>Cancer</label>
                <select className="filter-select" value={filters.cancerType} onChange={e => setFilters({ ...filters, cancerType: e.target.value })}>
                  <option value="">Tous les cancers</option>
                  <option>Sein</option><option>Poumon</option><option>Colorectal</option><option>Gastrique</option>
                  <option>Peau</option><option>Thyroïde</option><option>Hépatique</option><option>Leucémie</option><option>Prostate</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Sexe</label>
                <select className="filter-select" value={filters.gender} onChange={e => setFilters({ ...filters, gender: e.target.value })}>
                  <option value="Tous">Tous</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="filter-group" style={{ minWidth: 60 }}>
                <label>Age Min</label>
                <input type="number" className="filter-select" value={filters.ageMin} onChange={e => setFilters({ ...filters, ageMin: e.target.value })} placeholder="0" />
              </div>
              <div className="filter-group" style={{ minWidth: 60 }}>
                <label>Age Max</label>
                <input type="number" className="filter-select" value={filters.ageMax} onChange={e => setFilters({ ...filters, ageMax: e.target.value })} placeholder="100" />
              </div>
              <div className="filter-group">
                <label>Wilaya</label>
                <select className="filter-select" value={filters.wilaya} onChange={e => setFilters({ ...filters, wilaya: e.target.value })}>
                  <option value="">Toutes</option>
                  {Object.keys(WILAYA_COORDS).sort().map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Profession</label>
                <select className="filter-select" value={filters.profession} onChange={e => setFilters({ ...filters, profession: e.target.value })}>
                  <option value="">Toutes les professions</option>
                  {availableProfessions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 8, height: 32, fontSize: 11 }} onClick={() => setAppliedFilters({ ...filters })}>Appliquer</button>
          </div>

          {/* Card 3: Draw */}
          <div className="sig-card">
            <div className="card-header">
              <span className="card-title">Dessiner une zone</span>
              <MousePointer2 size={14} color="#94a3b8" />
            </div>
            <div className="draw-actions">
              <button className={`btn-draw-tool ${drawMode === 'polygon' ? 'active' : ''}`} onClick={() => setDrawMode(drawMode === 'polygon' ? 'view' : 'polygon')}>
                <Pentagon size={16} /> <span>Polygone</span>
              </button>
              <button className={`btn-draw-tool ${drawMode === 'rectangle' ? 'active' : ''}`} onClick={() => setDrawMode(drawMode === 'rectangle' ? 'view' : 'rectangle')}>
                <Square size={16} /> <span>Rectangle</span>
              </button>
              <button className={`btn-draw-tool ${drawMode === 'circle' ? 'active' : ''}`} onClick={() => setDrawMode(drawMode === 'circle' ? 'view' : 'circle')}>
                <CircleIcon size={16} /> <span>Cercle</span>
              </button>
            </div>
            <div className="draw-instructions">
              {drawMode === 'view' ? "Choisissez un outil pour dessiner sur la carte." :
                drawMode === 'polygon' ? "• Cliquez pour ajouter des points.\n• Cliquez « Terminer » pour valider le polygone." :
                  "• Cliquez et glissez pour dessiner la zone."}
            </div>
          </div>

          {/* Card 4: List */}
          <div className="sig-card">
            <div className="card-header">
              <span className="card-title">Zones ({zones.length})</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Download size={14} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={exportJSON} />
                <ChevronDown size={14} color="#94a3b8" />
              </div>
            </div>
            <div className="zones-list">
              {zones.map(z => (
                <div key={z.id} className="zone-row" onClick={() => { mapRef.current?.flyTo(z.center, 10); setSelectedZone(z); }}>
                  <div className="zone-dot" style={{ background: RISK_LEVELS[z.risk]?.color }} />
                  <span className="zone-name">{z.name}</span>
                  <div className="zone-actions">
                    <button className="btn-action" onClick={(e) => { e.stopPropagation(); setModalData(z); setIsModalOpen(true); }}><Pencil size={12} /></button>
                    <button className="btn-action" onClick={(e) => { e.stopPropagation(); deleteZone(z.id); }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {zones.length === 0 && <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>Aucune zone enregistrée</div>}
            </div>
          </div>

        </div>

        {/* MAP CONTAINER */}
        <div className="map-wrapper">
          {drawMode !== 'view' && (
            <div className="draw-floating-pill">
              <span>{drawMode === 'polygon' ? `Mode Polygone — ${drawingState.vertices.length} points` : `Mode ${drawMode === 'rectangle' ? 'Rectangle' : 'Cercle'}`}</span>
              {drawMode === 'polygon' && drawingState.vertices.length >= 3 && (
                <span className="draw-pill-finish" onClick={() => {
                  const center = getPolygonCenter(drawingState.vertices);
                  openModal({
                    shapeType: 'polygon',
                    coordinates: drawingState.vertices.map(v => [v.lat, v.lng]),
                    center,
                  });
                  setDrawMode('view');
                  clearDraw();
                }}>✓ Terminer</span>
              )}
              <span className="draw-pill-cancel" onClick={() => { setDrawMode('view'); clearDraw(); }}>Annuler (Esc)</span>
            </div>
          )}
          <div id="map" className="map-container"></div>
        </div>

        {/* DETAIL PANEL */}
        {selectedZone && (
          <div className="sig-detail-panel">
            <div className="detail-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{selectedZone.name}</h3>
                <span style={{ fontSize: 11, color: RISK_LEVELS[selectedZone.risk]?.color, fontWeight: 700 }}>Risque {RISK_LEVELS[selectedZone.risk]?.label}</span>
              </div>
              <X size={16} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSelectedZone(null)} />
            </div>
            <div className="detail-body">
              <div className="detail-section-title">Informations Générales</div>
              <div style={{ fontSize: 12, color: '#334155', display: 'grid', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8 }}><MapPin size={12} color="#94a3b8" /> {selectedZone.wilaya}, {selectedZone.city}</div>
                <div style={{ display: 'flex', gap: 8 }}><Plus size={12} color="#94a3b8" /> Type: {ZONE_TYPES.find(t => t.id === selectedZone.type)?.label}</div>
                <div style={{ display: 'flex', gap: 8 }}><MapPin size={12} color="#94a3b8" /> {selectedZone.center[0].toFixed(4)}, {selectedZone.center[1].toFixed(4)}</div>
              </div>

              <div className="detail-section-title">Corrélations Professionnelles</div>
              <div className="prof-stats">
                {(selectedZone.linkedProfs || []).map(lp => {
                  const count = profMap[selectedZone.wilaya]?.[lp] || 0;
                  return (
                    <div key={lp} className="prof-stat-row">
                      <span className="prof-name">{lp}</span>
                      <span className="prof-perc">{count} patients</span>
                    </div>
                  );
                })}
                {(selectedZone.linkedProfs || []).length === 0 && <div style={{ fontSize: 11, color: '#94a3b8' }}>Aucune profession liée.</div>}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { setModalData(selectedZone); setIsModalOpen(true); }}><Pencil size={12} /> Modifier</button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, color: '#ef4444' }} onClick={() => deleteZone(selectedZone.id)}><Trash2 size={12} /> Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ZONE FORM */}
      {isModalOpen && (
        <div className="sig-modal-overlay">
          <div className="sig-modal-card">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{modalData.id ? 'Modifier la Zone' : 'Nouvelle Zone de Risque'}</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsModalOpen(false)} />
            </div>
            <div className="modal-body">
              <div className="filter-group" style={{ marginBottom: 16 }}>
                <label>Nom de la zone *</label>
                <input className="filter-select" style={{ height: 40 }} value={modalData.name} onChange={e => setModalData({ ...modalData, name: e.target.value })} placeholder="Ex: Zone Industrielle Arzew" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="filter-group">
                  <label>Wilaya * <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(auto-détectée, modifiable)</span></label>
                  <select className="filter-select" style={{ height: 40, cursor: 'pointer', appearance: 'auto', WebkitAppearance: 'menulist' }} value={modalData.wilaya} onChange={e => setModalData({ ...modalData, wilaya: e.target.value })}>
                    <option value="">Choisir...</option>
                    {Object.keys(WILAYA_COORDS).sort().map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Ville / Commune</label>
                  <input className="filter-select" style={{ height: 40 }} value={modalData.city} onChange={e => setModalData({ ...modalData, city: e.target.value })} placeholder="Saisir la ville..." />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="filter-group">
                  <label>Type de risque *</label>
                  <select className="filter-select" value={modalData.type} onChange={e => setModalData({ ...modalData, type: e.target.value })}>
                    {ZONE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Niveau de risque *</label>
                  <select className="filter-select" value={modalData.risk} onChange={e => setModalData({ ...modalData, risk: e.target.value })}>
                    {Object.entries(RISK_LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="filter-group">
                <label>Notes</label>
                <textarea className="filter-select" rows={3} value={modalData.notes} onChange={e => setModalData({ ...modalData, notes: e.target.value })} placeholder="Détails supplémentaires..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" style={{ borderRadius: 8 }} onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button className="btn btn-primary-gradient" style={{ borderRadius: 8, padding: '0 24px' }} onClick={saveZone}>+ Enregistrer la Zone</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
