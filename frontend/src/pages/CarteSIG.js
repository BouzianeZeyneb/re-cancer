import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '../components/Layout';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle, 
  Popup, 
  useMapEvents,
  GeoJSON
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Factory, 
  Waves, 
  Zap, 
  Droplets, 
  Sun, 
  Flame, 
  Scissors, 
  Leaf, 
  Beaker,
  MousePointer2,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  X,
  Navigation
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import '../styles/MapOverlays.css';
import { getAllWilayasData } from '../data/wilayasData';

// Constants & Data
const ALGERIA_CENTER = [28.0, 2.7];
const ALGERIA_BOUNDS = [[18.5, -9.0], [37.5, 12.5]];
const STORAGE_KEY = 'sig_oncotrack_v3';

const ZONE_TYPES = {
  factory: { icon: Factory, label: 'Zone industrielle', color: '#64748b' },
  seawater: { icon: Waves, label: 'Eau de mer', color: '#0ea5e9' },
  radiation: { icon: Zap, label: 'Zone nucléaire', color: '#eab308' },
  polluted_water: { icon: Droplets, label: 'Eau polluée', color: '#14b8a6' },
  sun_exposure: { icon: Sun, label: 'Exposition solaire', color: '#f59e0b' },
  smoked_food: { icon: Flame, label: 'Aliments fumés/salés', color: '#8b5cf6' },
  hepatitis: { icon: Scissors, label: 'Abattoir / Hépatite', color: '#ef4444' },
  pesticides: { icon: Leaf, label: 'Pesticides', color: '#84cc16' },
  chemical: { icon: Beaker, label: 'Usine chimique', color: '#d946ef' }
};

const RISK_LEVELS = {
  low: { color: '#10b981', label: 'Faible' },
  medium: { color: '#f59e0b', label: 'Moyen' },
  high: { color: '#f97316', label: 'Élevé' },
  critical: { color: '#ef4444', label: 'Critique' }
};

const CANCER_DATA = [
  { nom: 'Alger', lat: 36.7538, lng: 3.0588, count: 1450 },
  { nom: 'Oran', lat: 35.6987, lng: -0.6308, count: 980 },
  { nom: 'Constantine', lat: 36.3650, lng: 6.6147, count: 720 },
  { nom: 'Annaba', lat: 36.9000, lng: 7.7667, count: 880 },
  { nom: 'Sétif', lat: 36.1911, lng: 5.4137, count: 650 },
  { nom: 'Batna', lat: 35.5558, lng: 6.1736, count: 420 },
  { nom: 'Tlemcen', lat: 34.8783, lng: -1.3150, count: 390 },
  { nom: 'Blida', lat: 36.4700, lng: 2.8277, count: 580 },
  { nom: 'Béjaïa', lat: 36.7512, lng: 5.0645, count: 410 },
  { nom: 'Skikda', lat: 36.8778, lng: 5.9069, count: 520 },
  { nom: 'Chlef', lat: 36.1647, lng: 1.3318, count: 310 },
  { nom: 'Ouargla', lat: 31.9493, lng: 5.3250, count: 280 },
  { nom: 'Tizi Ouzou', lat: 36.7118, lng: 4.0459, count: 490 },
  { nom: 'Bordj Bou Arréridj', lat: 36.0732, lng: 4.7611, count: 350 },
  { nom: 'Mascara', lat: 35.3964, lng: 0.1403, count: 290 },
  { nom: 'Mostaganem', lat: 35.9374, lng: 0.0892, count: 330 },
  { nom: 'Djelfa', lat: 34.6725, lng: 3.2631, count: 240 },
  { nom: 'Ghardaïa', lat: 32.4909, lng: 3.6735, count: 180 }
];

