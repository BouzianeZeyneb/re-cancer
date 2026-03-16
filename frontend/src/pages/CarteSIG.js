import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';

// Coordonnées approximatives des wilayas algériennes
const WILAYAS_COORDS = {
  'Adrar': [27.87, -0.29], 'Chlef': [36.16, 1.33], 'Laghouat': [33.8, 2.87],
  'Oum El Bouaghi': [35.87, 7.11], 'Batna': [35.55, 6.17], 'Béjaïa': [36.75, 5.08],
  'Biskra': [34.85, 5.73], 'Béchar': [31.62, -2.22], 'Blida': [36.47, 2.83],
  'Bouira': [36.37, 3.9], 'Tamanrasset': [22.78, 5.52], 'Tébessa': [35.4, 8.12],
  'Tlemcen': [34.88, -1.32], 'Tiaret': [35.37, 1.32], 'Tizi Ouzou': [36.72, 4.05],
  'Alger': [36.74, 3.06], 'Djelfa': [34.67, 3.25], 'Jijel': [36.82, 5.77],
  'Sétif': [36.19, 5.41], 'Saïda': [34.83, 0.15], 'Skikda': [36.87, 6.9],
  'Sidi Bel Abbès': [35.18, -0.63], 'Annaba': [36.9, 7.77], 'Guelma': [36.46, 7.43],
  'Constantine': [36.37, 6.61], 'Médéa': [36.26, 2.75], 'Mostaganem': [35.93, 0.09],
  'MSila': [35.7, 4.54], 'Mascara': [35.4, 0.14], 'Ouargla': [31.95, 5.32],
  'Oran': [35.69, -0.63], 'El Bayadh': [33.68, 1.01], 'Illizi': [26.48, 8.48],
  'Bordj Bou Arréridj': [36.07, 4.76], 'Boumerdès': [36.76, 3.48], 'El Tarf': [36.77, 8.31],
  'Tindouf': [27.67, -8.14], 'Tissemsilt': [35.6, 1.81], 'El Oued': [33.36, 6.86],
  'Khenchela': [35.43, 7.14], 'Souk Ahras': [36.28, 7.95], 'Tipaza': [36.59, 2.44],
  'Mila': [36.45, 6.26], 'Aïn Defla': [36.26, 1.97], 'Naâma': [33.27, -0.31],
  'Aïn Témouchent': [35.3, -1.14], 'Ghardaïa': [32.49, 3.67], 'Relizane': [35.74, 0.56],
};

