import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { getAllWilayasData } from '../data/wilayasData';
import 'leaflet/dist/leaflet.css';

export default function CarteSIG() {
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [maxCases, setMaxCases] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isAnalyzingIA, setIsAnalyzingIA] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/stats/dashboard');
        const parWilaya = res.data?.parWilaya || [];
        
        const allWilayas = getAllWilayasData() || [];
        let maxC = 0;

        const merged = allWilayas.map(w => {
          if (!w) return null;
          const wNom = w.nom ? w.nom.toLowerCase() : '';
          const match = parWilaya.find(pw => {
            const pwWilaya = pw.wilaya ? pw.wilaya.toLowerCase() : '';
            return pwWilaya === wNom;
          });
          const count = match ? Number(match.count) || 0 : 0;
          if (count > maxC) maxC = count;
          return { ...w, count };
        }).filter(Boolean);

        setMaxCases(maxC > 0 ? maxC : 1);
        setMapData(merged.filter(m => m.count > 0 || m.nom === 'Alger'));
      } catch (err) {
        console.error('Failed to fetch SIG stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getRadius = (count) => {
    if (!count) return 5;
    const radius = 8 + (count / maxCases) * 32;
    return isNaN(radius) ? 5 : radius;
  };

  const handleAnalyzeIA = async () => {
    if (!selectedWilaya) return;
    setIsAnalyzingIA(true);
    setAiReport(null);
    try {
      const payload = {
        wilaya: selectedWilaya.nom,
        count: selectedWilaya.count,
        zones: selectedWilaya.zones || []
      };
      const res = await api.post('/stats/ia-analysis', payload);
      setAiReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingIA(false);
    }
  };

  const closeSidebar = () => {
    setSelectedWilaya(null);
    setAiReport(null);
    setIsAnalyzingIA(false);
  };

  return (
    <Layout title="Carte SIG (Système d'Information Géographique)">
      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 120px)' }}>
        
        <div className="card" style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
          {loading || !isMounted ? (
             <div className="loading-center"><div className="spinner" /></div>
          ) : (
             <MapContainer 
               center={[28.0339, 1.6596]}
               zoom={6} 
               style={{ height: '100%', width: '100%', minHeight: 400 }}
               zoomControl={true}
             >
               <TileLayer
                 url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                 attribution='&copy; CARTO'
               />
               {mapData.filter(w => w && !isNaN(w.lat) && !isNaN(w.lng)).map((w, index) => (
                 <CircleMarker
                   key={index}
                   center={[w.lat, w.lng]}
                   radius={getRadius(w.count)}
                   pathOptions={{
                     fillColor: w.count > 0 ? '#e63946' : '#cbd5e1',
                     fillOpacity: 0.6,
                     color: w.count > 0 ? '#991b1b' : '#94a3b8',
                     weight: 2
                   }}
                   eventHandlers={{
                     click: () => {
                       setSelectedWilaya(w);
                       setAiReport(null);
                       setIsAnalyzingIA(false);
                     }
                   }}
                 >
                   <Popup>
                     <div style={{ textAlign: 'center', fontFamily: 'Sora' }}>
                       <strong>{w.nom}</strong><br/>
                       {w.count} cas recensés
                     </div>
                   </Popup>
                 </CircleMarker>
               ))}

             </MapContainer>
          )}
        </div>

        {selectedWilaya && (
          <div className="card" style={{ width: 350, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f4c81', fontSize: 20 }}>{selectedWilaya.nom}</h3>
                <div style={{ color: '#64748b', fontSize: 13 }}>Wilaya d'Algérie</div>
              </div>
              <button 
                onClick={closeSidebar} 
                style={{ background: '#f1f5f9', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
              <div style={{ background: selectedWilaya.count > 0 ? '#fee2e2' : '#f8fafc', border: `1px solid ${selectedWilaya.count > 0 ? '#fecaca' : '#e2e8f0'}`, borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: selectedWilaya.count > 0 ? '#e63946' : '#94a3b8', lineHeight: 1 }}>{selectedWilaya.count}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedWilaya.count > 0 ? '#991b1b' : '#64748b', marginTop: 4 }}>Cas de cancer</div>
              </div>

              {selectedWilaya.zones && selectedWilaya.zones.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>
                    🏭 Zones Industrielles ({selectedWilaya.zones.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedWilaya.zones.map((zone, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, color: '#b45309', fontWeight: 600 }}>
                        • {zone}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedWilaya.communes && selectedWilaya.communes.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>
                    🏙️ Communes principales ({selectedWilaya.communes.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedWilaya.communes.map((commune, idx) => (
                      <div key={idx} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 12.5, color: '#334155' }}>
                        {commune}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION INTELLIGENCE ARTIFICIELLE */}
              <div style={{ marginTop: 10, paddingTop: 20, borderTop: '2px dashed #e2e8f0' }}>
                {!aiReport && !isAnalyzingIA && selectedWilaya.count > 0 && (
                  <button 
                    onClick={handleAnalyzeIA}
                    className="btn btn-primary" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Analyser les causes avec l'IA
                  </button>
                )}

                {isAnalyzingIA && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div className="spinner" style={{ borderColor: '#7c3aed', borderRightColor: 'transparent', margin: '0 auto 15px' }}></div>
                    <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: 14 }}>L'Agent IA analyse les données environnementales...</div>
                  </div>
                )}

                {aiReport && (
                  <div style={{ animation: 'slideIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <div style={{ background: '#7c3aed', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 'bold' }}>IA ACTIF</div>
                      <h4 style={{ margin: 0, color: '#334155', fontSize: 15 }}>Rapport Prédictif</h4>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', marginBottom: 8 }}>🌿 Environnement</div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiReport.environmental.map((fact, idx) => <li key={idx}>{fact}</li>)}
                      </ul>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', marginBottom: 8 }}>👤 Comportement Local</div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiReport.behavioral.map((fact, idx) => <li key={idx}>{fact}</li>)}
                      </ul>
                    </div>

                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>💡 Recommandation IA</div>
                      <div style={{ fontSize: 13, color: '#14532d', lineHeight: 1.5 }}>
                        {aiReport.recommendation}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </Layout>
  );
}
