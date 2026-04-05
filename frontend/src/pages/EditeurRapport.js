import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, zoomPlugin);

const WIDGET_TYPES = [
  { id: 'kpi_patients', label: '👥 Total Patients', type: 'kpi', color: 'blue' },
  { id: 'kpi_cas', label: '🔬 Total Cas Cancer', type: 'kpi', color: 'purple' },
  { id: 'kpi_traitement', label: '💊 En Traitement', type: 'kpi', color: 'orange' },
  { id: 'kpi_gueris', label: '✅ Guéris', type: 'kpi', color: 'green' },
  { id: 'kpi_decedes', label: '⚠️ Décédés', type: 'kpi', color: 'red' },
  { id: 'kpi_taux', label: '📊 Taux Guérison', type: 'kpi', color: 'gray' },
  { id: 'chart_type', label: '🔬 Graphique Type Cancer', type: 'chart', chartType: 'doughnut' },
  { id: 'chart_sexe', label: '⚧ Graphique Sexe', type: 'chart', chartType: 'pie' },
  { id: 'chart_age', label: '📊 Graphique Âge', type: 'chart', chartType: 'bar' },
  { id: 'chart_mois', label: '📈 Évolution Mensuelle', type: 'chart', chartType: 'line' },
  { id: 'chart_wilaya', label: '📍 Top Wilayas', type: 'chart', chartType: 'bar' },
  { id: 'chart_soustype', label: '🏥 Top Sous-types', type: 'chart', chartType: 'bar' },
  { id: 'chart_etat', label: '🎯 État du Cancer', type: 'chart', chartType: 'doughnut' },
  { id: 'table_recent', label: '📋 Tableau Récapitulatif', type: 'table' },
  { id: 'text_title', label: '✏️ Titre / Texte', type: 'text' },
];

const COLORS = ['#0f4c81', '#e63946', '#7c3aed', '#2d6a4f', '#d4a017', '#1a6bb5', '#40916c', '#f4a261'];

