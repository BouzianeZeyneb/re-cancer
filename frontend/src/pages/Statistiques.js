import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const PALETTE = ['#0f4c81','#22c55e','#e63946','#f59e0b','#7c3aed','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1'];

const DATA_SOURCES = [
  { id: 'cas_region',     label: 'Cas par région',          type: 'bar' },
  { id: 'sexe',           label: 'Répartition par sexe',    type: 'doughnut' },
  { id: 'type_cancer',    label: 'Types de cancer',         type: 'bar' },
  { id: 'stade',          label: 'Répartition par stade',   type: 'doughnut' },
  { id: 'statut',         label: 'Statut des patients',     type: 'doughnut' },
  { id: 'evolution',      label: 'Évolution temporelle',    type: 'line' },
  { id: 'age',            label: 'Tranches d\'âge',         type: 'bar' },
  { id: 'fumeur',         label: 'Facteurs de risque',      type: 'doughnut' },
];

const CHART_TYPES = ['Histogramme','Barres horizontales','Camembert','Donut','Courbe'];
const CHART_MAP   = { 'Histogramme': 'bar', 'Barres horizontales': 'bar', 'Camembert': 'pie', 'Donut': 'doughnut', 'Courbe': 'line' };

function buildDataset(sourceId, stats, palette) {
  if (!stats) return null;
  switch(sourceId) {
    case 'cas_region': {
      const d = stats.parWilaya?.slice(0,10) || [];
      return { labels: d.map(w => w.wilaya||'Inconnue'), datasets: [{ label:'Nombre de cas', data: d.map(w=>w.total||0), backgroundColor: palette[0], borderRadius:6 }] };
    }
    case 'sexe': {
      const h = stats.parSexe?.find(s=>s.sexe==='M')?.total||0;
      const f = stats.parSexe?.find(s=>s.sexe==='F')?.total||0;
      return { labels:['Hommes','Femmes'], datasets:[{ data:[h,f], backgroundColor:[palette[0],palette[1]], borderWidth:2 }] };
    }
    case 'type_cancer': {
      const d = stats.parType?.slice(0,8)||[];
      return { labels: d.map(t=>t.sous_type||t.type_cancer||'N/A'), datasets:[{ label:'Cas', data:d.map(t=>t.total||0), backgroundColor:palette, borderRadius:6 }] };
    }
    case 'stade': {
      const d = stats.parStade||[];
      return { labels:d.map(s=>s.stade||'N/A'), datasets:[{ data:d.map(s=>s.total||0), backgroundColor:palette, borderWidth:2 }] };
    }
    case 'statut': {
      const en = stats.totaux?.enTraitement||0, gu = stats.totaux?.gueris||0, dc = stats.totaux?.deces||0;
      return { labels:['En traitement','Guéris','Décédés'], datasets:[{ data:[en,gu,dc], backgroundColor:[palette[0],palette[1],palette[2]], borderWidth:2 }] };
    }
    case 'evolution': {
      const d = stats.evolution||[];
      return { labels:d.map(e=>e.mois||e.annee||''), datasets:[{ label:'Nouveaux cas', data:d.map(e=>e.total||0), borderColor:palette[0], backgroundColor:palette[0]+'22', tension:0.4, fill:true }] };
    }
    case 'age': {
      const tranches = [
        {label:'0-20', min:0, max:20},{label:'21-40',min:21,max:40},
        {label:'41-60',min:41,max:60},{label:'61-80',min:61,max:80},{label:'80+',min:81,max:200}
      ];
      const d = stats.parAge||[];
      const counts = tranches.map(t => d.filter(a=>a.age>=t.min&&a.age<=t.max).reduce((s,a)=>s+(a.total||0),0));
      return { labels:tranches.map(t=>t.label), datasets:[{ label:'Patients', data:counts, backgroundColor:palette, borderRadius:6 }] };
    }
    case 'fumeur': {
      const f = stats.facteurs?.fumeurs||0, nf = stats.facteurs?.nonFumeurs||0;
      return { labels:['Fumeurs','Non fumeurs'], datasets:[{ data:[f,nf], backgroundColor:[palette[2],palette[1]], borderWidth:2 }] };
    }
    default: return null;
  }
}