export default function CarteSIG() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!stats || mapLoaded) return;

    // Load Leaflet dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);

    setMapLoaded(true);
  }, [stats]);

  const initMap = () => {
    if (!window.L || !stats) return;
    const L = window.L;

    // Remove existing map
    if (window._leafletMap) {
      window._leafletMap.remove();
    }

    const map = L.map('algeria-map', {
      center: [28.0, 2.5],
      zoom: 5,
      zoomControl: true,
    });

    window._leafletMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const wilayaData = {};
    (stats.parWilaya || []).forEach(w => { wilayaData[w.wilaya] = w.count; });
    const maxCount = Math.max(...Object.values(wilayaData), 1);

    Object.entries(WILAYAS_COORDS).forEach(([wilaya, coords]) => {
      const count = wilayaData[wilaya] || 0;
      const ratio = count / maxCount;
      const radius = count > 0 ? 15 + ratio * 35 : 8;
      const color = count > 0
        ? `hsl(${220 - ratio * 180}, 80%, ${50 - ratio * 20}%)`
        : '#cbd5e1';

      const circle = L.circleMarker(coords, {
        radius,
        fillColor: color,
        color: count > 0 ? '#fff' : '#94a3b8',
        weight: 2,
        opacity: 1,
        fillOpacity: count > 0 ? 0.85 : 0.4,
      }).addTo(map);

      circle.bindPopup(`
        <div style="font-family:Sora,sans-serif;padding:8px;min-width:150px">
          <div style="font-size:15px;font-weight:800;margin-bottom:4px">${wilaya}</div>
          <div style="font-size:13px;color:${count > 0 ? '#0f4c81' : '#94a3b8'}">
            ${count > 0 ? `<b>${count}</b> cas de cancer` : 'Aucun cas enregistré'}
          </div>
          ${count > 0 ? `<div style="font-size:11px;color:#64748b;margin-top:4px">${((count / (stats.totaux?.cas || 1)) * 100).toFixed(1)}% du total</div>` : ''}
        </div>
      `);

      if (count > 0) {
        const label = L.divIcon({
          html: `<div style="color:white;font-weight:800;font-size:12px;font-family:Sora,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,0.5)">${count}</div>`,
          className: '',
          iconAnchor: [6, 6]
        });
        L.marker(coords, { icon: label }).addTo(map);
      }
    });
  };

  useEffect(() => {
    if (mapLoaded && window.L && stats) {
      setTimeout(initMap, 300);
    }
  }, [mapLoaded, stats]);

  const wilayasData = stats?.parWilaya || [];
  const maxCount = wilayasData.length ? Math.max(...wilayasData.map(w => w.count)) : 1;

  return (
    <Layout title="Carte Géographique SIG">
      {/* Stats rapides */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-value">{wilayasData.length}</div>
          <div className="stat-label">Wilayas touchées</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{wilayasData[0]?.wilaya || '-'}</div>
          <div className="stat-label">Wilaya #1</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-value">{wilayasData[0]?.count || 0}</div>
          <div className="stat-label">Max cas / wilaya</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats?.totaux?.cas || 0}</div>
          <div className="stat-label">Total cas</div>
        </div>
      </div>

      {/* Carte interactive */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2>🗺️ Carte Interactive — Algérie</h2>
          <span className="badge badge-green">● OpenStreetMap</span>
        </div>
        <div style={{ position: 'relative' }}>
          {loading && (
            <div className="loading-center" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.8)' }}>
              <div className="spinner" />
            </div>
          )}
          <div id="algeria-map" style={{ height: 500, width: '100%', borderRadius: '0 0 12px 12px' }} />
        </div>
      </div>

      {/* Tableau wilaya */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><h2>Classement par Wilaya</h2></div>
          <div className="card-body">
            {loading ? <div className="loading-center"><div className="spinner" /></div> :
              wilayasData.length === 0 ? (
                <div className="empty-state">
                  <h3>Aucune donnée géographique</h3>
                  <p>Ajoutez la wilaya des patients</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {wilayasData.map((w, i) => {
                    const percent = (w.count / maxCount) * 100;
                    return (
                      <div key={w.wilaya} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#0f4c81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ width: 100, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{w.wilaya}</div>
                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 6, height: 24, overflow: 'hidden' }}>
                          <div style={{
                            width: `${percent}%`, height: '100%',
                            background: `hsl(${210 + i * 8}, 70%, ${48 + i * 2}%)`,
                            borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: 30
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{w.count}</span>
                          </div>
                        </div>
                        <div style={{ width: 45, fontSize: 12, color: '#64748b', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>
                          {((w.count / (stats?.totaux?.cas || 1)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>🏆 Zones à Forte Incidence</h2></div>
          <div className="card-body">
            {wilayasData.slice(0, 5).map((w, i) => (
              <div key={w.wilaya} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: ['#0f4c81', '#1a6bb5', '#2d8fd4', '#4aa8e8', '#70bef5'][i],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0
                }}>#{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{w.wilaya}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{w.count} cas enregistrés</div>
                </div>
                <span className="badge badge-red">{((w.count / (stats?.totaux?.cas || 1)) * 100).toFixed(1)}%</span>
              </div>
            ))}
            {wilayasData.length === 0 && <div className="empty-state"><h3>Aucune donnée</h3></div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