const PRELOADED_ZONES = [
  { id: '1', name: 'Zone Industrielle Annaba', wilaya: '23 Annaba', city: 'El Hadjar', lat: 36.9, lng: 7.7, type: 'factory', risk: 'high', notes: 'Sidérurgie intensive' },
  { id: '2', name: 'Zone Côtière Oran', wilaya: '31 Oran', city: 'Arzew', lat: 35.69, lng: -0.63, type: 'seawater', risk: 'medium', notes: 'Proximité pétrochimie' },
  { id: '3', name: 'Région Agricole Mascara', wilaya: '29 Mascara', city: 'Ghriss', lat: 35.4, lng: 0.14, type: 'pesticides', risk: 'high', notes: 'Zones de culture intensive' },
  { id: '4', name: 'Zone Solaire Tamanrasset', wilaya: '11 Tamanrasset', city: 'Tamanrasset', lat: 22.78, lng: 5.52, type: 'sun_exposure', risk: 'medium', notes: 'Indice UV élevé toute l\'année' }
];

// Map Event Handler
function MapEvents({ mode, onMapClick, onDeselect }) {
  useMapEvents({
    click(e) {
      if (mode === 'pick') {
        onMapClick(e.latlng);
      } else if (mode === 'select') {
        onDeselect();
      }
    }
  });
  return null;
}

