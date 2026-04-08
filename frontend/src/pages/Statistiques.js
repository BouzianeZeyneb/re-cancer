import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, ErrorBar, Text, FunnelChart, Funnel
} from 'recharts';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

// --- PALETTES & CONSTANTES ---
const PALETTES = {
  modern: ['#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316'],
  clinical: ['#0f4c81', '#7c3aed', '#10b981', '#d97706', '#be123c', '#0369a1', '#1a6bb5', '#40916c'],
};

const CHART_TYPES = [
  { id: 'bar-v', label: '1. Diagramme en bâtons / barres verticales' },
  { id: 'bar-h', label: '2. Diagramme en barres horizontales' },
  { id: 'bar-grouped', label: '3. Diagramme en barres groupées' },
  { id: 'bar-stacked', label: '4. Diagramme en barres empilées' },
  { id: 'histogram', label: '5. Histogramme (Classes d\'âge)' },
  { id: 'pie', label: '6. Diagramme circulaire (Pie)' },
  { id: 'donut', label: '7. Diagramme en anneau (Donut)' },
  { id: 'line', label: '8. Courbe linéaire (Évolution)' },
  { id: 'kaplan', label: '9. Courbe de survie Kaplan-Meier' },
  { id: 'pyramid', label: '10. Pyramide des âges' },
  { id: 'scatter', label: '11. Diagramme de dispersion (Scatter)' },
  { id: 'choropleth', label: '12. Carte par Wilaya (Distribution Bar)' },
  { id: 'boxplot', label: '13. Diagramme en boîte (Box plot)' },
  { id: 'radar', label: '14. Diagramme en radar (Radar)' },
  { id: 'waterfall', label: '15. Graphique en cascade (Waterfall)' },
  { id: 'gantt', label: '16. Diagramme de Gantt (Délais)' },
  { id: 'heatmap', label: '17. Heatmap (Âge × Localisation)' },
  { id: 'bubble', label: '18. Diagramme à bulles (Bubble)' },
  { id: 'sankey', label: '19. Diagramme de Sankey (Flux)' },
  { id: 'forest', label: '20. Forest plot (Méta-analyse)' },
];

const DATA_SOURCES = [
  { id: 'incidence', label: '1. Incidence par type de cancer' },
  { id: 'sexe', label: '2. Répartition par sexe' },
  { id: 'age', label: '3. Distribution par tranche d\'âge' },
  { id: 'stade', label: '4. Distribution par stade' },
  { id: 'evolution', label: '5. Évolution annuelle (2015-2024)' },
  { id: 'taux', label: '6. Taux d\'incidence standardisé' },
  { id: 'survie', label: '7. Taux de survie (1, 3, 5 ans)' },
  { id: 'wilaya', label: '8. Répartition par wilaya' },
  { id: 'traitement', label: '9. Types de traitement reçu' },
  { id: 'risque', label: '10. Facteurs de risque' },
  { id: 'delai', label: '11. Délai diagnostic → traitement' },
  { id: 'histologie', label: '12. Type histologique' },
];

// --- MOCK DATA FACTORY ---
const getMockData = (sourceId) => {
  switch (sourceId) {
    case 'incidence': return [{ name: 'Sein', value: 245, extra: 180 }, { name: 'Poumon', value: 190, extra: 120 }, { name: 'Colorectal', value: 150, extra: 90 }, { name: 'Thyroïde', value: 110, extra: 40 }];
    case 'sexe': return [{ name: 'Hommes', value: 520 }, { name: 'Femmes', value: 480 }];
    case 'age': return [{ name: '0-14', value: 45 }, { name: '15-29', value: 120 }, { name: '30-44', value: 250 }, { name: '45-59', value: 380 }, { name: '60-74', value: 210 }, { name: '75+', value: 95 }];
    case 'stade': return [{ name: 'Stade I', value: 180 }, { name: 'Stade II', value: 220 }, { name: 'Stade III', value: 140 }, { name: 'Stade IV', value: 80 }];
    case 'evolution': return [{ name: '2015', value: 450 }, { name: '2018', value: 680 }, { name: '2021', value: 720 }, { name: '2024', value: 847 }];
    case 'taux': return [{ name: 'Algérie', value: 142 }, { name: 'Moy. Mondiale', value: 198 }];
    case 'survie': return [{ name: '1 an', value: 85 }, { name: '3 ans', value: 72 }, { name: '5 ans', value: 68 }];
    case 'wilaya': return [{ name: 'Alger', value: 450 }, { name: 'Oran', value: 320 }, { name: 'Constantine', value: 280 }, { name: 'Annaba', value: 190 }];
    case 'traitement': return [{ name: 'Chirurgie', value: 420 }, { name: 'Chimio', value: 380 }, { name: 'Radio', value: 250 }, { name: 'Immuno', value: 110 }];
    case 'risque': return [{ name: 'Tabac', value: 58 }, { name: 'Obésité', value: 42 }, { name: 'ATCD Fam', value: 28 }, { name: 'Alcool', value: 15 }];
    case 'delai': return [{ name: 'S1', value: 30 }, { name: 'S2-4', value: 45 }, { name: 'S5-8', value: 20 }, { name: 'S9+', value: 5 }];
    case 'histologie': return [{ name: 'Adénocarcinome', value: 65 }, { name: 'Squameux', value: 25 }, { name: 'Autres', value: 10 }];
    default: return [{ name: 'A', value: 10 }, { name: 'B', value: 20 }];
  }
};

