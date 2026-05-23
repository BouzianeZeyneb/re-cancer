import React, { useState, useEffect, useCallback } from 'react';
import {
   PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Heart, Activity, Users, AlertTriangle, Search, Filter, RefreshCw, Calendar, MapPin, ChevronRight, BarChart3, Globe } from 'lucide-react';

const WILAYAS = [
   "01 Adrar", "02 Chlef", "03 Laghouat", "04 Oum El Bouaghi", "05 Batna", "06 Béjaïa", "07 Biskra", "08 Béchar", "09 Blida", "10 Bouira",
   "11 Tamanrasset", "12 Tébessa", "13 Tlemcen", "14 Tiaret", "15 Tizi Ouzou", "16 Alger", "17 Djelfa", "18 Jijel", "19 Sétif", "20 Saïda",
   "21 Skikda", "22 Sidi Bel Abbès", "23 Annaba", "24 Guelma", "25 Constantine", "26 Médéa", "27 Mostaganem", "28 M'Sila", "29 Mascara", "30 Ouargla",
   "31 Oran", "32 El Bayadh", "33 Illizi", "34 Bordj Bou Arreridj", "35 Boumerdès", "36 El Tarf", "37 Tindouf", "38 Tissemsilt", "39 El Oued", "40 Khenchela",
   "41 Souk Ahras", "42 Tipaza", "43 Mila", "44 Aïn Defla", "45 Naâma", "46 Aïn Témouchent", "47 Ghardaïa", "48 Relizane", "49 El M'Ghair", "50 El Meniaa",
   "51 Ouled Djellal", "52 Bordj Badji Mokhtar", "53 Béni Abbès", "54 Timimoun", "55 Touggourt", "56 Djanet", "57 In Salah", "58 In Guezzam"
];

const CANCER_TYPES = ["Sein", "Poumon", "Colorectal", "Prostate", "Estomac", "Foie", "Vessie", "Lymphome"];
const COLORS_SEXE = ['#3b82f6', '#ec4899'];
const COLORS_TYPE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

