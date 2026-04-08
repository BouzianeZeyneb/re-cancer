import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ErrorBar, Text
} from 'recharts';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

// --- PALETTES DE COULEURS ---
const PALETTES = {
  modern: ['#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'],
  clinical: ['#0f4c81', '#7c3aed', '#10b981', '#d97706', '#be123c', '#0369a1'],
  vibrant: ['#ec4899', '#f97316', '#84cc16', '#06b6d4', '#4f46e5', '#14b8a6']
};

const CHART_TYPES = [
  { id: 'bar-v', label: 'Bâtons / Barres verticales' },
  { id: 'bar-h', label: 'Barres horizontales' },
  { id: 'bar-grouped', label: 'Barres groupées' },
  { id: 'bar-stacked', label: 'Barres empilées' },
  { id: 'histogram', label: 'Histogramme (Classes d\'âge)' },
  { id: 'pie', label: 'Circulaire (Camembert)' },
  { id: 'donut', label: 'Anneau (Donut)' },
  { id: 'line', label: 'Courbe linéaire' },
  { id: 'kaplan', label: 'Courbe de survie Kaplan-Meier' },
  { id: 'pyramid', label: 'Pyramide des âges' },
  { id: 'scatter', label: 'Nuage de points (Scatter)' },
  { id: 'wilaya', label: 'Carte Wilaya (Représentation Bar)' },
  { id: 'boxplot', label: 'Diagramme en boîte (Box plot)' },
  { id: 'radar', label: 'Radar / Toile d\'araignée' },
  { id: 'waterfall', label: 'Graphique en cascade' },
  { id: 'gantt', label: 'Diagramme de Gantt (Délais)' },
  { id: 'heatmap', label: 'Heatmap (Âge × Localis.)' },
  { id: 'bubble', label: 'Diagramme à bulles' },
  { id: 'sankey', label: 'Diagramme de Sankey (Flux)' },
  { id: 'forest', label: 'Forest Plot (Méta-analyse)' }
];

const DATA_SOURCES = [
  { id: 'incidence', label: 'Incidence par type de cancer' },
  { id: 'sexe', label: 'Répartition par sexe' },
  { id: 'age', label: 'Distribution par tranche d\'âge' },
  { id: 'stade', label: 'Distribution par stade' },
  { id: 'evolution', label: 'Évolution annuelle (2015-2024)' },
  { id: 'taux', label: 'Taux incidence standardisé' },
  { id: 'survie', label: 'Taux de survie (1, 3, 5 ans)' },
  { id: 'wilaya', label: 'Répartition par wilaya' },
  { id: 'traitement', label: 'Types de traitement reçu' },
  { id: 'risque', label: 'Facteurs de risque' },
  { id: 'delai', label: 'Délai diag → traitement' },
  { id: 'histologie', label: 'Type histologique tumors' }
];

// --- MOCK DATA FACTORY ---
const getMockData = (sourceId) => {
  switch (sourceId) {
    case 'incidence': return [
      { name: 'Sein', value: 245, extra: 180 }, { name: 'Poumon', value: 190, extra: 120 },
      { name: 'Colorectal', value: 150, extra: 90 }, { name: 'Thyroïde', value: 110, extra: 40 }
    ];
    case 'sexe': return [{ name: 'Homme', value: 520 }, { name: 'Femme', value: 480 }];
    case 'age': return [
      { name: '0-14', value: 45 }, { name: '15-29', value: 120 }, { name: '30-44', value: 250 },
      { name: '45-59', value: 380 }, { name: '60-74', value: 210 }, { name: '75+', value: 95 }
    ];
    case 'stade': return [
      { name: 'Stade I', value: 180 }, { name: 'Stade II', value: 220 },
      { name: 'Stade III', value: 140 }, { name: 'Stade IV', value: 80 }
    ];
    case 'evolution': return [
      { name: '2015', value: 450 }, { name: '2018', value: 680 }, { name: '2021', value: 720 }, { name: '2024', value: 847 }
    ];
    case 'traitement': return [
      { name: 'Chirurgie', value: 420 }, { name: 'Chimio', value: 380 },
      { name: 'Radio', value: 250 }, { name: 'Immuno', value: 110 }
    ];
    case 'kaplan': return [
      { name: '0j', value: 100 }, { name: '1an', value: 95 }, { name: '2ans', value: 88 },
      { name: '3ans', value: 82 }, { name: '4ans', value: 75 }, { name: '5ans', value: 68 }
    ];
    case 'delai': return [
      { name: 'S1', value: 10 }, { name: 'S2', value: 25 }, { name: 'S4', value: 45 }, { name: 'S8', value: 15 }, { name: 'S12+', value: 5 }
    ];
    case 'wilaya': return [
      { name: 'Alger', value: 450 }, { name: 'Oran', value: 320 }, { name: 'Constantine', value: 280 }, { name: 'Annaba', value: 190 }
    ];
    default: return [{ name: 'A', value: 10 }, { name: 'B', value: 20 }, { name: 'C', value: 15 }];
  }
};