export default function Statistiques() {
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('oncotrack_advanced_stats_v2');
    return saved ? JSON.parse(saved) : [
      { id: 'w1', title: 'Incidence par Wilaya', type: 'bar-v', source: 'wilaya', size: 'M', color: '#0ea5e9', xAxis: 'Wilayas', yAxis: 'Nb Cas', showLegend: true, orientation: 'vertical', dataLabels: true, data: getMockData('wilaya') },
      { id: 'w2', title: 'Répartition Sexe', type: 'donut', source: 'sexe', size: 'M', color: '#6366f1', xAxis: 'Genre', yAxis: 'Effectif', showLegend: true, orientation: 'vertical', dataLabels: true, data: getMockData('sexe') }
    ];
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tempConfig, setTempConfig] = useState(null);

  useEffect(() => {
    localStorage.setItem('oncotrack_advanced_stats_v2', JSON.stringify(widgets));
  }, [widgets]);

  const handleCreateNew = () => {
    setTempConfig({
      id: Date.now().toString(),
      title: 'Mon nouveau graphique',
      type: 'bar-v',
      source: 'incidence',
      size: 'M',
      color: '#0ea5e9',
      xAxis: 'Catégories',
      yAxis: 'Valeurs',
      showLegend: true,
      orientation: 'vertical',
      dataLabels: true,
      data: getMockData('incidence')
    });
    setModalOpen(true);
  };

  const handleEdit = (w) => {
    setTempConfig({ ...w });
    setEditingId(w.id);
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

  const saveConfig = () => {
    setWidgets([...widgets, tempConfig]);
    setModalOpen(false);
  };

  const removeWidget = (id) => {
    if (window.confirm('Supprimer ce graphique ?')) {
      setWidgets(widgets.filter(w => w.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  return (
    <Layout title="">
      <div style={{ padding: '0 24px 40px', display: 'flex', gap: 20 }}>
        
        {/* MAIN AREA */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 30, marginTop: 10 }}>Analyses Statistiques Avancées</h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
            <KPICard label="TOTAL PATIENTS" value="58" trend="+5.2% vs 2024" color="white" />
            <KPICard label="NOUVEAUX CAS 2025" value="0" trend="Projection annuelle" color="white" />
            <KPICard label="TAUX SURVIE 5 ANS" value="68.4%" trend="+1.2pp vs 2024" color="white" />
            <KPICard label="TYPE DOMINANT" value="Solide" trend="Plus haute fréquence" color="white" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0, fontWeight: 600 }}>OncoTrack Data Intelligence — Éditeur dynamique de rapports cliniques</p>
            <button className="btn btn-primary" onClick={handleCreateNew} style={{ background: '#0f4c81', borderRadius: 8, padding: '12px 24px', fontWeight: 700, border: 'none' }}>
              + Ajouter un graphique
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 25 }}>
            {widgets.map(w => (
              <div key={w.id} style={{ flexBasis: w.size === 'S' ? 'calc(33.33% - 17px)' : w.size === 'M' ? 'calc(50% - 13px)' : '100%', flexGrow: 1 }}>
                <div className="card" style={{ padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{w.title}</h4>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleEdit(w)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>⚙️</button>
                      <button onClick={() => removeWidget(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#ef4444' }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ height: 350 }}>
                     <ChartEngine config={w} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INLINE EDIT SIDEBAR */}
        {editingId && (
          <div style={{ width: 380, height: 'calc(100vh - 100px)', padding: 30, background: 'white', borderRadius: 24, border: '1px solid #f1f5f9', position: 'sticky', top: 80, overflowY: 'auto', boxShadow: '-10px 0 30px rgba(0,0,0,0.03)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Éditeur de Graphique</h3>
                <button onClick={() => setEditingId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
             </div>
             <EditorUI config={tempConfig} update={syncUpdate} isInline={true} />
             <div style={{ marginTop: 30, display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => toast.success('Exportation PNG...')}>Exporter PNG</button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => toast.success('Génération PDF...')}>Exporter PDF</button>
             </div>
          </div>
        )}

      </div>

      {/* CREATE MODAL */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ width: '950px', maxWidth: '95%', backgroundColor: 'white', borderRadius: 24, display: 'flex', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ flex: 1, padding: 40, borderRight: '1px solid #f1f5f9', overflowY: 'auto', maxHeight: '90vh' }}>
                 <h3 style={{ marginBottom: 30, fontSize: 18, fontWeight: 800 }}>Nouveau Graphique</h3>
                 <EditorUI config={tempConfig} update={syncUpdate} />
                 <div style={{ marginTop: 30, display: 'flex', gap: 12 }}>
                    <button onClick={saveConfig} className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 10, fontWeight: 700 }}>Ajouter au Dashboard</button>
                    <button onClick={() => setModalOpen(false)} style={{ flex: 1, border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: 700, borderRadius: 10 }}>Annuler</button>
                 </div>
              </div>
              <div style={{ flex: 1, padding: 40, backgroundColor: '#fcfdfe', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ marginBottom: 20, fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Aperçu en temps réel</div>
                 <div style={{ background: 'white', borderRadius: 20, padding: 30, border: '1px solid #f1f5f9', flex: 1 }}>
                    <ChartEngine config={tempConfig} />
                 </div>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
}

function EditorUI({ config, update, isInline }) {
  if (!config) return null;

  const handleDataCellChange = (idx, field, val) => {
    const newData = [...config.data];
    newData[idx][field] = field === 'value' ? Number(val) : val;
    update({ data: newData });
  };

  const addRow = () => update({ data: [...config.data, { name: 'Label', value: 0 }] });
  const delRow = (i) => update({ data: config.data.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div className="form-group">
        <label className="form-label" style={{ fontWeight: 800 }}>Titre du graphique</label>
        <input className="form-control" value={config.title} onChange={e => update({ title: e.target.value })} style={{ borderRadius: 8, height: 44 }} />
      </div>

      {/* Chart Type & Size */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 800 }}>Type de graphique</label>
          <select className="form-control" value={config.type} onChange={e => update({ type: e.target.value })} style={{ borderRadius: 8, height: 44 }}>
            {CHART_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        {!isInline && (
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 800 }}>Taille</label>
            <select className="form-control" value={config.size} onChange={e => update({ size: e.target.value })} style={{ borderRadius: 8, height: 44 }}>
              <option value="S">Small (1/3)</option>
              <option value="M">Medium (1/2)</option>
              <option value="G">Grand (1/1)</option>
            </select>
          </div>
        )}
      </div>

      {/* Source */}
      <div className="form-group">
        <label className="form-label" style={{ fontWeight: 800 }}>Source de données</label>
        <select className="form-control" value={config.source} onChange={e => update({ source: e.target.value })} style={{ borderRadius: 8, height: 44 }}>
          {DATA_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Axes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 800 }}>Axe X</label>
          <input className="form-control" value={config.xAxis} onChange={e => update({ xAxis: e.target.value })} style={{ borderRadius: 8, height: 44 }} />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 800 }}>Axe Y</label>
          <input className="form-control" value={config.yAxis} onChange={e => update({ yAxis: e.target.value })} style={{ borderRadius: 8, height: 44 }} />
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={config.showLegend} onChange={e => update({ showLegend: e.target.checked })} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Légende</span>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={config.dataLabels} onChange={e => update({ dataLabels: e.target.checked })} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Valeurs ON</span>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={config.color} onChange={e => update({ color: e.target.value })} style={{ border:'none', width:30, height:24, padding:0 }} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Couleur</span>
         </div>
      </div>

      {/* Data Table */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
           <label style={{ fontSize: 13, fontWeight: 800, color:'#64748b' }}>Tableau de données</label>
           <button onClick={addRow} style={{ padding:'2px 8px', fontSize:11, borderRadius:4, background:'#f1f5f9', border:'1px solid #e2e8f0' }}>+ Ajouter ligne</button>
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr><th style={{ padding: 8, textAlign: 'left' }}>Libellé</th><th style={{ padding: 8, textAlign: 'right' }}>Valeur</th><th style={{ width: 40 }}></th></tr>
            </thead>
            <tbody>
              {config.data.map((d, i) => (
                <tr key={i}>
                  <td><input style={{ width: '100%', border: 'none', padding: 6 }} value={d.name} onChange={e => handleDataCellChange(i, 'name', e.target.value)} /></td>
                  <td><input type="number" style={{ width: '100%', border: 'none', padding: 6, textAlign: 'right' }} value={d.value} onChange={e => handleDataCellChange(i, 'value', e.target.value)} /></td>
                  <td style={{ textAlign: 'center' }}><button onClick={() => delRow(i)} style={{ border: 'none', background: 'none', color: '#ef4444' }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartEngine({ config }) {
  const { type, data, color, showLegend, xAxis, yAxis } = config;
  const colors = PALETTES.modern;

  const CommonProps = {
    data: data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
      case 'donut':
        return (
          <PieChart>
            <Pie data={data} innerRadius={type === 'donut' ? 60 : 0} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={i === 0 ? color : colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 15, border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
            {showLegend && <Legend verticalAlign="bottom" height={36}/>}
          </PieChart>
        );

      case 'line':
      case 'kaplan':
        return (
          <LineChart {...CommonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} />
            <Tooltip contentStyle={{ borderRadius: 15, border: 'none' }} />
            <Line type={type === 'kaplan' ? 'stepAfter' : 'monotone'} dataKey="value" stroke={color} strokeWidth={4} dot={{ r: 5, fill: '#fff', stroke: color, strokeWidth: 3 }} activeDot={{ r: 7 }} />
          </LineChart>
        );

      case 'radar':
        return (
          <RadarChart outerRadius={90} data={data}>
            <PolarGrid stroke="#eef2f6" />
            <PolarAngleAxis dataKey="name" style={{ fontSize: 10, fontWeight: 700 }} />
            <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.6} />
            <Tooltip contentStyle={{ borderRadius: 15 }} />
          </RadarChart>
        );

      case 'scatter':
      case 'bubble':
        return (
          <ScatterChart {...CommonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="value" hide />
            <YAxis dataKey="value" hide />
            <ZAxis dataKey="value" range={[50, 400]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Cas" data={data} fill={color}>
               {data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
            </Scatter>
          </ScatterChart>
        );

      case 'pyramid':
        const pyrData = data.map(d => ({ ...d, f: d.value, h: -d.value * 0.8 }));
        return (
          <BarChart data={pyrData} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} />
            <Tooltip />
            <Bar dataKey="f" fill={color} radius={[0, 4, 4, 0]} />
            <Bar dataKey="h" fill="#ec4899" radius={[4, 0, 0, 4]} />
          </BarChart>
        );

      case 'bar-stacked':
      case 'bar-grouped':
        return (
          <BarChart {...CommonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill={color} stackId={type === 'bar-stacked' ? 'a' : undefined} radius={[5, 5, 0, 0]} />
            <Bar dataKey="extra" fill={colors[1]} stackId={type === 'bar-stacked' ? 'a' : undefined} radius={[5, 5, 0, 0]} />
          </BarChart>
        );

      default: 
        return (
          <BarChart data={data} layout={type === 'bar-h' ? 'vertical' : 'horizontal'}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={type === 'bar-h' ? 'value' : 'name'} type={type === 'bar-h' ? 'number' : 'category'} axisLine={false} tickLine={false} style={{ fontSize: 11 }} hide={type === 'bar-h'} />
            <YAxis dataKey={type === 'bar-h' ? 'name' : 'value'} type={type === 'bar-h' ? 'category' : 'number'} axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 700 }} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="value" fill={color} radius={type === 'bar-h' ? [0, 5, 5, 0] : [5, 5, 0, 0]} barSize={type === 'bar-h' ? 12 : 35} />
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

function KPICard({ label, value, trend }) {
  return (
    <div className="card" style={{ padding: '32px', borderRadius: 24, border: '1px solid #f1f5f9', background: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.015)' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 44, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 800 }}>{trend}</div>
    </div>
  );
}