function PremiumKPICard({ icon: Icon, label, value, trend, color, bgGradient }) {
   return (
      <div style={{
         background: 'white', borderRadius: 32, padding: 32, border: '1.5px solid #f1f5f9',
         boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden',
         transition: 'all 0.3s ease'
      }}
         onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(0,0,0,0.05)'; }}
         onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.02)'; }}
      >
         <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: bgGradient, opacity: 0.05, borderRadius: '50%' }} />
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: bgGradient, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${color}30` }}>
               <Icon size={24} strokeWidth={2.5} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', background: '#f0fdf4', padding: '4px 10px', borderRadius: 8 }}>
               +12%
            </div>
         </div>
         <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>{label}</div>
         <div style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit', sans-serif", letterSpacing: '-1.5px' }}>{value}</div>
         <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 8 }}>{trend}</div>
      </div>
   );
}

// ── Tabler-style SVG icons for epidemio ──────────────────────────────────────
const TI = {
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>,
  chartLine: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20l4-7 4 4 5-9 5 6"/></svg>,
  activity: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  alertTri: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  clipCheck: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 14l2 2 4-4"/></svg>,
};

const relTime = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
};

// ── EPIDEMIO DASHBOARD ────────────────────────────────────────────────────────
function EpidemioDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/validations/stats').catch(() => ({ data: {} })),
      api.get('/validations').catch(() => ({ data: [] })),
      api.get('/validations/historique').catch(() => ({ data: [] })),
      getDashboardStats({}).catch(() => ({ data: { totaux: {} } })),
    ]).then(([s, q, h, d]) => {
      setStats(s.data);
      setQueue(q.data.slice(0, 5));
      setHistory(h.data.slice(0, 10));
      setDashStats(d.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const t = dashStats?.totaux || {};

  return (
    <Layout title="">
      <div style={{ padding: '0 20px 60px' }}>

        {/* HERO BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          borderRadius: 28, padding: '40px 48px', marginBottom: 32,
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, transparent 80%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 34, fontWeight: 900, color: 'white', margin: '0 0 10px', fontFamily: 'Outfit', letterSpacing: '-1px' }}>
                Tableau de bord epidemiologique
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: 0, fontWeight: 500, maxWidth: 500 }}>
                Surveillance et controle qualite du registre national du cancer
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '12px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 3, letterSpacing: '1px' }}>Synchronisation</div>
                <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} /> Temps Reel
                </div>
              </div>
              <button onClick={load} style={{ width: 48, height: 48, borderRadius: 14, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { icon: TI.users, label: 'Patients Totaux', value: t.patients || 0, color: '#3b82f6' },
            { icon: TI.chartLine, label: 'Incidence Mensuelle', value: t.nouveauxMois || 0, color: '#8b5cf6' },
            { icon: TI.activity, label: 'Cas Actifs', value: t.enTraitement || 0, color: '#10b981' },
            { icon: TI.alertTri, label: 'Stades Critiques', value: t.stadeIV || 0, color: '#ef4444' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 16, padding: '24px 28px', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                {c.icon}
                <div style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', background: '#f0fdf4', padding: '3px 8px', borderRadius: 6 }}>+12%</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit', sans-serif", letterSpacing: '-1px' }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 3 SECTIONS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 32 }}>

          {/* Section A — File d'attente de validation (preview) */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>File d'attente de validation</h3>
              {stats && <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', background: '#fef3c7', padding: '3px 10px', borderRadius: 8 }}>{stats.pending || 0} en attente</span>}
            </div>
            {queue.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                {TI.clipCheck}
                <p style={{ color: '#64748b', fontSize: 14, marginTop: 12 }}>Aucun dossier en attente</p>
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Patient', 'Type cancer', 'Soumis le', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: h === 'Action' ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{c.nom} {c.prenom}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#eff6ff', color: '#3b82f6' }}>{c.topographie_icdo3 || 'N/A'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>{c.case_created ? new Date(c.case_created).toLocaleDateString('fr-FR') : '—'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={() => navigate('/validations')} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Examiner</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => navigate('/validations')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Voir tous les dossiers en attente →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Section B — Activite recente */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Activite recente</h3>
            </div>
            <div style={{ padding: '8px 0', maxHeight: 340, overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune action enregistree</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < history.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.validation_statut === 'approuve' ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{h.nom} {h.prenom}</span>
                      <span style={{ color: h.validation_statut === 'approuve' ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 12, marginLeft: 8 }}>
                        {h.validation_statut === 'approuve' ? 'Approuve' : 'Rejete'}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{relTime(h.validated_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section C — Statistiques rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Dossiers valides ce mois', value: stats?.approvedMonth || 0, color: '#10b981', bg: '#dcfce7' },
            { label: 'Taux de validation', value: `${stats?.monthlyRate || 0}%`, color: '#3b82f6', bg: '#dbeafe' },
            { label: 'Cas integres aux stats', value: stats?.approvedMonth || 0, color: '#8b5cf6', bg: '#ede9fe' },
            { label: 'Dossiers rejetes ce mois', value: stats?.rejectedMonth || 0, color: '#ef4444', bg: '#fee2e2' },
          ].map((c, i) => (
            <div key={i} style={{ background: c.bg, borderRadius: 14, padding: '20px 24px', border: `1px solid ${c.color}22` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: c.color, fontFamily: "'Outfit', sans-serif" }}>{c.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.color, opacity: 0.8, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}

export default function Dashboard() {
   const { user } = useAuth();
   const isEpidemio = user?.role === 'epidemiologiste' || user?.role === 'epidemio';
   if (isEpidemio) return <EpidemioDashboard />;

   const navigate = useNavigate();
   const [stats, setStats] = useState(null);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');

   const [filterWilaya, setFilterWilaya] = useState('');
   const [filterType, setFilterType] = useState('');
   const [filterSexe, setFilterSexe] = useState('');
   const [filterAnnee, setFilterAnnee] = useState('');

   useEffect(() => {
      loadStats();
   }, [filterWilaya, filterType, filterSexe, filterAnnee]);

   const loadStats = () => {
      setLoading(true);
      getDashboardStats({ year: filterAnnee, wilaya: filterWilaya, type: filterType, sexe: filterSexe })
         .then(r => setStats(r.data))
         .catch(console.error)
         .finally(() => setLoading(false));
   };

   const handleReset = () => {
      setFilterWilaya('');
      setFilterType('');
      setFilterSexe('');
      setFilterAnnee('');
      toast.success('Filtres réinitialisés');
   };

   const handleQuickSearch = () => {
      if (!searchQuery.trim()) return;
      toast.loading("Recherche...", { id: 'search' });
      const found = stats?.recentDossiers?.find(d => d.nom.toLowerCase().includes(searchQuery.toLowerCase()));
      if (found) {
         toast.success("Dossier trouvé", { id: 'search' });
         navigate(`/cas-cancer/${found.caseId}`);
      } else {
         toast.error("Aucun résultat", { id: 'search' });
         navigate('/patients');
      }
   };

   const t = stats?.totaux || {};
   const sexeData = (stats?.parSexe || []).map(s => ({ name: s.sexe === 'M' ? 'Hommes' : 'Femmes', value: s.count }));
   const typeData = (stats?.parType || []).slice(0, 6).map(t => ({ name: t.type_cancer, value: t.count }));
   const ageData = stats?.parAge || [];
   const wilayaData = (stats?.parWilaya || []).slice(0, 5);

   return (
      <Layout title="">
         <div style={{ padding: '0 20px 60px' }}>

            {/* ── HERO SECTION ── */}
            <div style={{
               background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
               borderRadius: 40, padding: '48px', marginBottom: 40,
               boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
               position: 'relative', overflow: 'hidden'
            }}>
               <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, transparent 80%)', filter: 'blur(60px)' }} />
               <div style={{ position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, transparent 80%)', filter: 'blur(50px)' }} />

               <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                     <h1 style={{ fontSize: 44, fontWeight: 900, color: 'white', margin: '0 0 16px 0', fontFamily: 'Outfit', letterSpacing: '-1.5px' }}>
                        Bonjour, <span style={{ color: '#38bdf8' }}>Dr. Admin</span> 👋
                     </h1>
                     <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 500, maxWidth: 500 }}>
                        Voici l'état actuel de la surveillance épidémiologique au niveau national.
                     </p>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                     <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '1px' }}>Synchronisation</div>
                        <div style={{ color: '#22c55e', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                           <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} /> Temps Réel
                        </div>
                     </div>
                     <button onClick={loadStats} style={{ width: 56, height: 56, borderRadius: 20, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'rotate(180deg)'}>
                        <RefreshCw size={24} />
                     </button>
                  </div>
               </div>
            </div>

            {/* ── KPI GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
               <PremiumKPICard icon={Users} label="Patients Totaux" value={t.patients || 0} trend="Données consolidées" color="#3b82f6" bgGradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
               <PremiumKPICard icon={Activity} label="Incidence Mensuelle" value={t.nouveauxMois || 0} trend="Nouveaux cas détectés" color="#ec4899" bgGradient="linear-gradient(135deg, #ec4899, #be185d)" />
               <PremiumKPICard icon={Heart} label="Cas Actifs" value={t.enTraitement || 0} trend="En cours de traitement" color="#f59e0b" bgGradient="linear-gradient(135deg, #f59e0b, #d97706)" />
               <PremiumKPICard icon={AlertTriangle} label="Stades Critiques" value={t.stadeIV || 0} trend="Analyse de sévérité (IV)" color="#ef4444" bgGradient="linear-gradient(135deg, #ef4444, #dc2626)" />
            </div>

            {/* ── SEARCH & FILTERS BAR ── */}
            <div style={{
               background: 'white', padding: '24px 32px', borderRadius: 32, border: '1.5px solid #f1f5f9',
               display: 'flex', gap: 24, marginBottom: 40, alignItems: 'center', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.03)'
            }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRight: '1.5px solid #f1f5f9', paddingRight: 24, marginRight: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                     <Search size={20} />
                  </div>
                  <input
                     type="text"
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleQuickSearch()}
                     placeholder="Rechercher un dossier..."
                     style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontWeight: 600, width: 220 }}
                  />
               </div>

               <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                  <FilterSelect icon={MapPin} value={filterWilaya} options={WILAYAS} onChange={setFilterWilaya} placeholder="Wilaya" />
                  <FilterSelect icon={Activity} value={filterType} options={CANCER_TYPES} onChange={setFilterType} placeholder="Type Cancer" />
                  <FilterSelect icon={Users} value={filterSexe} options={['M', 'F']} onChange={setFilterSexe} placeholder="Genre" />
                  <FilterSelect icon={Calendar} value={filterAnnee} options={[2026, 2025, 2024, 2023]} onChange={setFilterAnnee} placeholder="Année" />
               </div>

               <button onClick={handleReset} style={{ padding: '0 24px', height: 52, borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}>
                  Effacer
               </button>
            </div>

            {/* ── CHARTS SECTION ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32, marginBottom: 32 }}>
               {/* Trends Area Chart */}
               <div style={{ background: 'white', padding: 32, borderRadius: 36, border: '1.5px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                     <div>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Répartition par Tranche d'Âge</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 600 }}>Analyse démographique des cas enregistrés</p>
                     </div>
                     <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Données ICD-O-3</div>
                  </div>
                  <div style={{ height: 350 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ageData}>
                           <defs>
                              <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} dy={15} style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }} />
                           <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }} />
                           <Tooltip contentStyle={{ borderRadius: 20, border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '12px 20px' }} />
                           <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorAge)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Wilaya Bar Chart */}
               <div style={{ background: 'white', padding: 32, borderRadius: 36, border: '1.5px solid #f1f5f9', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                     <div>
                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Top 5 Wilayas</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 600 }}>Concentration épidémiologique</p>
                     </div>
                     <Globe size={20} color="#10b981" />
                  </div>
                  <div style={{ height: 350 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wilayaData} layout="vertical" margin={{ left: 20, right: 20 }}>
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }} width={100} />
                           <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
                           <Bar dataKey="value" fill="#10b981" radius={[0, 10, 10, 0]} barSize={24} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* ── BOTOW ROW: Pie Charts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
               <div style={{ background: 'white', padding: 32, borderRadius: 36, border: '1.5px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 24, textAlign: 'center' }}>Répartition par Genre</h3>
                  <div style={{ height: 280 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={sexeData} innerRadius={70} outerRadius={100} dataKey="value" stroke="white" strokeWidth={4} paddingAngle={4}>
                              {sexeData.map((_, i) => <Cell key={i} fill={COLORS_SEXE[i % COLORS_SEXE.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: 16, border: 'none' }} />
                           <Legend verticalAlign="bottom" align="center" iconType="circle" />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               <div style={{ background: 'white', padding: 32, borderRadius: 36, border: '1.5px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 24, textAlign: 'center' }}>Types de Cancer Dominants</h3>
                  <div style={{ height: 280 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={typeData} innerRadius={0} outerRadius={100} dataKey="value" stroke="white" strokeWidth={4}>
                              {typeData.map((_, i) => <Cell key={i} fill={COLORS_TYPE[i % COLORS_TYPE.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: 16, border: 'none' }} />
                           <Legend verticalAlign="bottom" align="center" iconType="circle" />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>

         </div>
      </Layout>
   );
}

function FilterSelect({ icon: Icon, value, options, onChange, placeholder }) {
   return (
      <div style={{ flex: 1, position: 'relative' }}>
         <div style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }}>
            <Icon size={16} />
         </div>
         <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
               width: '100%', height: 44, borderRadius: 14, background: '#f8fafc',
               border: '1.5px solid #f1f5f9', padding: '0 12px 0 40px', fontSize: 13,
               fontWeight: 700, color: '#1e293b', outline: 'none', appearance: 'none',
               cursor: 'pointer'
            }}
         >
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o === 'M' ? 'Masculin' : o === 'F' ? 'Féminin' : o}</option>)}
         </select>
      </div>
   );
}