export default function CarteSIG() {
  const formRef = useRef(null);
  const [viewMode, setViewMode] = useState('fusion'); // cancer, risk, fusion
  const [interactMode, setInteractMode] = useState('view'); // view, select, pick
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : PRELOADED_ZONES;
  });
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [formData, setFormData] = useState({
    id: '', name: '', wilaya: '', city: '', lat: '', lng: '', type: 'factory', risk: 'medium', notes: ''
  });
  const [errors, setErrors] = useState({});
  const [mapRef, setMapRef] = useState(null);
  const [algeriaGeoJson, setAlgeriaGeoJson] = useState(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => {
        const country = data.features.find(f => 
          f.properties.ADMIN === 'Algeria' || 
          f.properties.name === 'Algeria' || 
          f.properties.ISO_A3 === 'DZA'
        );
        if (country) setAlgeriaGeoJson(country);
      })
      .catch(err => console.error("Error fetching map data:", err));
  }, []);

  const maskGeoJson = useMemo(() => {
    if (!algeriaGeoJson) return null;
    
    // Create a world-spanning polygon with a hole for Algeria
    const worldCoords = [
      [-180, -90],
      [180, -90],
      [180, 90],
      [-180, 90],
      [-180, -90]
    ];

    // Algeria coordinates - handle both Polygon and MultiPolygon
    let holes = [];
    if (algeriaGeoJson.geometry.type === 'Polygon') {
      holes = algeriaGeoJson.geometry.coordinates;
    } else if (algeriaGeoJson.geometry.type === 'MultiPolygon') {
      holes = algeriaGeoJson.geometry.coordinates.map(poly => poly[0]);
    }

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [worldCoords, ...holes]
      }
    };
  }, [algeriaGeoJson]);

  const allWilayasData = useMemo(() => getAllWilayasData(), []);
  
  const currentCommunes = useMemo(() => {
    if (!formData.wilaya) return [];
    const wd = allWilayasData.find(w => w.nom === formData.wilaya);
    return wd ? wd.communes : [];
  }, [formData.wilaya, allWilayasData]);

  const maxCases = Math.max(...CANCER_DATA.map(d => d.count));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
  }, [zones]);

  const handleHeaderBtnClick = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    setInteractMode('view');
    setSelectedZoneId(null);
    resetForm();
  };

  const handleMapClick = (latlng) => {
    if (interactMode === 'select') {
      setInteractMode('view');
      setSelectedZoneId(null);
      // No return here - allow the click to set coordinates even after mode switch
    }
    setFormData(prev => ({ ...prev, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) }));
    setInteractMode('view');
    setErrors(prev => ({ ...prev, lat: null, lng: null }));
  };

  useEffect(() => {
    if (mapRef) {
      mapRef.setMaxBounds(ALGERIA_BOUNDS);
      mapRef.fitBounds(ALGERIA_BOUNDS);
    }
  }, [mapRef]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Le nom est requis';
    if (!formData.wilaya) newErrors.wilaya = 'La wilaya est requise';
    if (!formData.city) newErrors.city = 'La ville est requise';
    if (!formData.lat || !formData.lng) newErrors.coords = 'Veuillez placer un point sur la carte';
    if (!formData.type) newErrors.type = 'Le type est requis';
    if (!formData.risk) newErrors.risk = 'Le niveau de risque est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveZone = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (formData.id) {
      setZones(zones.map(z => z.id === formData.id ? { ...formData, lat: Number(formData.lat), lng: Number(formData.lng) } : z));
    } else {
      const newZone = { 
        ...formData, 
        id: Date.now().toString(), 
        lat: Number(formData.lat), 
        lng: Number(formData.lng) 
      };
      setZones([...zones, newZone]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', wilaya: '', city: '', lat: '', lng: '', type: 'factory', risk: 'medium', notes: '' });
    setSelectedZoneId(null);
    setInteractMode('view');
    setErrors({});
  };

  const handleEdit = (zone) => {
    setFormData({ ...zone, lat: zone.lat.toString(), lng: zone.lng.toString() });
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    setErrors({});
  };

  const handleDelete = (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette zone de risque ?')) {
      setZones(zones.filter(z => z.id !== id));
      if (selectedZoneId === id) setSelectedZoneId(null);
    }
  };

  const selectZone = (zone) => {
    setSelectedZoneId(zone.id);
    if (mapRef) {
      mapRef.flyTo([zone.lat, zone.lng], 12);
    }
  };

  const calculateFusionScore = (cancerPoint) => {
    let score = 0;
    zones.forEach(z => {
      const dist = Math.sqrt(Math.pow(z.lat - cancerPoint.lat, 2) + Math.pow(z.lng - cancerPoint.lng, 2));
      if (dist < 1.0) { // Approx 100km
        const riskWeight = z.risk === 'critical' ? 4 : z.risk === 'high' ? 3 : z.risk === 'medium' ? 2 : 1;
        score += (1.0 - dist) * riskWeight * 20;
      }
    });
    return Math.round(score + (cancerPoint.count / maxCases) * 50);
  };

  // Custom Icon Generator
  const createRiskIcon = (type, risk, isSelected) => {
    const typeObj = ZONE_TYPES[type] || ZONE_TYPES.factory;
    const riskObj = RISK_LEVELS[risk] || RISK_LEVELS.medium;
    const IconComp = typeObj.icon;

    const html = renderToStaticMarkup(
      <div className="risk-marker-container">
        <div className={`risk-marker-inner ${isSelected ? 'selected' : ''}`} style={{ borderColor: riskObj.color }}>
          <IconComp size={isSelected ? 20 : 16} color={riskObj.color} strokeWidth={1.5} />
        </div>
      </div>
    );

    return L.divIcon({
      html,
      className: '',
      iconSize: isSelected ? [46, 46] : [38, 38],
      iconAnchor: isSelected ? [23, 23] : [19, 19]
    });
  };

  return (
    <Layout title="Carte SIG">
      <div className="sig-container">
        
        <div className="sig-header">
          <div className="sig-title">
            <h1>Carte SIG</h1>
            <p>Analyse géospatiale des zones de risque oncologique</p>
          </div>
          <button className="btn btn-primary" onClick={handleHeaderBtnClick}>
            <Plus size={18} />
            + Ajouter une Zone
          </button>
        </div>

        <div className="sig-grid">
          
          {/* LEFT PANEL */}
          <div className="sig-sidebar">
            <div className="sig-sidebar-scroll">
              
              {/* Segmented Layer Toggle */}
              <div className="sig-section">
                <span className="sig-label-small">Affichage</span>
                <div className="segmented-control">
                  <button className={`segmented-item ${viewMode === 'cancer' ? 'active' : ''}`} onClick={() => setViewMode('cancer')}>Cancer</button>
                  <button className={`segmented-item ${viewMode === 'risk' ? 'active' : ''}`} onClick={() => setViewMode('risk')}>Risques</button>
                  <button className={`segmented-item ${viewMode === 'fusion' ? 'active' : ''}`} onClick={() => setViewMode('fusion')}>Fusion</button>
                </div>
              </div>

              {/* Selection tool */}
              <div className="sig-section">
                <button 
                  className={`btn btn-outline ${interactMode === 'select' ? 'active' : ''}`} 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    borderColor: interactMode === 'select' ? '#3b82f6' : '',
                    backgroundColor: interactMode === 'select' ? '#eff6ff' : '' 
                  }}
                  onClick={() => setInteractMode(interactMode === 'select' ? 'view' : 'select')}
                >
                  <MousePointer2 size={16} />
                  Sélectionner une zone
                </button>
              </div>

              {/* Form */}
              <div className="sig-section" ref={formRef}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{formData.id ? 'Modifier la Zone' : 'Ajouter une Zone'}</h3>
                {interactMode === 'view' && !formData.lat && (
                   <div style={{ padding: 10, background: '#eff6ff', borderRadius: 8, fontSize: 12, color: '#3b82f6', marginBottom: 12, display: 'flex', gap: 8 }}>
                     <MapPin size={14} />
                     <span>Cliquez sur la carte pour auto-remplir</span>
                   </div>
                )}
                <form onSubmit={handleSaveZone}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Nom de la zone</label>
                    <input className={`form-control ${errors.name ? 'error' : ''}`} value={formData.name} onChange={e => {setFormData({...formData, name: e.target.value}); setErrors({...errors, name: null})}} placeholder="Ex: Usine Arzew" />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className="form-row" style={{ gap: 12, marginBottom: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Wilaya</label>
                      <select className={`form-control ${errors.wilaya ? 'error' : ''}`} value={formData.wilaya} onChange={e => {setFormData({...formData, wilaya: e.target.value, city: ''}); setErrors({...errors, wilaya: null})}}>
                        <option value="">Choisir...</option>
                        {allWilayasData.map(w => <option key={w.nom} value={w.nom}>{w.nom}</option>)}
                      </select>
                      {errors.wilaya && <span className="error-text">{errors.wilaya}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Ville / Commune</label>
                      <select 
                        className={`form-control ${errors.city ? 'error' : ''}`} 
                        value={formData.city} 
                        onChange={e => {setFormData({...formData, city: e.target.value}); setErrors({...errors, city: null})}}
                        disabled={!formData.wilaya}
                      >
                        <option value="">{formData.wilaya ? '-- Choisir une ville --' : '-- Choisir wilaya d\'abord --'}</option>
                        {currentCommunes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <span className="error-text">{errors.city}</span>}
                    </div>
                  </div>

                  <div className="form-row" style={{ gap: 12, marginBottom: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Latitude</label>
                      <input className={`form-control ${errors.coords ? 'error' : ''}`} value={formData.lat} readOnly placeholder="Auto" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Longitude</label>
                      <input className={`form-control ${errors.coords ? 'error' : ''}`} value={formData.lng} readOnly placeholder="Auto" />
                    </div>
                  </div>
                  {errors.coords && <span className="error-text" style={{ marginBottom: 12 }}>{errors.coords}</span>}

                  <div className="form-row" style={{ gap: 12, marginBottom: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Type</label>
                      <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        {Object.entries(ZONE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Risque</label>
                      <select className="form-control" value={formData.risk} onChange={e => setFormData({...formData, risk: e.target.value})}>
                        {Object.entries(RISK_LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <button className="btn btn-primary" type="submit" style={{ marginTop: 8 }}>
                    {formData.id ? 'Mettre à jour' : '+ Ajouter la Zone'}
                  </button>
                  {formData.id && <button className="btn btn-outline" style={{ marginTop: 8, width: '100%' }} onClick={resetForm}>Annuler</button>}
                </form>
              </div>

              {/* List */}
              <div className="sig-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="sig-label-small" style={{ marginBottom: 0 }}>Zones enregistrées</span>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>{zones.length}</span>
                </div>
                
                {zones.length === 0 ? (
                  <div className="empty-state-list">
                     Aucune zone ajoutée. Cliquez sur la carte ou remplissez le formulaire.
                  </div>
                ) : (
                  <div className="zone-list">
                    {zones.map(z => (
                      <div 
                        key={z.id} 
                        className={`zone-row ${selectedZoneId === z.id ? 'active' : ''}`}
                        onClick={() => selectZone(z)}
                      >
                        <div className="zone-dot" style={{ background: RISK_LEVELS[z.risk]?.color || '#ccc' }} />
                        <div className="zone-info">
                          <span className="zone-name">{z.name}</span>
                          <span className="zone-meta">{z.wilaya}</span>
                        </div>
                        <div className="zone-actions">
                          <button className="btn-icon" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); handleEdit(z); }}><Pencil size={12} /></button>
                          <button className="btn-icon" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); handleDelete(z.id); }}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exports */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: 11 }}>Exporter JSON</button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: 11 }}>Exporter CSV</button>
              </div>

            </div>
          </div>

          {/* MAP DISPLAY */}
          <div className="sig-map-card">
             {interactMode === 'view' && !formData.lat && <div className="floating-pill"><MapPin size={16} /> Mode placement actif</div>}
             {interactMode === 'select' && <div className="floating-pill" style={{ background: '#0ea5e9' }}><MousePointer2 size={16} /> Mode sélection actif — Cliquez sur un marqueur</div>}
             
             <MapContainer 
              center={ALGERIA_CENTER} 
              zoom={6} 
              minZoom={5}
              maxZoom={16}
              maxBounds={ALGERIA_BOUNDS}
              maxBoundsViscosity={1.0}
              style={{ height: '100%', width: '100%' }}
              whenCreated={setMapRef}
              className={`map-viewport ${interactMode === 'view' && !formData.lat ? 'picking-active' : ''} ${interactMode === 'select' ? 'selecting-active' : ''}`}
             >
                <TileLayer 
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                />
                
                <MapEvents 
                  mode={interactMode === 'select' ? 'select' : 'pick'} 
                  onMapClick={handleMapClick} 
                  onDeselect={() => setSelectedZoneId(null)}
                />

                {/* OPTION C: MASK & BORDER */}
                {maskGeoJson && (
                  <GeoJSON 
                    data={maskGeoJson}
                    style={{
                      fillColor: '#0f172a',
                      fillOpacity: 0.55,
                      color: 'transparent',
                      stroke: false
                    }}
                    interactive={false}
                  />
                )}

                {algeriaGeoJson && (
                  <GeoJSON 
                    data={algeriaGeoJson}
                    style={{
                      color: '#3b82f6',
                      weight: 2.5,
                      fill: false,
                      opacity: 0.9
                    }}
                    interactive={false}
                  />
                )}

                {/* CANCER LAYER */}
                {(viewMode === 'cancer' || viewMode === 'fusion') && CANCER_DATA.map((c, idx) => {
                  const score = viewMode === 'fusion' ? calculateFusionScore(c) : null;
                  const radius = 20000 + (c.count / maxCases) * 60000;
                  const color = c.count / maxCases > 0.7 ? '#ef4444' : c.count / maxCases > 0.4 ? '#f97316' : '#10b981';
                  
                  return (
                    <Circle 
                      key={`c-${idx}`}
                      center={[c.lat, c.lng]}
                      radius={radius}
                      pathOptions={{ fillColor: color, fillOpacity: viewMode === 'fusion' ? 0.3 : 0.15, color: color, weight: 1 }}
                    >
                      <Popup>
                        <div className="custom-popup-body">
                          <div className="custom-popup-header">{c.nom}</div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>{c.count} cas récents</div>
                          {score && (
                            <div style={{ marginTop: 10, padding: '6px 10px', background: '#fef3c7', borderRadius: 8, color: '#92400e', fontSize: 12, fontWeight: 700 }}>
                              Score de corrélation: {score}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

                {/* RISK LAYER */}
                {(viewMode === 'risk' || viewMode === 'fusion') && zones.map(z => (
                  <Marker 
                    key={z.id} 
                    position={[z.lat, z.lng]} 
                    icon={createRiskIcon(z.type, z.risk, selectedZoneId === z.id)}
                    eventHandlers={{ 
                      click: (e) => {
                        if (interactMode === 'select') {
                          L.DomEvent.stopPropagation(e);
                          setSelectedZoneId(z.id);
                          setInteractMode('view');
                        }
                      } 
                    }}
                  >
                    <Popup>
                      <div className="custom-popup-body">
                        <div className="custom-popup-header">{ZONE_TYPES[z.type]?.label}: {z.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{z.city}, {z.wilaya}</div>
                        <span className={`badge`} style={{ background: RISK_LEVELS[z.risk]?.color + '22', color: RISK_LEVELS[z.risk]?.color, fontSize: 10 }}>
                          Risque {RISK_LEVELS[z.risk]?.label}
                        </span>
                        {z.notes && <div style={{ marginTop: 8, fontSize: 11, fontStyle: 'italic', color: '#64748b' }}>"{z.notes}"</div>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
             </MapContainer>

             {/* DETAIL PANEL */}
             {selectedZoneId && (
               <div className="map-detail-panel" style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                 <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ background: '#f1f5f9', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Navigation size={18} color="#3b82f6" />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Détails de Zone</h4>
                        <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Analyse Spatiale</span>
                      </div>
                    </div>
                    <button className="btn-icon" style={{ padding: 4, borderRadius: '50%' }} onClick={() => setSelectedZoneId(null)}><X size={14} /></button>
                 </div>
                 
                 {(() => {
                   const z = zones.find(zz => zz.id === selectedZoneId);
                   if (!z) return null;
                   return (
                     <>
                       <div style={{ marginBottom: 16 }}>
                         <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{z.name}</div>
                         <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} /> {z.city}, {z.wilaya}
                         </div>
                       </div>
                       
                       <div className="detail-attr-grid">
                          <div className="detail-attr-item">
                            <label>Type de risque</label>
                            <span>{ZONE_TYPES[z.type]?.label}</span>
                          </div>
                          <div className="detail-attr-item">
                            <label>Niveau Danger</label>
                            <span style={{ color: RISK_LEVELS[z.risk]?.color }}>{RISK_LEVELS[z.risk]?.label}</span>
                          </div>
                          <div className="detail-attr-item">
                            <label>Coordonnées</label>
                            <span style={{ fontSize: 10 }}>{z.lat.toFixed(4)}, {z.lng.toFixed(4)}</span>
                          </div>
                          <div className="detail-attr-item">
                            <label>Impact</label>
                            <span style={{ color: '#10b981' }}>Analyse OK</span>
                          </div>
                       </div>

                       {z.notes && (
                         <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 11, color: '#64748b', marginBottom: 16, fontStyle: 'italic' }}>
                           "{z.notes}"
                         </div>
                       )}

                       <div style={{ display: 'flex', gap: 10 }}>
                         <button className="btn btn-outline btn-sm" style={{ flex: 1, padding: '8px', fontSize: 12 }} onClick={() => handleEdit(z)}><Pencil size={14} /> Modifier</button>
                         <button className="btn btn-outline btn-sm" style={{ flex: 1, padding: '8px', fontSize: 12, color: '#ef4444', borderColor: '#fee2e2' }} onClick={() => handleDelete(z.id)}><Trash2 size={14} /> Supprimer</button>
                       </div>
                     </>
                   );
                 })()}
               </div>
             )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