export default function EditeurRapport() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState([]);
  const [reportTitle, setReportTitle] = useState('Mon Rapport Personnalisé');
  const [editMode, setEditMode] = useState(true);
  const [dragOver, setDragOver] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).finally(() => setLoading(false));
    const saved = localStorage.getItem('saved_reports');
    if (saved) setSavedReports(JSON.parse(saved));
  }, []);

  const addWidget = (widgetType) => {
    const newWidget = {
      ...widgetType,
      instanceId: `${widgetType.id}_${Date.now()}`,
      size: widgetType.type === 'kpi' ? 'small' : widgetType.type === 'text' ? 'small' : 'medium',
      textContent: widgetType.type === 'text' ? 'Cliquez pour modifier ce texte...' : '',
      chartDisplayType: widgetType.chartType || 'bar',
    };
    setWidgets(prev => [...prev, newWidget]);
  };

  const removeWidget = (instanceId) => {
    setWidgets(prev => prev.filter(w => w.instanceId !== instanceId));
  };

  const moveWidget = (fromIdx, toIdx) => {
    setWidgets(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };

  const changeSize = (instanceId, size) => {
    setWidgets(prev => prev.map(w => w.instanceId === instanceId ? { ...w, size } : w));
  };

  const changeChartType = (instanceId, chartDisplayType) => {
    setWidgets(prev => prev.map(w => w.instanceId === instanceId ? { ...w, chartDisplayType } : w));
  };

  const saveReport = () => {
    const report = { id: Date.now(), title: reportTitle, widgets, createdAt: new Date().toISOString() };
    const updated = [...savedReports.filter(r => r.title !== reportTitle), report];
    setSavedReports(updated);
    localStorage.setItem('saved_reports', JSON.stringify(updated));
    toast.success('Rapport sauvegardé!');
  };

  const loadReport = (report) => {
    setReportTitle(report.title);
    setWidgets(report.widgets);
    setShowSaved(false);
    toast.success('Rapport chargé!');
  };

  const deleteReport = (id) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem('saved_reports', JSON.stringify(updated));
  };

  const printReport = () => {
    setEditMode(false);
    setTimeout(() => window.print(), 300);
  };

  const getKpiValue = (id) => {
    if (!stats) return 0;
    const t = stats.totaux || {};
    const map = {
      kpi_patients: t.patients || 0,
      kpi_cas: t.cas || 0,
      kpi_traitement: t.enTraitement || 0,
      kpi_gueris: t.gueris || 0,
      kpi_decedes: t.decedes || 0,
      kpi_taux: t.cas ? `${((t.gueris / t.cas) * 100).toFixed(1)}%` : '0%',
    };
    return map[id] || 0;
  };

  const getChartData = (id) => {
    if (!stats) return null;
    const opts = { 
      responsive: true, 
      plugins: { 
        legend: { position: 'bottom', labels: { font: { family: 'Sora', size: 11 } } },
        zoom: {
          pan: { enabled: true, mode: 'x' },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          }
        }
      } 
    };
    const barOpts = { ...opts, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' } } } };

    switch (id) {
      case 'chart_type':
        return { data: { labels: stats.parType?.map(d => d.type_cancer), datasets: [{ data: stats.parType?.map(d => d.count), backgroundColor: COLORS, borderWidth: 0 }] }, opts };
      case 'chart_sexe':
        return { data: { labels: stats.parSexe?.map(d => d.sexe === 'M' ? '♂ Masculin' : '♀ Féminin'), datasets: [{ data: stats.parSexe?.map(d => d.count), backgroundColor: ['#0f4c81', '#e63946'], borderWidth: 0 }] }, opts };
      case 'chart_age':
        return { data: { labels: stats.parAge?.map(d => d.tranche_age), datasets: [{ label: 'Cas', data: stats.parAge?.map(d => d.count), backgroundColor: '#7c3aed', borderRadius: 6 }] }, opts: barOpts };
      case 'chart_mois':
        return { data: { labels: stats.parMois?.map(d => d.mois), datasets: [{ label: 'Nouveaux cas', data: stats.parMois?.map(d => d.count), borderColor: '#0f4c81', backgroundColor: 'rgba(15,76,129,0.1)', fill: true, tension: 0.4 }] }, opts: { ...barOpts, plugins: { legend: { display: false } } } };
      case 'chart_wilaya':
        return { data: { labels: stats.parWilaya?.slice(0, 8).map(d => d.wilaya), datasets: [{ label: 'Cas', data: stats.parWilaya?.slice(0, 8).map(d => d.count), backgroundColor: '#0f4c81', borderRadius: 6 }] }, opts: { ...barOpts, indexAxis: 'y' } };
      case 'chart_soustype':
        return { data: { labels: stats.parSousType?.slice(0, 6).map(d => d.label?.slice(0, 20) || 'N/A'), datasets: [{ label: 'Cas', data: stats.parSousType?.slice(0, 6).map(d => d.count), backgroundColor: '#e63946', borderRadius: 6 }] }, opts: { ...barOpts, indexAxis: 'y' } };
      case 'chart_etat':
        return { data: { labels: stats.parEtat?.map(d => d.etat), datasets: [{ data: stats.parEtat?.map(d => d.count), backgroundColor: ['#7c3aed', '#e63946'], borderWidth: 0 }] }, opts };
      default: return null;
    }
  };

  const renderChart = (widget) => {
    const cd = getChartData(widget.id);
    if (!cd || !cd.data?.labels?.length) return <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Aucune donnée</div>;
    const type = widget.chartDisplayType || 'bar';
    const props = { data: cd.data, options: cd.opts };
    if (type === 'bar') return <Bar {...props} />;
    if (type === 'line') return <Line {...props} />;
    if (type === 'pie') return <Pie {...props} />;
    if (type === 'doughnut') return <Doughnut {...props} />;
    return <Bar {...props} />;
  };

  const colorMap = { blue: '#0f4c81', purple: '#7c3aed', orange: '#f4a261', green: '#40916c', red: '#e63946', gray: '#64748b' };
  const bgMap = { blue: '#dbeafe', purple: '#ede9fe', orange: '#ffedd5', green: '#dcfce7', red: '#fee2e2', gray: '#f1f5f9' };

  const sizeStyle = {
    small: { width: 'calc(25% - 12px)', minWidth: 180 },
    medium: { width: 'calc(50% - 8px)', minWidth: 300 },
    large: { width: '100%' },
  };

  return (
    <Layout title="Éditeur de Rapports">
      <style>{`
        @media print {
          .sidebar, .topbar, .no-print { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .page { padding: 0 !important; }
          .print-area { padding: 20px; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-control"
          style={{ width: 280, fontWeight: 700, fontSize: 15 }}
          value={reportTitle}
          onChange={e => setReportTitle(e.target.value)}
          placeholder="Titre du rapport..."
        />
        <button className={`btn ${editMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setEditMode(true)}>
          ✏️ Éditer
        </button>
        <button className={`btn ${!editMode ? 'btn-primary' : 'btn-outline'}`} onClick={() => setEditMode(false)}>
          👁️ Aperçu
        </button>
        <button className="btn btn-success" onClick={saveReport}>💾 Sauvegarder</button>
        <button className="btn btn-outline" onClick={() => setShowSaved(!showSaved)}>📂 Mes Rapports ({savedReports.length})</button>
        <button className="btn btn-outline" onClick={printReport}>🖨️ Imprimer / PDF</button>
        {widgets.length > 0 && (
          <button className="btn btn-outline" style={{ color: '#e63946' }} onClick={() => { if (window.confirm('Vider le rapport?')) setWidgets([]); }}>
            🗑️ Vider
          </button>
        )}
      </div>

      {/* Saved reports */}
      {showSaved && (
        <div className="card no-print" style={{ marginBottom: 20 }}>
          <div className="card-header"><h2>📂 Rapports Sauvegardés</h2></div>
          <div className="card-body">
            {savedReports.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>Aucun rapport sauvegardé</div>
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {savedReports.map(r => (
                  <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.widgets.length} widgets · {new Date(r.createdAt).toLocaleDateString('fr-DZ')}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => loadReport(r)}>Charger</button>
                    <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', border: 'none' }} onClick={() => deleteReport(r.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Widgets panel */}
        {editMode && (
          <div className="no-print" style={{ width: 220, flexShrink: 0 }}>
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div className="card-header" style={{ padding: '14px 16px' }}>
                <h2 style={{ fontSize: 13 }}>➕ Ajouter Widget</h2>
              </div>
              <div style={{ padding: '8px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {['kpi', 'chart', 'table', 'text'].map(type => (
                  <div key={type}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 8px 4px' }}>
                      {type === 'kpi' ? 'KPI' : type === 'chart' ? 'Graphiques' : type === 'table' ? 'Tableaux' : 'Texte'}
                    </div>
                    {WIDGET_TYPES.filter(w => w.type === type).map(wt => (
                      <button key={wt.id} onClick={() => addWidget(wt)} style={{
                        display: 'block', width: '100%', padding: '8px 10px', textAlign: 'left',
                        border: '1px solid #e2e8f0', borderRadius: 7, background: 'white',
                        cursor: 'pointer', fontSize: 12.5, marginBottom: 4, transition: 'all 0.15s',
                        fontFamily: 'Sora, sans-serif'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f0f4f8'; e.currentTarget.style.borderColor = '#0f4c81'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      >
                        {wt.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Report canvas */}
        <div ref={printRef} className="print-area" style={{ flex: 1 }}>
          {/* Report header */}
          <div style={{ marginBottom: 24, borderBottom: '3px solid #0f4c81', paddingBottom: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{reportTitle}</h1>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              Généré le {new Date().toLocaleDateString('fr-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}Registre du Cancer — Plateforme Épidémiologique
            </div>
          </div>

          {widgets.length === 0 ? (
            <div style={{
              border: '2px dashed #cbd5e1', borderRadius: 16, padding: 60,
              textAlign: 'center', color: '#94a3b8', background: '#fafbfc'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Rapport vide</div>
              <div style={{ fontSize: 14 }}>Ajoutez des widgets depuis le panneau gauche</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
              {widgets.map((widget, idx) => (
                <div
                  key={widget.instanceId}
                  style={{
                    ...sizeStyle[widget.size],
                    background: 'white',
                    borderRadius: 12,
                    border: editMode ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    outline: dragOver === idx ? '2px dashed #0f4c81' : 'none',
                  }}
                  draggable={editMode}
                  onDragStart={e => e.dataTransfer.setData('widgetIdx', idx)}
                  onDragOver={e => { e.preventDefault(); setDragOver(idx); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('widgetIdx')); moveWidget(from, idx); setDragOver(null); }}
                >
                  {/* Widget toolbar */}
                  {editMode && (
                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', flex: 1 }}>⠿ {widget.label}</span>
                      
                      {/* Size buttons */}
                      <div style={{ display: 'flex', gap: 3 }}>
                        {['small', 'medium', 'large'].map(s => (
                          <button key={s} onClick={() => changeSize(widget.instanceId, s)} style={{
                            padding: '2px 7px', fontSize: 10, border: '1px solid #e2e8f0', borderRadius: 4,
                            background: widget.size === s ? '#0f4c81' : 'white',
                            color: widget.size === s ? 'white' : '#64748b',
                            cursor: 'pointer', fontFamily: 'Sora'
                          }}>
                            {s === 'small' ? 'S' : s === 'medium' ? 'M' : 'L'}
                          </button>
                        ))}
                      </div>

                      {/* Chart type switcher */}
                      {widget.type === 'chart' && (
                        <div style={{ display: 'flex', gap: 3 }}>
                          {['bar', 'line', 'pie', 'doughnut'].map(ct => (
                            <button key={ct} onClick={() => changeChartType(widget.instanceId, ct)} style={{
                              padding: '2px 7px', fontSize: 10, border: '1px solid #e2e8f0', borderRadius: 4,
                              background: widget.chartDisplayType === ct ? '#7c3aed' : 'white',
                              color: widget.chartDisplayType === ct ? 'white' : '#64748b',
                              cursor: 'pointer', fontFamily: 'Sora'
                            }}>
                              {ct === 'bar' ? '📊' : ct === 'line' ? '📈' : ct === 'pie' ? '🥧' : '🍩'}
                            </button>
                          ))}
                        </div>
                      )}

                      <button onClick={() => removeWidget(widget.instanceId)} style={{
                        padding: '2px 7px', fontSize: 11, border: '1px solid #fecaca', borderRadius: 4,
                        background: '#fee2e2', color: '#991b1b', cursor: 'pointer'
                      }}>✕</button>
                    </div>
                  )}

                  {/* Widget content */}
                  <div style={{ padding: widget.type === 'kpi' ? '20px' : '16px' }}>
                    {widget.type === 'kpi' && (
                      <div style={{ background: bgMap[widget.color] || '#f1f5f9', borderRadius: 10, padding: '20px 16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 32, opacity: 0.15 }}>
                          {widget.label.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: colorMap[widget.color], fontFamily: 'JetBrains Mono', marginBottom: 6 }}>
                          {loading ? '...' : getKpiValue(widget.id)}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colorMap[widget.color], opacity: 0.8 }}>
                          {widget.label.split(' ').slice(1).join(' ')}
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: colorMap[widget.color], opacity: 0.4, borderRadius: '0 0 10px 10px' }} />
                      </div>
                    )}

                    {widget.type === 'chart' && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#0f172a' }}>{widget.label}</div>
                        {loading ? <div className="loading-center"><div className="spinner" /></div> : renderChart(widget)}
                      </div>
                    )}

                    {widget.type === 'table' && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📋 Récapitulatif Général</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ background: '#f8fafc' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Indicateur</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Valeur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ['Total Patients', stats?.totaux?.patients || 0],
                              ['Total Cas de Cancer', stats?.totaux?.cas || 0],
                              ['En Traitement', stats?.totaux?.enTraitement || 0],
                              ['Guéris', stats?.totaux?.gueris || 0],
                              ['Décédés', stats?.totaux?.decedes || 0],
                              ['Nouveaux ce mois', stats?.totaux?.nouveauxMois || 0],
                              ['Taux de guérison', stats?.totaux?.cas ? `${((stats.totaux.gueris / stats.totaux.cas) * 100).toFixed(1)}%` : '0%'],
                            ].map(([label, val], i) => (
                              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{label}</td>
                                <td style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, textAlign: 'right', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {widget.type === 'text' && (
                      editingText === widget.instanceId ? (
                        <div>
                          <textarea
                            autoFocus
                            style={{ width: '100%', border: '1px solid #0f4c81', borderRadius: 8, padding: 10, fontFamily: 'Sora', fontSize: 14, resize: 'vertical', minHeight: 80, outline: 'none' }}
                            value={widget.textContent}
                            onChange={e => setWidgets(prev => prev.map(w => w.instanceId === widget.instanceId ? { ...w, textContent: e.target.value } : w))}
                            onBlur={() => setEditingText(null)}
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => editMode && setEditingText(widget.instanceId)}
                          style={{
                            fontSize: 14, color: '#0f172a', cursor: editMode ? 'text' : 'default',
                            padding: '8px', borderRadius: 8, border: editMode ? '1px dashed #cbd5e1' : 'none',
                            minHeight: 40, whiteSpace: 'pre-wrap', lineHeight: 1.7
                          }}
                        >
                          {widget.textContent || 'Cliquez pour modifier...'}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Print footer */}
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
            <span>Registre du Cancer — Plateforme Épidémiologique</span>
            <span>{new Date().toLocaleDateString('fr-DZ')}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
