import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
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

const ALERTS = [
  { id: 1, type: 'blood', patient: 'Mansouri Karim', value: '0.5', date: '08/04/2026', label: 'Alerte Globules Blancs' },
  { id: 4, type: 'delay', patient: 'Benalla Nadia', value: 'Chimio', date: '>90j', label: 'Retard Traitement (>90j)' }
];

const COLORS_SEXE = ['#3b82f6', '#ec4899']; // Bleu (Homme), Rose (Femme)
const COLORS_TYPE = ['#6366f1', '#f59e0b']; // Violet (Solide), Orange (Liquide)

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [filterWilaya, setFilterWilaya] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSexe, setFilterSexe] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('2026');

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
    setFilterAnnee('2026');
    toast.success('Filtres réinitialisés');
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

        {/* SITUATIONS CRITIQUES */}
        <div className="card" style={{ padding: '20px 32px', marginBottom: 32, borderRadius: 20, border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Situations Critiques</h3>
              </div>
              <button style={{ color: '#0ea5e9', background: 'none', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Voir tout</button>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
             {ALERTS.map(a => (
               <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: '#fff1f280', border: '1px solid #fecdd340' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 16 }}>{a.type === 'blood' ? '🩸' : '⏳'}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#9f1239' }}>{a.label} : {a.patient}</div>
                  </div>
                  <button className="btn btn-sm btn-outline" style={{ height: 32, fontSize: 11, padding: '0 12px' }}>Voir Dossier</button>
               </div>
             ))}
           </div>
        </div>

        {/* FILTERS */}
        <div style={{ background: 'white', padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', gap: 16, marginBottom: 32, alignItems: 'flex-end' }}>
           <FilterSelect label="Wilaya" value={filterWilaya} options={WILAYAS} onChange={setFilterWilaya} placeholder="Toutes les Wilayas" />
           <FilterSelect label="Type de Cancer" value={filterType} options={CANCER_TYPES} onChange={setFilterType} placeholder="Tous les Types" />
           <FilterSelect label="Sexe" value={filterSexe} options={['M', 'F']} onChange={setFilterSexe} placeholder="Toutes les Sexes" />
           <div style={{ width: 100 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>Année</label>
              <select className="form-control" value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)} style={{ borderRadius: 8, height: 40, fontSize: 13 }}><option value="2026">2026</option><option value="2025">2025</option></select>
           </div>
           <button onClick={handleReset} style={{ height: 40, padding: '0 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: 12 }}>Réinitialiser</button>
        </div>

        {/* CHART GRID (Exact match with screenshot) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
           {/* Card Sexe et Type */}
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

           {/* Card Top Wilayas */}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 32 }}>
           {/* Card Age */}
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

           {/* Card Info Message (Empty in screenshot) */}
           <div className="card" style={{ padding: 32, borderRadius: 20, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: '#fcfdfe' }}>
              <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, maxWidth: 200 }}>Données mises à jour en temps réel selon les filtres sélectionnés.</p>
           </div>
        </div>

        {/* RECENT TABLE */}
        <div className="card" style={{ padding: 24, borderRadius: 24, border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0 }}>Dossiers Patients Récents</h3>
              <Link to="/patients" style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Tout voir →</Link>
           </div>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                 <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                    <th style={{ padding: '12px', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Patient</th>
                    <th style={{ padding: '12px', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Infos</th>
                    <th style={{ padding: '12px', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Diagnostic</th>
                    <th style={{ padding: '12px', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Stade</th>
                    <th style={{ padding: '12px', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}></th>
                 </tr>
              </thead>
              <tbody>
                 {stats?.recentDossiers?.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                       <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 13 }}>{p.nom} {p.prenom}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                       </td>
                       <td style={{ padding: '14px 12px', fontSize: 12 }}>{p.sexe === 'M' ? '♂' : '♀'} {p.age} ans</td>
                       <td style={{ padding: '14px 12px', fontWeight: 600, fontSize: 13, color: '#444' }}>{p.diagnostic}</td>
                       <td style={{ padding: '14px 12px', fontWeight: 800, color: '#0f4c81', fontSize: 12 }}>{p.stade}</td>
                       <td style={{ padding: '14px 12px' }}>
                          <span style={{ 
                             padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                             backgroundColor: p.statut_patient === 'Guéri' ? '#dcfce7' : p.statut_patient === 'Décédé' ? '#fee2e2' : '#dbeafe',
                             color: p.statut_patient === 'Guéri' ? '#166534' : p.statut_patient === 'Décédé' ? '#991b1b' : '#1e40af'
                          }}>{p.statut_patient}</span>
                       </td>
                       <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <button className="btn btn-sm btn-primary" style={{ padding: '4px 12px', borderRadius: 6 }}>Détails</button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

      </div>
    </Layout>
  );
}

function FilterSelect({ label, value, options, onChange, placeholder }) {
  return (
    <div style={{ flex: 1 }}>
       <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>{label}</label>
       <select className="form-control" value={value} onChange={e => onChange(e.target.value)} style={{ borderRadius: 8, height: 40, fontSize: 13 }}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o === 'M' ? 'Masculin' : o === 'F' ? 'Féminin' : o}</option>)}
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