export default function Statistiques() {
  const [rawData, setRawData] = useState([]);
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('oncotrack_advanced_stats');
    return saved ? JSON.parse(saved) : [
      { id: 'w1', title: 'Incidence par Wilaya', type: 'bar-v', source: 'wilaya', size: 'M', color: '#0ea5e9', showLegend: true, orientation: 'vertical', xAxis: 'Région', yAxis: 'Nb Cas', dataLabels: true, data: getMockData('wilaya') },
      { id: 'w2', title: 'Répartition Sexe', type: 'pie', source: 'sexe', size: 'S', color: '#6366f1', showLegend: true, orientation: 'vertical', xAxis: 'Genre', yAxis: 'Effectif', dataLabels: true, data: getMockData('sexe') }
    ];
  });

  const [editingId, setEditingId] = useState(null); 
  const [modalOpen, setModalOpen] = useState(false); 
  const [tempConfig, setTempConfig] = useState(null); 

  useEffect(() => {
    api.get('/stats/raw')
      .then(res => setRawData(res.data))
      .catch(() => toast.error('Erreur SQL ou accès aux données'));
  }, []);

  useEffect(() => {
    localStorage.setItem('oncotrack_advanced_stats', JSON.stringify(widgets));
  }, [widgets]);

  const handleCreateNew = () => {
    const config = {
      id: Date.now().toString(),
      title: 'Nouveau Graphique',
      type: 'bar-v',
      source: 'incidence',
      size: 'M',
      color: '#0ea5e9',
      showLegend: true,
      orientation: 'vertical',
      xAxis: 'Catégorie',
      yAxis: 'Valeur',
      dataLabels: true,
      data: getMockData('incidence')
    };
    setTempConfig(config);
    setModalOpen(true);
  };

  const handleEdit = (widget) => {
    setTempConfig({ ...widget });
    setEditingId(widget.id);
  };

  const syncUpdate = (updates) => {
    setTempConfig(prev => {
      const next = { ...prev, ...updates };
      if (updates.source) next.data = getMockData(updates.source);
      return next;
    });
    if (editingId) {
      setWidgets(prev => prev.map(w => w.id === editingId ? { ...tempConfig, ...updates, data: updates.source ? getMockData(updates.source) : tempConfig.data } : w));
    }
  };

  const saveNew = () => {
    setWidgets([...widgets, tempConfig]);
    setModalOpen(false);
    setTempConfig(null);
  };

  const removeWidget = (id) => {
    if (window.confirm('Supprimer ce graphique ?')) {
      setWidgets(widgets.filter(w => w.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  return (
    <Layout title="Analyses Statistiques Avancées">
      <div style={{ padding: '0 20px 40px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30, marginTop: 20 }}>
          <KPICard label="Total Patients" value={Array.isArray(rawData) ? rawData.length : 0} trend="+5.2% vs 2024" color="cyan" />
          <KPICard label="Nouveaux Cas 2025" value={Array.isArray(rawData) ? rawData.filter(d => d?.date_diagnostic && new Date(d.date_diagnostic).getFullYear() === 2025).length : 0} trend="Projection annuelle" color="blue" />
          <KPICard label="Taux Survie 5 ans" value="68.4%" trend="+1.2pp vs 2024" color="teal" />
          <KPICard label="Type Dominant" value={
            Array.isArray(rawData) && rawData.length > 0 ? (
              Object.entries(rawData.reduce((acc, curr) => {
                if (curr?.type_cancer) {
                  acc[curr.type_cancer] = (acc[curr.type_cancer] || 0) + 1;
                }
                return acc;
              }, {}))
              .sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'
            ) : 'N/A'
          } trend="Plus haute fréquence" color="navy" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>OncoTrack Data Intelligence — Éditeur dynamique de rapports cliniques</p>
          <button className="btn btn-primary" onClick={handleCreateNew} style={{ background: '#0f4c81', borderRadius: 8, padding: '10px 24px', fontWeight: 600, border: 'none' }}>
            + Ajouter un graphique
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 25 }}>
          {widgets.map(w => {
            const widthMap = { 'S': 'calc(33.33% - 17px)', 'M': 'calc(50% - 13px)', 'G': '100%' };
            return (
              <div key={w.id} style={{ flexBasis: widthMap[w.size || 'M'], minWidth: w.size === 'S' ? 280 : 450, flexGrow: 1 }}>
                <div className="card" style={{ padding: '24px', borderRadius: 16, border: '1px solid #f1f5f9', background: 'white', position: 'relative', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#334155' }}>{w.title}</h4>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleEdit(w)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                      </button>
                      <button onClick={() => removeWidget(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ height: 350 }}>
                    <ChartEngine config={w} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {modalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '900px', maxWidth: '95%', height: '80vh', backgroundColor: 'white', borderRadius: 20, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, padding: 30, borderRight: '1px solid #eef2f6', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: 25 }}>Configurez votre rapport</h3>
                <EditorPanel config={tempConfig} update={syncUpdate} />
                <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
                  <button onClick={saveNew} className="btn btn-primary" style={{ flex: 1 }}>Ajouter au Tableau</button>
                  <button onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
                </div>
              </div>
              <div style={{ flex: 1, padding: 40, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>APERÇU CLINIQUE EN TEMPS RÉEL</h4>
                <div style={{ flex: 1, backgroundColor: 'white', border: '1px solid #eef2f6', borderRadius: 16, padding: 20 }}>
                  <ChartEngine config={tempConfig} />
                </div>
              </div>
            </div>
          </div>
        )}

        {editingId && (
          <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100%', backgroundColor: 'white', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 11000, padding: 30, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
              <h3 style={{ margin: 0 }}>Éditeur de Widget</h3>
              <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <EditorPanel config={tempConfig} update={syncUpdate} isInline />
            <div style={{ marginTop: 40 }}>
               <button onClick={() => setEditingId(null)} className="btn btn-primary" style={{ width: '100%' }}>Fermer l'édition</button>
               <button onClick={() => removeWidget(editingId)} className="btn btn-outline" style={{ width: '100%', marginTop: 10, color: '#ef4444', borderColor: '#ef4444' }}>Supprimer le graphique</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .btn-outline:hover { background: #f8fafc; }
        input[type="color"] { border: none; width: 40px; height: 30px; cursor: pointer; background: none; }
        .data-table tr:hover { background: #f1f5f9; }
        .data-table input { border: none; background: transparent; width: 100%; font-size: 11px; padding: 4px; }
      `}</style>
    </Layout>
  );
}

function KPICard({ label, value, trend, color }) {
  return (
    <div className="card" style={{ padding: '24px', borderRadius: 16, border: '1px solid #f1f5f9', textAlign: 'left' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: trend.includes('+') ? '#10b981' : '#94a3b8', fontWeight: 600 }}>{trend}</div>
    </div>
  );
}

function EditorPanel({ config, update, isInline }) {
  if (!config) return null;

  const handleDataChange = (index, field, val) => {
    const newData = [...config.data];
    newData[index][field] = field === 'value' ? Number(val) : val;
    update({ data: newData });
  };

  const addRow = () => update({ data: [...config.data, { name: 'Nouveau', value: 0 }] });
  const deleteRow = (i) => update({ data: config.data.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="form-group">
        <label className="form-label">Titre du graphique</label>
        <input className="form-control" value={config.title} onChange={e => update({ title: e.target.value })} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Taille du graphique</label>
          <select className="form-control" value={config.size || 'M'} onChange={e => update({ size: e.target.value })}>
            <option value="S">S (Small - 1/3)</option>
            <option value="M">M (Médium - 1/2)</option>
            <option value="G">G (Grand - 100%)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Type de graphique</label>
          <select className="form-control" value={config.type} onChange={e => update({ type: e.target.value })}>
            {CHART_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Source de données</label>
        <select className="form-control" value={config.source} onChange={e => update({ source: e.target.value })}>
          {DATA_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Label Axe X</label>
          <input className="form-control" value={config.xAxis} onChange={e => update({ xAxis: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Label Axe Y</label>
          <input className="form-control" value={config.yAxis} onChange={e => update({ yAxis: e.target.value })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Couleur principale</label>
          <input type="color" value={config.color} onChange={e => update({ color: e.target.value })} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <input type="checkbox" checked={config.showLegend} onChange={e => update({ showLegend: e.target.checked })} />
           <label style={{ fontSize: 13, fontWeight: 600 }}>Afficher légende</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <input type="checkbox" checked={config.orientation === 'horizontal'} onChange={e => update({ orientation: e.target.checked ? 'horizontal' : 'vertical' })} />
           <label style={{ fontSize: 13, fontWeight: 600 }}>Horizontal</label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          Tableau des données 
          <button onClick={addRow} style={{ padding: '0 8px', fontSize: 10, borderRadius: 4, background: '#eee' }}>+ Ligne</button>
        </label>
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eef2f6', borderRadius: 8 }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr style={{ background: '#f8fafc', textAlign: 'left' }}><th style={{ padding: 8 }}>Label</th><th style={{ padding: 8 }}>Valeur</th><th style={{ width: 30 }}></th></tr></thead>
            <tbody>
              {config.data.map((d, i) => (
                <tr key={i}>
                  <td><input value={d.name} onChange={e => handleDataChange(i, 'name', e.target.value)} /></td>
                  <td><input type="number" value={d.value} onChange={e => handleDataChange(i, 'value', e.target.value)} /></td>
                  <td><button onClick={() => deleteRow(i)} style={{ color: '#ef4444', border: 'none', background: 'transparent' }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => toast.success('Exportation PNG en cours...')} className="btn btn-outline" style={{ flex: 1, fontSize: 12 }}>Export PNG</button>
        <button onClick={() => toast.success('Génération PDF...')} className="btn btn-outline" style={{ flex: 1, fontSize: 12 }}>Export PDF</button>
      </div>
    </div>
  );
}

function ChartEngine({ config }) {
  const { type, data, color, showLegend, orientation, xAxis, yAxis } = config;

  if (!data || data.length === 0) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Données manquantes</div>;

  const isBar = type.startsWith('bar');
  const isHorizontal = orientation === 'horizontal' || type === 'bar-h';

  const renderChart = () => {
    switch (type) {
      case 'pie':
      case 'donut':
        return (
          <PieChart>
            <Pie data={data} innerRadius={type === 'donut' ? 60 : 0} outerRadius={110} paddingAngle={5} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={i === 0 ? color : PALETTES.modern[i % PALETTES.modern.length]} />)}
            </Pie>
            <Tooltip />
            {showLegend && <Legend verticalAlign="bottom" height={36}/>}
          </PieChart>
        );

      case 'line':
      case 'kaplan':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 10 }} label={{ value: xAxis, position: 'insideBottom', offset: -5 }} />
            <YAxis axisLine={false} tickLine={false} style={{ fontSize: 10 }} label={{ value: yAxis, angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Line type={type === 'kaplan' ? 'stepAfter' : 'monotone'} dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        );

      case 'radar':
        return (
          <RadarChart outerRadius={90} data={data}>
            <PolarGrid stroke="#eef2f6" />
            <PolarAngleAxis dataKey="name" style={{ fontSize: 10 }} />
            <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        );

      case 'scatter':
      case 'bubble':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="value" name={xAxis} style={{ fontSize: 10 }} />
            <YAxis dataKey="extra" name={yAxis} style={{ fontSize: 10 }} />
            <ZAxis type="number" dataKey="value" range={[60, 400]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Cas" data={data} fill={color}>
              {type === 'bubble' && data.map((entry, index) => <Cell key={index} fill={PALETTES.modern[index % 6]} />)}
            </Scatter>
          </ScatterChart>
        );

      case 'pyramid':
        const pyramidData = data.map(d => ({ ...d, male: Math.abs(d.value), female: -Math.abs(d.value * 0.9) }));
        return (
          <BarChart data={pyramidData} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="male" fill={color} stackId="a" />
            <Bar dataKey="female" fill="#ec4899" stackId="a" />
          </BarChart>
        );

      default: 
        return (
          <BarChart data={data} layout={isHorizontal ? 'vertical' : 'horizontal'} margin={isHorizontal ? { left: 40 } : {}}>
            <CartesianGrid strokeDasharray="3 3" vertical={isHorizontal} horizontal={!isHorizontal} stroke="#f1f5f9" />
            <XAxis dataKey={isHorizontal ? 'value' : 'name'} type={isHorizontal ? 'number' : 'category'} axisLine={false} tickLine={false} style={{ fontSize: 10 }} />
            <YAxis dataKey={isHorizontal ? 'name' : 'value'} type={isHorizontal ? 'category' : 'number'} axisLine={false} tickLine={false} style={{ fontSize: 10 }} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            {showLegend && <Legend />}
            <Bar 
              dataKey="value" 
              fill={color} 
              stackId={type === 'bar-stacked' ? 'a' : undefined}
              radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              barSize={isHorizontal ? 15 : 30}
            />
            {type === 'bar-grouped' && <Bar dataKey="extra" fill={PALETTES.modern[1]} radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={isHorizontal ? 15 : 30} />}
          </BarChart>
        );
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
}