function ChartWidget({ widget, stats, onDelete, onConfigure }) {
  const [configOpen, setConfigOpen] = useState(false);
  const [localType, setLocalType] = useState(widget.chartType);
  const [localSource, setLocalSource] = useState(widget.source);

  const src = DATA_SOURCES.find(d => d.id === localSource);
  const dataset = buildDataset(localSource, stats, PALETTE);

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Sora', size: 11 }, padding: 12 } } },
    scales: ['bar','line'].includes(CHART_MAP[localType]) ? {
      x: { grid: { display: false }, ticks: { font: { family: 'Sora', size: 11 }, maxRotation: 30 } },
      y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
    } : undefined,
    ...(localType === 'Barres horizontales' ? { indexAxis: 'y' } : {})
  };

  const renderChart = () => {
    if (!dataset) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:13 }}>Aucune donnée</div>;
    const t = CHART_MAP[localType];
    const h = { height: '100%' };
    if (t === 'pie') return <Pie data={dataset} options={opts} style={h}/>;
    if (t === 'doughnut') return <Doughnut data={dataset} options={opts} style={h}/>;
    if (t === 'line') return <Line data={dataset} options={opts} style={h}/>;
    return <Bar data={dataset} options={opts} style={h}/>;
  };

  return (
    <div style={{ background:'white', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>
          {src?.label || 'Graphique'}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => setConfigOpen(!configOpen)} style={{ background: configOpen?'#eff6ff':'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:13, color: configOpen?'#0f4c81':'#64748b' }}>⚙️</button>
          <button onClick={() => onDelete(widget.id)} style={{ background:'#fff5f5', border:'1px solid #fecaca', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontSize:13, color:'#e63946' }}>🗑</button>
        </div>
      </div>

      {/* Config panel */}
      {configOpen && (
        <div style={{ padding:'12px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:4 }}>Type de graphique</div>
            <select style={{ fontSize:13, padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, fontFamily:'Sora' }}
              value={localType} onChange={e => { setLocalType(e.target.value); onConfigure(widget.id, {chartType: e.target.value}); }}>
              {CHART_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:4 }}>Source de données</div>
            <select style={{ fontSize:13, padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, fontFamily:'Sora' }}
              value={localSource} onChange={e => { setLocalSource(e.target.value); onConfigure(widget.id, {source: e.target.value}); }}>
              {DATA_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ padding:16, height:260 }}>
        {renderChart()}
      </div>
    </div>
  );
}

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date Filters
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const [widgets, setWidgets] = useState([
    { id:1, source:'cas_region',  chartType:'Histogramme' },
    { id:2, source:'sexe',        chartType:'Donut' },
    { id:3, source:'type_cancer', chartType:'Histogramme' },
    { id:4, source:'stade',       chartType:'Camembert' },
    { id:5, source:'statut',      chartType:'Donut' },
    { id:6, source:'evolution',   chartType:'Courbe' },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    const params = {};
    if (filterYear) params.year = filterYear;
    if (filterMonth) params.month = filterMonth;
    getDashboardStats(params).then(r => setStats(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, [filterYear, filterMonth]);

  const addWidget = (sourceId) => {
    const src = DATA_SOURCES.find(d => d.id === sourceId);
    setWidgets(p => [...p, { id: Date.now(), source: sourceId, chartType: src?.type==='doughnut'?'Donut':src?.type==='line'?'Courbe':'Histogramme' }]);
    setShowAddMenu(false);
  };

  const deleteWidget = (wid) => setWidgets(p => p.filter(w => w.id !== wid));
  const configureWidget = (wid, changes) => setWidgets(p => p.map(w => w.id===wid ? {...w,...changes} : w));

  if (loading) return <Layout title="Statistiques"><div className="loading-center"><div className="spinner"/></div></Layout>;

  return (
    <Layout title="Statistiques Épidémiologiques">
      {/* KPI */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Patients', value: stats?.totaux?.patients||0, color:'blue' },
          { label:'Cas diagnostiqués', value: stats?.totaux?.cas||0, color:'purple' },
          { label:'En traitement', value: stats?.totaux?.enTraitement||0, color:'orange' },
          { label:'Guérisons', value: stats?.totaux?.gueris||0, color:'green' },
          { label:'Décès', value: stats?.totaux?.decedes||0, color:'red' },
        ].map(k => (
          <div key={k.label} className={`stat-card ${k.color}`}>
            <div className="stat-value">{k.value}</div>
            <div className="stat-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar & Filters */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, background:'white', padding:'8px 16px', borderRadius:12, border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>Période :</div>
          <select 
            className="form-control" 
            style={{ width: 120, height: 36, fontSize: 13 }} 
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">Toutes les années</option>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            className="form-control" 
            style={{ width: 150, height: 36, fontSize: 13 }} 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">Tous les mois</option>
            {Array.from({length:12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#64748b' }}>
            {widgets.length} graphique{widgets.length>1?'s':''} actif{widgets.length>1?'s':''}
          </div>
        <div style={{ position:'relative' }}>
          <button className="btn btn-primary" onClick={() => setShowAddMenu(!showAddMenu)}>
            + Ajouter un graphique
          </button>
          {showAddMenu && (
            <div style={{ position:'absolute', right:0, top:'110%', background:'white', border:'1px solid #e2e8f0', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, minWidth:220, overflow:'hidden' }}>
              {DATA_SOURCES.map(s => (
                <button key={s.id} onClick={() => addWidget(s.id)} style={{ display:'block', width:'100%', padding:'10px 16px', border:'none', background:'transparent', textAlign:'left', cursor:'pointer', fontSize:13, fontFamily:'Sora', color:'#0f172a', borderBottom:'1px solid #f1f5f9' }}
                  onMouseEnter={e => e.target.style.background='#f8fafc'} onMouseLeave={e => e.target.style.background='transparent'}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {widgets.map(w => (
          <ChartWidget key={w.id} widget={w} stats={stats} onDelete={deleteWidget} onConfigure={configureWidget} />
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="empty-state" style={{ marginTop:40 }}>
          <div style={{fontSize:48}}>📊</div>
          <h3>Aucun graphique</h3>
          <p>Cliquez sur "+ Ajouter un graphique" pour commencer</p>
        </div>
      )}
    </Layout>
  );
}
