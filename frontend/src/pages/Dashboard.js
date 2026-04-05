import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, zoomPlugin);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Tableau de Bord"><div className="loading-center"><div className="spinner" /></div></Layout>;

  const t = stats?.totaux || {};

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom', labels: { font: { family: 'Sora', size: 12 } } },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        }
      }
    },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' } } }
  };

  return (
    <Layout title="Tableau de Bord">
      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard color="blue" value={t.patients || 0} label="Total Patients" icon="👥" />
        <StatCard color="purple" value={t.nouveauxMois || 0} label="Nouveaux ce mois" icon="📅" />
        <StatCard color="orange" value={t.sousChimio || 0} label="Sous chimiothérapie" icon="💉" />
        <StatCard color="green" value={t.enSuivi || 0} label="Patients en suivi" icon="🩺" />
        <StatCard color="red" value={t.stadeIV || 0} label="Cas Stade IV" icon="⚠️" />
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to="/patients/nouveau" className="btn btn-primary">+ Nouveau Patient</Link>
        <Link to="/cas-cancer/nouveau" className="btn btn-outline">+ Nouveau Cas</Link>
      </div>

      {/* Alerts Section */}
      {stats?.alertes && (stats.alertes.wbc?.length > 0 || stats.alertes.rdvToday?.length > 0 || stats.alertes.retards?.length > 0) && (
        <div style={{ marginBottom: 24, padding: 20, background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 12 }}>
          <h3 style={{ color: '#c53030', display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Alertes Requérant Attention
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {stats.alertes.wbc?.length > 0 && (
              <div style={{ background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 600, color: '#e53e3e', marginBottom: 8, fontSize: 13, textTransform: 'uppercase' }}>🩸 Globules Blancs Faibles (Derniers jours)</div>
                {stats.alertes.wbc.map((a, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: i < stats.alertes.wbc.length-1 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                    <Link to={`/cas-cancer/${a.case_id}`} style={{ color: '#0f4c81', textDecoration: 'none', fontWeight: 500 }}>{a.prenom} {a.nom}</Link>
                    <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{a.valeur}</span>
                  </div>
                ))}
              </div>
            )}
            
            {stats.alertes.rdvToday?.length > 0 && (
              <div style={{ background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 600, color: '#3182ce', marginBottom: 8, fontSize: 13, textTransform: 'uppercase' }}>📅 Rendez-vous Aujourd'hui</div>
                {stats.alertes.rdvToday.map((a, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: i < stats.alertes.rdvToday.length-1 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                    <Link to={`/cas-cancer/${a.case_id}`} style={{ color: '#0f4c81', textDecoration: 'none', fontWeight: 500 }}>{a.prenom} {a.nom}</Link>
                    <span style={{ color: '#64748b' }}>{a.motif || 'Consultation'}</span>
                  </div>
                ))}
              </div>
            )}

            {stats.alertes.retards?.length > 0 && (
              <div style={{ background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 600, color: '#dd6b20', marginBottom: 8, fontSize: 13, textTransform: 'uppercase' }}>⏳ Retards Traitement (&gt;90j sans fin)</div>
                {stats.alertes.retards.map((a, i) => (
                  <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: i < stats.alertes.retards.length-1 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                    <Link to={`/cas-cancer/${a.case_id}`} style={{ color: '#0f4c81', textDecoration: 'none', fontWeight: 500 }}>{a.prenom} {a.nom}</Link>
                    <span style={{ color: '#64748b' }}>{a.date_debut?.slice(0,10)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        {stats?.parMois?.length > 0 && (
          <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">Évolution mensuelle des cas (12 derniers mois)</div>
            <Line data={{
              labels: stats.parMois.map(d => d.mois),
              datasets: [{
                label: 'Nouveaux cas',
                data: stats.parMois.map(d => d.count),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
              }]
            }} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
          </div>
        )}

        {stats?.parType?.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">Répartition par type de cancer</div>
            <Doughnut data={{
              labels: stats.parType.map(d => d.type_cancer),
              datasets: [{
                data: stats.parType.map(d => d.count),
                backgroundColor: ['#0f4c81', '#e63946'],
              }]
            }} options={{ plugins: { legend: { position: 'bottom' }, zoom: chartOptions.plugins.zoom } }} />
          </div>
        )}

        {stats?.parSexe?.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">Répartition par sexe</div>
            <Doughnut data={{
              labels: stats.parSexe.map(d => d.sexe === 'M' ? 'Masculin' : 'Féminin'),
              datasets: [{
                data: stats.parSexe.map(d => d.count),
                backgroundColor: ['#1a6bb5', '#e63946'],
              }]
            }} options={{ plugins: { legend: { position: 'bottom' }, zoom: chartOptions.plugins.zoom } }} />
          </div>
        )}

        {stats?.parAge?.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">Répartition par tranche d'âge</div>
            <Bar data={{
              labels: stats.parAge.map(d => d.tranche_age),
              datasets: [{
                label: 'Cas',
                data: stats.parAge.map(d => d.count),
                backgroundColor: '#0f4c81',
                borderRadius: 6
              }]
            }} options={chartOptions} />
          </div>
        )}

        {stats?.parSousType?.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">Top sous-types de cancer</div>
            <Bar data={{
              labels: stats.parSousType.map(d => d.label?.slice(0, 20) || 'N/A'),
              datasets: [{
                label: 'Cas',
                data: stats.parSousType.map(d => d.count),
                backgroundColor: '#e63946',
                borderRadius: 6
              }]
            }} options={{ ...chartOptions, indexAxis: 'y' }} />
          </div>
        )}

        {stats?.parWilaya?.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">Cas par wilaya (Top 10)</div>
            <Bar data={{
              labels: stats.parWilaya.slice(0, 10).map(d => d.wilaya),
              datasets: [{
                label: 'Cas',
                data: stats.parWilaya.slice(0, 10).map(d => d.count),
                backgroundColor: '#7c3aed',
                borderRadius: 6
              }]
            }} options={{ ...chartOptions, indexAxis: 'y' }} />
          </div>
        )}

        {stats?.parEtat?.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">Répartition par État (Localisé / Métastase)</div>
            <Doughnut data={{
              labels: stats.parEtat.map(d => d.etat),
              datasets: [{
                data: stats.parEtat.map(d => d.count),
                backgroundColor: ['#6366f1', '#f59e0b'],
              }]
            }} options={{ plugins: { legend: { position: 'bottom' }, zoom: chartOptions.plugins.zoom } }} />
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ color, value, label, icon }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-value">{value.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-icon" style={{ fontSize: 36, position: 'absolute', top: 12, right: 12, opacity: 0.15 }}>{icon}</div>
    </div>
  );
}
