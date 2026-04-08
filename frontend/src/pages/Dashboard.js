import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDashboardStats } from '../utils/api';
import toast from 'react-hot-toast';

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
const COLORS_TYPE = ['#6366f1', '#f59e0b'];

export default function Dashboard() {
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
    if(!searchQuery.trim()) return;
    toast.loading("Recherche du dossier...", { id: 'search' });
    // Pour la démo, on redirige vers le premier dossier récent si trouvé, sinon vers la liste
    const found = stats?.recentDossiers?.find(d => d.nom.toLowerCase().includes(searchQuery.toLowerCase()));
    if(found) {
       toast.success("Dossier trouvé", { id: 'search' });
       navigate(`/cas-cancer/${found.caseId}`);
    } else {
       toast.error("Veuillez saisir un nom complet pour la recherche directe", { id: 'search' });
       navigate('/patients');
    }
  };

  const t = stats?.totaux || {};
  const sexeData = (stats?.parSexe || []).map(s => ({ name: s.sexe === 'M' ? 'Hommes' : 'Femmes', value: s.count }));
  const typeData = (stats?.parType || []).map(t => ({ name: t.type_cancer, value: t.count }));
  const ageData = stats?.parAge || [];
  const wilayaData = stats?.parWilaya || [];

  return (
    <Layout title="">
      <div style={{ padding: '0 10px 40px' }}>
        
        {/* KPI HEADERS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
          <KPIMiniCard label="Total Patients" value={t.patients || 0} />
          <KPIMiniCard label="Nouveaux ce mois" value={t.nouveauxMois || 0} />
          <KPIMiniCard label="Sous chimiothérapie" value={t.enTraitement || 0} />
          <KPIMiniCard label="Patients en suivi" value={t.suivi || 0} />
          <KPIMiniCard label="Cas Stade IV" value={t.stadeIV || 0} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 32 }}>
             {/* SITUATIONS CRITIQUES */}
            <div className="card" style={{ padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Situations Critiques</h3>
                  </div>
                  <button style={{ color: '#0ea5e9', background: 'none', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Tout surveiller</button>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                 {(stats?.recentDossiers?.slice(0, 2) || []).map((d, idx) => (
                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: 12, background: '#fff1f270', border: '1px solid #fecdd330' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: 18 }}>{idx === 0 ? '🩸' : '⏳'}</div>
                        <div>
                           <div style={{ fontSize: 13, fontWeight: 800, color: '#9f1239' }}>{idx === 0 ? 'Alerte Globules' : 'Retard Chimio'} : {d.nom} {d.prenom}</div>
                           <div style={{ fontSize: 11, color: '#e11d48', opacity: 0.8 }}>{d.diagnostic} — {d.stade}</div>
                        </div>
                      </div>
                      {/* LE LIEN VA MAINTENANT DIRECTEMENT AU DOSSIER MEDICAL (CAS-CANCER) */}
                      <button onClick={() => navigate(`/cas-cancer/${d.caseId}`)} className="btn btn-sm btn-primary" style={{ borderRadius: 8, height: 36, padding: '0 16px', fontWeight: 800 }}>Voir le dossier</button>
                   </div>
                 ))}
                 {!stats?.recentDossiers?.length && <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>Aucune alerte critique pour le moment.</div>}
               </div>
            </div>

            {/* QUICK SEARCH */}
            <div className="card" style={{ padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Recherche Express</h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Consultez un dossier patient en saisissant son nom.</p>
                <div style={{ position: 'relative' }}>
                   <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleQuickSearch()} placeholder="Nom du patient..." style={{ width: '100%', height: 48, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 16px', fontSize: 14, fontWeight: 600, outline: 'none' }} />
                   <button onClick={handleQuickSearch} style={{ position: 'absolute', right: 8, top: 8, height: 32, padding: '0 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Chercher</button>
                </div>
            </div>
        </div>

        {/* FILTERS */}
        <div style={{ background: 'white', padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', gap: 16, marginBottom: 32, alignItems: 'flex-end', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
           <FilterSelect label="Wilaya" value={filterWilaya} options={WILAYAS} onChange={setFilterWilaya} placeholder="Toutes les Wilayas" />
           <FilterSelect label="Type de Cancer" value={filterType} options={CANCER_TYPES} onChange={setFilterType} placeholder="Tous les Types" />
           <FilterSelect label="Sexe" value={filterSexe} options={['M', 'F']} onChange={setFilterSexe} placeholder="Tous les Sexes" />
           <div style={{ width: 100 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Année</label>
              <select className="form-control" value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)} style={{ borderRadius: 10, height: 40, fontSize: 13 }}>
                <option value="">Toutes</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
           </div>
           <button onClick={handleReset} style={{ height: 40, padding: '0 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: 12 }}>Rafraîchir</button>
        </div>

        {/* CHART GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
           <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 24 }}>Répartition par sexe et type</h3>
              <div style={{ display: 'flex', height: 260 }}>
                 <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 10 }}>Sexe</div>
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={sexeData} innerRadius={0} outerRadius={80} dataKey="value" stroke="none">
                             {sexeData.map((_, i) => <Cell key={i} fill={COLORS_SEXE[i % COLORS_SEXE.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="top" iconType="rect" align="center" style={{ fontSize: 11 }} />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 10 }}>Type de Cancer</div>
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={typeData} innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                             {typeData.map((_, i) => <Cell key={i} fill={COLORS_TYPE[i % COLORS_TYPE.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="top" iconType="rect" align="center" />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 24 }}>Top Wilayas (Cas)</h3>
              <div style={{ height: 260 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wilayaData} layout="vertical" margin={{ left: 50, right: 30 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} />
                       <Tooltip cursor={{ fill: '#f8fafc' }} />
                       <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
           <div className="card" style={{ padding: 24, borderRadius: 20, border: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 24 }}>Répartition par tranche d'âge</h3>
              <div style={{ height: 260 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                       <Tooltip cursor={{ fill: '#f8fafc' }} />
                       <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="card" style={{ padding: 32, borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: '#fcfdfe' }}>
              <div style={{ maxWidth: 220 }}>
                 <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 0 }}>OncoTrack Intelligence : Les données sont consolidées selon les filtres cliniques sélectionnés.</p>
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
       <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>{label}</label>
       <select className="form-control" value={value} onChange={e => onChange(e.target.value)} style={{ borderRadius: 10, height: 40, fontSize: 13 }}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o === 'M' ? 'Masculin' : o === 'F' ? 'Féminin' : (o.length > 20 ? o.substring(0,20)+'...' : o)}</option>)}
       </select>
    </div>
  );
}

function KPIMiniCard({ label, value }) {
  return (
    <div style={{ background: 'white', padding: '20px 24px', borderRadius: 20, border: '1px solid #f1f5f9' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  );
}
