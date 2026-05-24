import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api, { BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const INTERP_COLORS = { Normal: '#16a34a', Bas: '#2563eb', Haut: '#d97706', Critique: '#dc2626' };

const ANALYSES_CATEGORIES = {
  'Hématologie': ['NFS', 'Frottis sanguin', 'Groupage sanguin', 'VS', 'TP / INR', 'TCA'],
  'Biochimie': ['Glycémie', 'Urée', 'Créatinine', 'Sodium (Na)', 'Potassium (K)'],
  'Bilan Hépatique': ['ASAT (TGO)', 'ALAT (TGP)', 'Gamma-GT', 'Bilirubine totale'],
  'Marqueurs Tumoraux': ['ACE', 'CA 15-3', 'CA 125', 'CA 19-9', 'PSA'],
  'Hormonologie': ['TSH', 'CRP', 'Œstradiol', 'Progestérone']
};

export default function AnalysesBiologie() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLaboratoire = user?.role === 'laboratoire';
  const [patients, setPatients] = useState([]);
  const [patientStats, setPatientStats] = useState({});
  const [search, setSearch] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [biologie, setBiologie] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [labos, setLabos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [requestData, setRequestData] = useState({ labo_id: '', analyses_demandees: [], notes_labo: '' });

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [pRes, sRes, lRes] = await Promise.all([
                api.get('/patients'),
                api.get('/biologie/patient-stats'),
                api.get('/users/role/laboratoire')
            ]);
            setPatients(pRes.data.patients || pRes.data || []);
            setPatientStats(sRes.data);
            setLabos(lRes.data);
        } catch (e) {} finally { setLoadingPatients(false); }
    };
    fetchData();
  }, []);

  const selectPatient = async (p) => {
    setSelectedPatient(p);
    setLoadingData(true);
    try {
      const [bioRes, labRes] = await Promise.all([
        api.get(`/biologie/patient/${p.id}`),
        api.get(`/lab-requests/patient/${p.id}`)
      ]);
      setBiologie(bioRes.data);
      setLabRequests(labRes.data);
    } catch (e) { toast.error('Erreur de chargement'); } finally { setLoadingData(false); }
  };

  const handleAddBiologie = async () => {
    try {
      await api.post('/biologie', { ...formData, patient_id: selectedPatient.id });
      toast.success('Analyse ajoutée');
      setShowForm(false);
      const r = await api.get(`/biologie/patient/${selectedPatient.id}`);
      setBiologie(r.data);
    } catch (e) { toast.error('Erreur'); }
  };

  const handleCreateRequest = async () => {
    if (!requestData.labo_id) return toast.error('Sélectionnez un laboratoire');
    if (!requestData.analyses_demandees.length) return toast.error('Sélectionnez au moins une analyse');
    try {
      await api.post('/lab-requests', {
        patient_id: selectedPatient.id,
        labo_id: requestData.labo_id,
        analyses_demandees: requestData.analyses_demandees,
        notes_labo: requestData.notes_labo
      });
      toast.success('Demande envoyée au laboratoire !');
      setShowRequestForm(false);
      setRequestData({ labo_id: '', analyses_demandees: [], notes_labo: '' });
      const r = await api.get(`/lab-requests/patient/${selectedPatient.id}`);
      setLabRequests(r.data);
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur lors de la création'); }
  };

  const toggleAnalyse = (analyse) => {
    setRequestData(prev => ({
      ...prev,
      analyses_demandees: prev.analyses_demandees.includes(analyse)
        ? prev.analyses_demandees.filter(a => a !== analyse)
        : [...prev.analyses_demandees, analyse]
    }));
  };

  const bioChartData = () => {
    const dates = [...new Set(biologie.map(b => b.date_examen?.slice(0, 10)))].sort();
    const params = [...new Set(biologie.map(b => b.parametre))].slice(0, 3);
    const colors = ['#3b82f6', '#ec4899', '#10b981'];
    return {
      labels: dates,
      datasets: params.map((p, i) => ({
        label: p,
        data: dates.map(d => {
            const match = biologie.find(b => b.date_examen?.slice(0,10) === d && b.parametre === p);
            return match ? parseFloat(match.valeur) : null;
        }),
        borderColor: colors[i], borderWidth: 3, pointRadius: 4, tension: 0.4
      }))
    };
  };

  const filteredPatients = patients.filter(p => `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()));

  // ─── STYLES ───
  const cardStyle = { background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' };

  if (selectedPatient) {
    return (
      <Layout title="Bio-Analytique">
        <div style={{ animation: 'fade-in 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <button onClick={() => setSelectedPatient(null)} style={{ width: 44, height: 44, borderRadius: 14, background: '#f8fafc', border: '1.5px solid #f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedPatient.prenom} {selectedPatient.nom}</h1>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Dossier Bio-Oncologique · ID: {selectedPatient.id}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                {!isLaboratoire && (
                  <button onClick={() => setShowRequestForm(true)} style={{ padding: '12px 24px', borderRadius: 12, background: 'white', border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                      NOUVELLE DEMANDE LABO
                  </button>
                )}
                {!isLaboratoire && (
                  <button onClick={() => setShowForm(true)} style={{ padding: '12px 24px', borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                      + SAISIE RÉSULTAT
                  </button>
                )}
            </div>
          </div>

        {loadingData ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Trends */}
                <div style={cardStyle}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 24, background: '#3b82f6', borderRadius: 4 }} />
                        Analyse des Tendances
                    </div>
                    {biologie.length < 2 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Pas assez de données pour générer un graphique de tendance.</div>
                    ) : (
                        <Line data={bioChartData()} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11, weight: 'bold' } } } }, scales: { y: { grid: { borderDash: [5,5] } }, x: { grid: { display: false } } } }} />
                    )}
                </div>

                {/* History */}
                <div style={cardStyle}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 24 }}>Historique des Résultats</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {biologie.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>Aucune analyse documentée.</div>
                        ) : (
                            biologie.map(b => (
                                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#f8fafc', borderRadius: 20, border: '1.5px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: INTERP_COLORS[b.interpretation] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: INTERP_COLORS[b.interpretation] }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/><path d="m4.93 4.93 14.14 14.14M4.93 19.07 19.07 4.93"/></svg>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{b.parametre}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{b.date_examen?.slice(0,10)} · {b.type_examen}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: INTERP_COLORS[b.interpretation] }}>{b.valeur} <span style={{ fontSize: 12, color: '#94a3b8' }}>{b.unite}</span></div>
                                        <div style={{ fontSize: 10, fontWeight: 900, color: INTERP_COLORS[b.interpretation], textTransform: 'uppercase' }}>{b.interpretation}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {/* Lab Requests Sidebar */}
                <div style={cardStyle}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>Demandes Labo</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {labRequests.map(r => (
                            <div key={r.id} style={{ padding: 16, background: '#f8fafc', borderRadius: 16, border: '1.5px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6' }}>{r.statut.toUpperCase()}</span>
                                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{r.created_at?.slice(0,10)}</span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Labo: {r.labo_nom}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{JSON.parse(r.analyses_demandees || '[]').join(', ')}</div>
                                {r.fichier_pdf && (
                                    <a href={`${BASE_URL}${r.fichier_pdf}`} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 12, textAlign: 'center', padding: '8px', background: '#0f172a', color: 'white', fontSize: 11, fontWeight: 800, borderRadius: 8, textDecoration: 'none' }}>VOIR RÉSULTAT PDF</a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}
        </div>

        {/* ── Demande Labo Modal ── */}
        {showRequestForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Nouvelle Demande Labo</h2>
                  <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Patient : <strong>{selectedPatient.prenom} {selectedPatient.nom}</strong></p>
                </div>
                <button onClick={() => { setShowRequestForm(false); setRequestData({ labo_id: '', analyses_demandees: [], notes_labo: '' }); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: '#64748b' }}>✕</button>
              </div>

              {/* Labo selector */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Laboratoire *</label>
                <select value={requestData.labo_id} onChange={e => setRequestData(p => ({ ...p, labo_id: e.target.value }))} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none' }}>
                  <option value=''>-- Sélectionner un laboratoire --</option>
                  {labos.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
                </select>
              </div>

              {/* Analyses checklist */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 12 }}>Analyses à réaliser *</label>
                {Object.entries(ANALYSES_CATEGORIES).map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>{cat}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {items.map(item => {
                        const checked = requestData.analyses_demandees.includes(item);
                        return (
                          <button key={item} onClick={() => toggleAnalyse(item)} style={{ padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${checked ? '#3b82f6' : '#e2e8f0'}`, background: checked ? '#eff6ff' : 'white', color: checked ? '#1d4ed8' : '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                            {checked ? '✓ ' : ''}{item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Note clinique (optionnelle)</label>
                <textarea value={requestData.notes_labo} onChange={e => setRequestData(p => ({ ...p, notes_labo: e.target.value }))} rows={3} placeholder='Instructions ou contexte clinique pour le laboratoire...' style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowRequestForm(false); setRequestData({ labo_id: '', analyses_demandees: [], notes_labo: '' }); }} style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleCreateRequest} style={{ padding: '12px 24px', borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Envoyer la demande →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Biologie Modal ── */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'white', borderRadius: 24, padding: 36, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Saisie Résultat Biologie</h2>
                <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: '#64748b' }}>✕</button>
              </div>
              {[['date_examen','Date','date'],['type_examen','Type examen','text'],['parametre','Paramètre','text'],['valeur','Valeur','text'],['unite','Unité','text'],['valeur_normale','Valeur normale','text']].map(([k,l,t]) => (
                <div key={k} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>{l}</label>
                  <input type={t} value={formData[k]||''} onChange={e => setFormData(p=>({...p,[k]:e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Interprétation</label>
                <select value={formData.interpretation||'Normal'} onChange={e=>setFormData(p=>({...p,interpretation:e.target.value}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13 }}>
                  {['Normal','Bas','Haut','Critique'].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '11px 22px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleAddBiologie} style={{ padding: '11px 22px', borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  return (
    <Layout title="Analyses Biologie">
      <div style={{ animation: 'fade-in 0.4s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Bio-Analytique</h1>
                <p style={{ color: '#64748b', fontSize: 15, fontWeight: 500, marginTop: 4 }}>Laboratoire d'oncologie & Monitoring biologique</p>
            </div>
            <div style={{ position: 'relative' }}>
                <input 
                    placeholder="Chercher un patient..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: '14px 24px 14px 48px', borderRadius: 16, border: '1.5px solid #e2e8f0', fontSize: 14, fontWeight: 600, width: 320, outline: 'none', transition: 'all 0.2s' }}
                />
                <svg style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
        </div>

        {loadingPatients ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><div className="spinner" /></div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                {filteredPatients.map(p => {
                    const stats = patientStats[p.id] || {};
                    return (
                        <div key={p.id} onClick={() => selectPatient(p)} style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 24, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 16, background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900 }}>
                                    {p.nom?.[0]}{p.prenom?.[0]}
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{p.prenom} {p.nom}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{p.wilaya} · {p.age} ans</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Analyses</div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{stats.nb_analyses || 0}</div>
                                </div>
                                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Demandes</div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{stats.nb_demandes || 0}</div>
                                </div>
                            </div>
                            {stats.nb_en_attente > 0 && (
                                <div style={{ position: 'absolute', top: 12, right: 12, background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>{stats.nb_en_attente} EN ATTENTE</div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </Layout>
  );
}
