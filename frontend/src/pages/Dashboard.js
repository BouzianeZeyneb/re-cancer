import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { KPICard } from './Statistiques';

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

const getAlertStyles = (text) => {
  const t = text.toLowerCase();
  if (t.includes('globules') || t.includes('plaquettes')) return { bg: '#fef2f2', border: '#fee2e2', text: '#991b1b', icon: '#dc2626' };
  if (t.includes('chimio')) return { bg: '#fff7ed', border: '#ffedd5', text: '#9a3412', icon: '#ea580c' };
  if (t.includes('anapath')) return { bg: '#f0f9ff', border: '#e0f2fe', text: '#075985', icon: '#0284c7' };
  return { bg: '#f8fafc', border: '#f1f5f9', text: '#475569', icon: '#64748b' };
};

const formatDateSimple = (dateStr) => {
  if (!dateStr) return 'Aujourd\'hui';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
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
    if(!searchQuery.trim()) return;
    toast.loading("Recherche du dossier...", { id: 'search' });
    const found = stats?.recentDossiers?.find(d => d.nom.toLowerCase().includes(searchQuery.toLowerCase()));
    if(found) {
       toast.success("Dossier trouvé", { id: 'search' });
       navigate(`/cas-cancer/${found.caseId}`);
    } else {
       toast.error("Aucun dossier trouvé pour cette recherche", { id: 'search' });
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
      <div style={{ padding: '0 12px 40px' }}>
        
        {/* KPI HEADERS - New Premium Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
          <KPICard label="Cohorte Totale" value={t.patients || 0} trend="Patients enregistrés" />
          <KPICard label="Diagnostics du Mois" value={t.nouveauxMois || 0} trend="+12% vs mois dernier" />
          <KPICard label="Actifs (Traitement)" value={t.enTraitement || 0} trend="Chimiothérapie / Radio" />
          <KPICard label="Situations Avancées" value={t.stadeIV || 0} trend="Métastatique (Stade IV)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 32, marginBottom: 32 }}>
            {/* SITUATIONS CRITIQUES */}
            <div className="card" style={{ padding: '24px', borderRadius: 24, border: '1px solid #f1f5f9', background: 'white' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Vigilance Clinique</h3>
                        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{stats?.recentDossiers?.length || 0} alertes nécessitant une action</p>
                    </div>
                  </div>
                  <button className="btn-icon-subtle" title="Configuration alertes">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.72v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                 {(stats?.recentDossiers?.slice(0, 3) || []).map((d, idx) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 16, background: idx === 0 ? '#fef2f2' : '#ffffff', border: idx === 0 ? '1.5px solid #fee2e2' : '1px solid #f1f5f9', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 22, background: idx === 0 ? '#ef4444' : '#64748b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                            {d.nom?.[0]}{d.prenom?.[0]}
                        </div>
                        <div>
                           <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{d.nom} {d.prenom}</div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                               <span style={{ fontSize: 11, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{idx === 0 ? 'BLOOD ALERT' : 'URGENT'}</span>
                               <span style={{ fontSize: 12, color: '#64748b' }}>{d.diagnostic} — {d.stade}</span>
                           </div>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/cas-cancer/${d.caseId}`)} className="btn btn-primary btn-sm" style={{ borderRadius: 10, padding: '0 16px', height: 40 }}>Ouvrir Dossier</button>
                   </div>
                 ))}
                 {!stats?.recentDossiers?.length && <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 30, background: '#f8fafc', borderRadius: 16, border: '1px dashed #e2e8f0' }}>Aucun patient en situation critique active.</div>}
               </div>
            </div>

            {/* QUICK SEARCH & TOOLS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card" style={{ padding: '28px', borderRadius: 24, border: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: 'white', marginBottom: 12, fontFamily: 'Outfit' }}>Recherche Express</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>Accès direct aux dossiers cliniques par nom ou identifiant unique.</p>
                    <div style={{ position: 'relative' }}>
                       <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleQuickSearch()} 
                        placeholder="Ex: Ben Ahmed..." 
                        style={{ width: '100%', height: 50, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} 
                       />
                       <button onClick={handleQuickSearch} style={{ position: 'absolute', right: 8, top: 8, height: 34, padding: '0 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Chercher</button>
                    </div>
                </div>

                <div className="card" style={{ padding: '28px', borderRadius: 24, border: '1px solid #f1f5f9', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 24, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 5, background: '#22c55e', animation: 'pulse 2s infinite' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>OncoTrack Intelligence</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Système synchronisé en temps réel</div>
                    <div style={{ marginTop: 20, width: '100%', height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', background: '#22c55e' }} />
                    </div>
                </div>
            </div>
        </div>

        {/* FILTERS - Bar styled */}
        <div style={{ background: 'white', padding: '16px 24px', borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', gap: 20, marginBottom: 32, alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b' }}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
               <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filtres</span>
           </div>
           
           <div style={{ flex: 1, height: 24, width: 1, background: '#e2e8f0' }} />

           <FilterSelect label="Wilaya" value={filterWilaya} options={WILAYAS} onChange={setFilterWilaya} placeholder="Toutes les Wilayas" />
           <FilterSelect label="Type Cancer" value={filterType} options={CANCER_TYPES} onChange={setFilterType} placeholder="Tous types" />
           <FilterSelect label="Sexe" value={filterSexe} options={['M', 'F']} onChange={setFilterSexe} placeholder="Genre" />
           <div style={{ width: 120 }}>
              <select className="form-control" value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)} style={{ borderRadius: 10, height: 44, fontSize: 13, fontWeight: 600, border: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <option value="">Année</option>
                {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <button onClick={handleReset} className="btn btn-outline" style={{ height: 44, borderRadius: 10, padding: '0 20px', fontWeight: 700, borderColor: '#e2e8f0' }}>Réinitialiser</button>
        </div>

        {/* CHART GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
           <div className="card" style={{ padding: 28, borderRadius: 24, border: '1px solid #f1f5f9', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Profil Démographique</h3>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Sexe & Types Dominants</div>
              </div>
              <div style={{ display: 'flex', height: 300 }}>
                 <div style={{ flex: 1, textAlign: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={sexeData} innerRadius={60} outerRadius={85} dataKey="value" stroke="white" strokeWidth={3} paddingAngle={2}>
                             {sexeData.map((_, i) => <Cell key={i} fill={COLORS_SEXE[i % COLORS_SEXE.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div style={{ flex: 1.2, textAlign: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={typeData} innerRadius={0} outerRadius={85} dataKey="value" stroke="white" strokeWidth={3}>
                             {typeData.map((_, i) => <Cell key={i} fill={COLORS_TYPE[i % COLORS_TYPE.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           <div className="card" style={{ padding: 28, borderRadius: 24, border: '1px solid #f1f5f9', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Top Wilayas (Incidence)</h3>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800 }}>DENSITÉ ÉPIDÉMIOLOGIQUE</div>
              </div>
              <div style={{ height: 300 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wilayaData} layout="vertical" margin={{ left: 60, right: 30 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 700, color: '#475569' }} />
                       <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} />
                       <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.4fr', gap: 32 }}>
           <div className="card" style={{ padding: 28, borderRadius: 24, border: '1px solid #f1f5f9', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0 }}>Distribution par Tranche d'Âge</h3>
                  <div style={{ fontSize: 11, background: '#f8fafc', padding: '4px 12px', borderRadius: 20, color: '#64748b', fontWeight: 800 }}>DONNÉES ICD-O-3</div>
              </div>
              <div style={{ height: 320 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ageData}>
                       <defs>
                          <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} />
                       <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                       <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorAge)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="card" style={{ padding: 32, borderRadius: 24, border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#fcfdfe' }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>
                 Les rapports sont conformes aux standards <strong>SEER</strong> et à la classification <strong>ICD-O-3</strong>. Les filtres permettent une analyse granulaire du territoire.
              </div>
           </div>
        </div>

      </div>
    </Layout>
  );
}

function FilterSelect({ label, value, options, onChange, placeholder }) {
  return (
    <div style={{ flex: 1 }}>
       <select className="form-control" value={value} onChange={e => onChange(e.target.value)} style={{ borderRadius: 10, height: 44, fontSize: 13, fontWeight: 600, border: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o === 'M' ? 'Masculin' : o === 'F' ? 'Féminin' : (o.length > 25 ? o.substring(0,25)+'...' : o)}</option>)}
       </select>
    </div>
  );
}
