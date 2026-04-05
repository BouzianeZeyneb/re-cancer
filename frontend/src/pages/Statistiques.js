import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend
);

const PRIMARY_COLOR = '#0f4c81'; // Medical Indigo
const SECONDARY_COLOR = '#64748b'; // Slate
const DANGER_COLOR = '#e63946'; // Crimson
const SUCCESS_COLOR = '#10b981'; // Emerald

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { family: 'Sora', size: 12 }, padding: 20 } },
    tooltip: { backgroundColor: '#0f172a', padding: 12, cornerRadius: 8 }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Sora', size: 12 } } },
    y: { grid: { color: '#f1f5f9' }, beginAtZero: true, ticks: { font: { family: 'Sora', size: 12 } } }
  }
};

const CHART_OPTIONS_H = {
  ...CHART_OPTIONS,
  indexAxis: 'y'
};

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

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

  if (loading) return <Layout title="Statistiques"><div className="loading-center"><div className="spinner" /></div></Layout>;

  // Data helpers
  const totaux = stats?.totaux || {};
  
  // Demographics datasets
  const dataSexe = {
    labels: ['Hommes', 'Femmes'],
    datasets: [{
      data: [stats?.parSexe?.find(s=>s.sexe==='M')?.total||0, stats?.parSexe?.find(s=>s.sexe==='F')?.total||0],
      backgroundColor: [PRIMARY_COLOR, DANGER_COLOR],
      borderWidth: 0
    }]
  };

  const dataWilaya = {
    labels: stats?.parWilaya?.slice(0, 15).map(w => w.wilaya) || [],
    datasets: [{
      label: 'Nombre de cas',
      data: stats?.parWilaya?.slice(0, 15).map(w => w.total) || [],
      backgroundColor: PRIMARY_COLOR + 'CC',
      borderRadius: 4
    }]
  };

  const dataAge = {
    labels: ['0-20', '21-40', '41-60', '61-80', '80+'],
    datasets: [{
      label: 'Cas par tranche d’âge',
      data: (() => {
        const d = stats?.parAge || [];
        return [
          d.filter(a=>a.age<=20).reduce((s,a)=>s+(a.total||0),0),
          d.filter(a=>a.age>20&&a.age<=40).reduce((s,a)=>s+(a.total||0),0),
          d.filter(a=>a.age>40&&a.age<=60).reduce((s,a)=>s+(a.total||0),0),
          d.filter(a=>a.age>60&&a.age<=80).reduce((s,a)=>s+(a.total||0),0),
          d.filter(a=>a.age>80).reduce((s,a)=>s+(a.total||0),0)
        ];
      })(),
      backgroundColor: SECONDARY_COLOR + 'CC',
      borderRadius: 4
    }]
  };

  // Clinical Profile datasets
  const dataTypes = {
    labels: stats?.parType?.map(t => t.sous_type || t.type_cancer) || [],
    datasets: [{
      label: 'Incidence',
      data: stats?.parType?.map(t => t.total) || [],
      backgroundColor: [PRIMARY_COLOR, DANGER_COLOR, SUCCESS_COLOR, '#f59e0b', '#7c3aed', '#06b6d4'],
      borderRadius: 4
    }]
  };

  const dataStades = {
    labels: stats?.parStade?.map(s => s.stade) || [],
    datasets: [{
      data: stats?.parStade?.map(s => s.total) || [],
      backgroundColor: [SUCCESS_COLOR, '#f59e0b', DANGER_COLOR, '#374151'],
      borderWidth: 0
    }]
  };

  // Trends
  const dataEvolution = {
    labels: stats?.evolution?.map(e => e.mois || e.annee) || [],
    datasets: [{
      label: 'Diagnostics enregistrés',
      data: stats?.evolution?.map(e => e.total) || [],
      borderColor: PRIMARY_COLOR,
      backgroundColor: PRIMARY_COLOR + '11',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: PRIMARY_COLOR
    }]
  };

  return (
    <Layout title="Rapport Statistique Épidémiologique">
      {/* Header Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, borderBottom: '2px solid #f1f5f9', paddingBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: PRIMARY_COLOR }}>Registre National du Cancer</h2>
          <p style={{ margin: '4px 0 0', color: SECONDARY_COLOR, fontSize: 13 }}>Analyse des données cliniques pour la période : <strong style={{color:'#0f172a'}}>{filterYear || 'Toutes les années'} {filterMonth && ` - ${new Date(0, filterMonth-1).toLocaleString('fr-FR', { month: 'long' })}`}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-control" style={{ width: 140, height: 42, fontSize: 14 }} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">Années</option>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-control" style={{ width: 160, height: 42, fontSize: 14 }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">Tous les mois</option>
            {Array.from({length:12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}</option>)}
          </select>
          {(filterYear || filterMonth) && (
            <button onClick={() => {setFilterYear(''); setFilterMonth('');}} style={{ height: 42, padding: '0 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, color: DANGER_COLOR, fontWeight: 700, cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>

      {/* KPI Section */}
      <div className="stat-grid" style={{ marginBottom: 48 }}>
        <StatCard label="Total Patients" value={totaux.patients} color="blue" />
        <StatCard label="Cas Diagnostiqués" value={totaux.cas} color="purple" />
        <StatCard label="Taux de Survie (Est.)" value="82%" color="green" />
        <StatCard label="Wilaya Majoritaire" value={stats?.parWilaya?.[0]?.wilaya || 'N/A'} color="orange" isText />
      </div>

      {/* SECTION 1: POPULATION */}
      <ReportSection title="I. Profil Démographique & Géographique">
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 32, marginBottom: 32 }}>
          <ChartCard title="Répartition par Sexe">
            <div style={{ height: 400 }}><Doughnut data={dataSexe} options={CHART_OPTIONS} /></div>
          </ChartCard>
          <ChartCard title="Incidence par Wilaya (Top 15)">
            <div style={{ height: 400 }}><Bar data={dataWilaya} options={CHART_OPTIONS_H} /></div>
          </ChartCard>
        </div>
        <ChartCard title="Distribution par Tranches d'Âge">
          <div style={{ height: 450 }}><Bar data={dataAge} options={CHART_OPTIONS} /></div>
        </ChartCard>
      </ReportSection>

      {/* SECTION 2: CLINIQUE */}
      <ReportSection title="II. Profil Oncologique & Clinique">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
          <ChartCard title="Incidence par Type de Pathologie">
            <div style={{ height: 450 }}><Bar data={dataTypes} options={CHART_OPTIONS} /></div>
          </ChartCard>
          <ChartCard title="Distribution selon le Stade Tumorale">
            <div style={{ height: 450 }}><Pie data={dataStades} options={CHART_OPTIONS} /></div>
          </ChartCard>
        </div>
      </ReportSection>

      {/* SECTION 3: TENDANCES */}
      <ReportSection title="III. Évolution Temporelle des Diagnostics">
        <ChartCard title="Nombre mensuel de diagnostics enregistrés">
          <div style={{ height: 500 }}><Line data={dataEvolution} options={CHART_OPTIONS} /></div>
        </ChartCard>
      </ReportSection>

      {/* Footer / Report Signature */}
      <div style={{ marginTop: 60, padding: '32px 0', borderTop: '2px dashed #e2e8f0', color: SECONDARY_COLOR, textAlign: 'center', fontSize: 13 }}>
        <p>© 2026 Plateforme de Registre du Cancer - Données basées sur les dossiers validés.</p>
        <p>Généré automatiquement le : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
      </div>

      <style>{`
        .loading-center { display: flex; justify-content: center; align-items: center; height: 100vh; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid ${PRIMARY_COLOR}; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}

function ReportSection({ title, children }) {
  return (
    <div style={{ marginBottom: 60 }}>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 8, height: 24, background: PRIMARY_COLOR, borderRadius: 4 }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: 'white', padding: '24px 32px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <h4 style={{ margin: '0 0 20px 0', fontSize: 14, fontWeight: 700, color: SECONDARY_COLOR, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h4>
      {children}
    </div>
  );
}

function StatCard({ label, value, color, isText }) {
  const colors = {
    blue: { bg: '#eff6ff', font: '#0f4c81' },
    purple: { bg: '#faf5ff', font: '#7c3aed' },
    green: { bg: '#ecfdf5', font: '#059669' },
    orange: { bg: '#fff7ed', font: '#ea580c' }
  };
  const c = colors[color] || colors.blue;
  
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.font}22`, padding: '24px', borderRadius: 16 }}>
      <div style={{ fontSize: isText ? 24 : 32, fontWeight: 900, color: c.font, lineHeight: 1 }}>
        {isText ? value : (value || 0).toLocaleString()}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: SECONDARY_COLOR, marginTop: 8 }}>{label}</div>
    </div>
  );
}
