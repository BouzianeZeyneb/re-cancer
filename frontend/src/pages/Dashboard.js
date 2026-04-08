import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';
import toast from 'react-hot-toast';

// --- MOCK DATA FOR ACCURATE LOOK ---
const EVOLUTION_DATA = [
  { name: '2026-01', value: 18 }, { name: '2026-02', value: 12 }, { name: '2026-03', value: 8 },
  { name: '2026-04', value: 7 }, { name: '2026-05', value: 16 }, { name: '2026-06', value: 14 },
  { name: '2026-07', value: 15 }, { name: '2026-08', value: 18 }, { name: '2026-09', value: 14 },
  { name: '2026-10', value: 12 }, { name: '2026-11', value: 9 }, { name: '2026-12', value: 15 }
];

const WILAYAS_DATA = [
  { name: 'Mila', value: 7 }, { name: 'Blida', value: 7 }, { name: 'El Bayadh', value: 6 },
  { name: 'Tiaret', value: 6 }, { name: 'Sétif', value: 5 }, { name: 'Guelma', value: 5 },
  { name: 'Béjaïa', value: 4 }, { name: 'Sidi Bel Abbès', value: 4 }, { name: 'Béchar', value: 3 },
  { name: 'Constantine', value: 3 }
];

const SEXE_DATA = [{ name: 'Hommes', value: 52 }, { name: 'Femmes', value: 48 }];
const TYPE_DATA = [{ name: 'Solide', value: 70 }, { name: 'Liquide', value: 30 }];

const ALERTS = [
  { id: 1, type: 'blood', patient: 'Karim Boumedienne', value: '0.5', date: '07/04/2026', label: 'Alerte Globules Blancs' },
  { id: 2, type: 'blood', patient: 'Mustapha Dahlab', value: '0.5', date: '07/04/2026', label: 'Alerte Globules Blancs' },
  { id: 3, type: 'blood', patient: 'Nabil Bouteflika', value: '0.4', date: '07/04/2026', label: 'Alerte Globules Blancs' },
  { id: 4, type: 'blood', patient: 'Sami Ben Bella', value: '1.9', date: '07/04/2026', label: 'Alerte Globules Blancs' },
  { id: 5, type: 'delay', patient: 'Nabil Bouteflika', value: 'Chimio', date: '>90j', label: 'Retard Traitement (>90j)' }
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardStats().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const total = stats?.totaux?.patients || 149;

  return (
    <Layout title="">
      <div style={{ padding: '0 10px 40px' }}>
        
        {/* KPI HEADERS (Image 1) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
          <KPIMiniCard label="Total Patients" value={total} />
          <KPIMiniCard label="Nouveaux ce mois" value={stats?.totaux?.nouveauxMois || 149} />
          <KPIMiniCard label="Sous chimiothérapie" value={stats?.totaux?.enTraitement || 5} />
          <KPIMiniCard label="Patients en suivi" value={stats?.totaux?.enSuivi || 131} />
          <KPIMiniCard label="Cas Stade IV" value={stats?.totaux?.stadeIV || 42} />
        </div>

        {/* SITUATIONS CRITIQUES (Image 1) */}
        <div className="card" style={{ padding: '24px 32px', marginBottom: 32, borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Situations Critiques</h3>
              </div>
              <button style={{ color: '#0ea5e9', background: 'none', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Voir tout</button>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
             {ALERTS.map(a => (
               <div key={a.id} style={{ 
                 display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                 padding: '16px 20px', borderRadius: 12, background: '#fff1f2', 
                 border: '1px solid #fecdd3', borderLeft: '5px solid #e11d48' 
                }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ffcfd6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                       {a.type === 'blood' ? '🩸' : '⏳'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#9f1239', fontSize: 14 }}>{a.label} : {a.patient}</div>
                      <div style={{ fontSize: 12, color: '#e11d48', marginTop: 2, fontWeight: 600 }}>{a.type === 'blood' ? `Critique: ${a.value} (Examen du ${a.date})` : `Traitement: ${a.value}`}</div>
                    </div>
                 </div>
                 <button className="btn btn-outline" style={{ background: 'white', borderRadius: 8, fontSize: 12, color: '#0f172a', fontWeight: 800, border: '1px solid #fecdd3' }}>Voir Patient</button>
               </div>
             ))}
           </div>
        </div>

        {/* FILTERS (Image 2) */}
        <div style={{ background: 'white', padding: '24px 32px', borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', gap: 16, marginBottom: 32, alignItems: 'flex-end', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
           {['Wilaya','Type de Cancer','Sexe','Année'].map(l => (
             <div key={l} style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>{l}</label>
                <select className="form-control" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, height: 44 }}>
                   <option>Toutes les {l}s</option>
                   {l === 'Année' && <option>2026</option>}
                </select>
             </div>
           ))}
           <button style={{ height: 44, padding: '0 24px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 13, fontWeight: 700 }}>Réinitialiser</button>
        </div>

        {/* EVOLUTION & STATUS SUMMARY (Image 2) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
           <div className="card" style={{ padding: 32, borderRadius: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Évolution mensuelle des cas</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 600 }}>Nombre de nouveaux diagnostics sur les 12 derniers mois</p>
              </div>
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={EVOLUTION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }} domain={[0, 25]} />
                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 3 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div style={{ 
             background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
             borderRadius: 24, padding: 32, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
             boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)'
           }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, opacity: 0.9 }}>Résumé du Statut</h3>
                <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4, fontWeight: 600 }}>Valeur consolidée</p>
                <div style={{ fontSize: 72, fontWeight: 900, marginTop: 24 }}>{total}</div>
              </div>
              <div style={{ height: 80, opacity: 0.5 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={EVOLUTION_DATA.slice(-6)}>
                       <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* LOWER CHARTS (Image 3) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
           <div className="card" style={{ padding: 32, borderRadius: 24, border: '1px solid #f1f5f9' }}>
             <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 40 }}>Répartition par sexe et type</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                   <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 20, textTransform: 'uppercase' }}>Sexe</div>
                   <div style={{ height: 250 }}>
                     <ResponsiveContainer>
                        <PieChart>
                           <Pie data={SEXE_DATA} innerRadius={0} outerRadius={85} dataKey="value">
                              <Cell fill="#3b82f6" /><Cell fill="#f43f5e" />
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>
                <div>
                   <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 20, textTransform: 'uppercase' }}>Type de Cancer</div>
                   <div style={{ height: 250 }}>
                     <ResponsiveContainer>
                        <PieChart>
                           <Pie data={TYPE_DATA} innerRadius={60} outerRadius={85} dataKey="value">
                              <Cell fill="#6366f1" /><Cell fill="#f59e0b" />
                           </Pie>
                           <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                </div>
             </div>
           </div>

           <div className="card" style={{ padding: 32, borderRadius: 24, border: '1px solid #f1f5f9' }}>
             <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 40 }}>Top Wilayas (Cas)</h3>
             <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={WILAYAS_DATA} layout="vertical" margin={{ left: 60 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 700, color: '#475569' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>

      </div>
    </Layout>
  );
}

function KPIMiniCard({ label, value }) {
  return (
    <div style={{ 
      background: 'white', padding: '24px 32px', borderRadius: 20, 
      border: '1px solid #f1f5f9', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' 
    }}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  );
}
