import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const STATUS_COLORS = { 'Normal': '#22c55e', 'Bas': '#3b82f6', 'Haut': '#f59e0b', 'Critique': '#e63946' };

const ANALYSES_CATEGORIES = {
  'Hématologie & Hémostase': ['NFS', 'Frottis sanguin', 'Groupage sanguin', 'VS', 'TP / INR', 'TCA', 'Fibrinogène'],
  'Biochimie & Ionogramme': ['Glycémie', 'Urée', 'Créatinine', 'Sodium (Na)', 'Potassium (K)', 'Calcium (Ca)'],
  'Bilan Hépatique': ['ASAT (TGO)', 'ALAT (TGP)', 'Gamma-GT', 'Bilirubine totale'],
  'Marqueurs Tumoraux': ['ACE', 'CA 15-3', 'CA 125', 'CA 19-9', 'PSA', 'AFP'],
  'Hormonologie & Inflammation': ['TSH', 'CRP', 'Œstradiol', 'Progestérone']
};

export default function AnalysesBiologie() {
  const navigate = useNavigate();

  // Patient list state
  const [patients, setPatients] = useState([]);
  const [patientStats, setPatientStats] = useState({});
  const [search, setSearch] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Selected patient state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [biologie, setBiologie] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [labos, setLabos] = useState([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [requestData, setRequestData] = useState({ labo_id: '', analyses_demandees: [], notes_labo: '' });

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));
  const setReq = (k, v) => setRequestData(p => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get('/patients')
      .then(r => setPatients(r.data.patients || r.data || []))
      .catch(() => {})
      .finally(() => setLoadingPatients(false));
    api.get('/users/role/laboratoire').then(r => setLabos(r.data)).catch(() => {});
    api.get('/biologie/patient-stats').then(r => setPatientStats(r.data)).catch(() => {});
  }, []);

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoadingData(true);
    setShowForm(false);
    setShowRequestForm(false);
    setFormData({});
    setRequestData({ labo_id: '', analyses_demandees: [], notes_labo: '' });
    try {
      const [bioRes, labRes] = await Promise.all([
        api.get(`/biologie/patient/${patient.id}`),
        api.get(`/lab-requests/patient/${patient.id}`)
      ]);
      setBiologie(bioRes.data);
      setLabRequests(labRes.data);
    } catch (e) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoadingData(false);
    }
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setBiologie([]);
    setLabRequests([]);
    setShowForm(false);
    setShowRequestForm(false);
  };

  const handleAddBiologie = async () => {
    try {
      await api.post('/biologie', { ...formData, patient_id: selectedPatient.id });
      toast.success('Analyse ajoutée !');
      setShowForm(false);
      setFormData({});
      const r = await api.get(`/biologie/patient/${selectedPatient.id}`);
      setBiologie(r.data);
    } catch (e) { toast.error('Erreur: ' + (e.response?.data?.message || e.message)); }
  };

  const handleRequestLab = async () => {
    try {
      if (!requestData.labo_id) return toast.error('Veuillez sélectionner un laborantin');
      let analysesArray = requestData.analyses_demandees;
      if (typeof analysesArray === 'string') analysesArray = analysesArray.split(',').map(a => a.trim()).filter(a => a);
      if (analysesArray.length === 0) return toast.error('Veuillez spécifier les analyses');
      await api.post('/lab-requests', {
        patient_id: selectedPatient.id,
        labo_id: requestData.labo_id,
        analyses_demandees: analysesArray,
        notes_labo: requestData.notes_labo
      });
      toast.success('Demande envoyée au laboratoire !');
      setShowRequestForm(false);
      setRequestData({ labo_id: '', analyses_demandees: [], notes_labo: '' });
      const r = await api.get(`/lab-requests/patient/${selectedPatient.id}`);
      setLabRequests(r.data);
    } catch (e) { toast.error('Erreur: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDeleteBiologie = async (bId) => {
    if (!window.confirm('Supprimer cette analyse ?')) return;
    await api.delete(`/biologie/${bId}`);
    toast.success('Supprimé');
    const r = await api.get(`/biologie/patient/${selectedPatient.id}`);
    setBiologie(r.data);
  };

  const bioChartData = () => {
    const params = [...new Set(biologie.map(b => b.parametre))].slice(0, 3);
    const colors = ['#0f4c81', '#e63946', '#22c55e'];
    return {
      labels: [...new Set(biologie.map(b => b.date_examen?.slice(0, 10)))].sort(),
      datasets: params.map((p, i) => ({
        label: p,
        data: biologie.filter(b => b.parametre === p).map(b => parseFloat(b.valeur)).filter(v => !isNaN(v)),
        borderColor: colors[i], backgroundColor: colors[i] + '22', tension: 0.4, fill: false
      }))
    };
  };

  const filteredPatients = patients.filter(p =>
    `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  // ─── DETAIL VIEW (patient selected) ──────────────────────────────────────
  if (selectedPatient) {
    return (
      <Layout title="Analyses Biologie">
        {/* Back + patient header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button className="btn btn-outline" onClick={handleBack}>← Retour</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0f4c81', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
              {`${selectedPatient.prenom?.[0] || ''}${selectedPatient.nom?.[0] || ''}`.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{selectedPatient.prenom} {selectedPatient.nom}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{selectedPatient.wilaya} · {biologie.length} analyse(s) · {labRequests.length} demande(s) labo</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/patients/${selectedPatient.id}`)}>
            Voir la fiche patient →
          </button>
        </div>

        {loadingData ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Lab requests */}
            <div className="card" style={{ border: '2px solid #bae6fd' }}>
              <div className="card-header" style={{ background: '#f0f9ff' }}>
                <h2>📋 Demandes d'Analyses au Laboratoire ({labRequests.length})</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowRequestForm(!showRequestForm)}>+ Demander des analyses</button>
              </div>
              {showRequestForm && (
                <div style={{ padding: '24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                    <div>
                      <div className="form-group is-required">
                        <label className="form-label">Laborantin Destinataire</label>
                        <select className="form-control" value={requestData.labo_id} onChange={e => setReq('labo_id', e.target.value)}>
                          <option value="">-- Sélectionner --</option>
                          {labos.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Notes particulières</label>
                        <textarea className="form-control" rows={3} placeholder="Urgent, à jeun, etc..." value={requestData.notes_labo} onChange={e => setReq('notes_labo', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Sélectionner les analyses</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {Object.entries(ANALYSES_CATEGORIES).map(([cat, items]) => (
                          <div key={cat} style={{ background: 'white', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#0f4c81', marginBottom: 8, textTransform: 'uppercase' }}>{cat}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {items.map(item => (
                                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                                  <input type="checkbox" checked={requestData.analyses_demandees.includes(item)} onChange={e => {
                                    setReq('analyses_demandees', e.target.checked
                                      ? [...requestData.analyses_demandees, item]
                                      : requestData.analyses_demandees.filter(a => a !== item));
                                  }} />
                                  {item}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                    <button className="btn btn-outline" onClick={() => setShowRequestForm(false)}>Annuler</button>
                    <button className="btn btn-primary" onClick={handleRequestLab} style={{ minWidth: 180 }}>Envoyer la demande</button>
                  </div>
                </div>
              )}
              <div className="card-body">
                {labRequests.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Aucune demande d'analyses en cours.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        {['Date', 'Laborantin', 'Analyses', 'Notes', 'Statut', 'Résultat PDF'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {labRequests.map(r => {
                        let anals = [];
                        try { anals = typeof r.analyses_demandees === 'string' ? JSON.parse(r.analyses_demandees) : r.analyses_demandees; } catch (e) {}
                        return (
                          <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px 12px' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '10px 12px' }}>{r.labo_prenom} {r.labo_nom}</td>
                            <td style={{ padding: '10px 12px' }}>{anals?.join(', ')}</td>
                            <td style={{ padding: '10px 12px' }}>{r.notes_labo || '-'}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className={r.statut === 'En attente' ? 'badge badge-orange' : 'badge badge-green'}>{r.statut}</span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {r.fichier_pdf
                                ? <a href={`http://localhost:5000${r.fichier_pdf}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 600 }}>📄 Voir PDF</a>
                                : <span style={{ color: '#94a3b8' }}>-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Manual biology results */}
            <div className="card">
              <div className="card-header">
                <h2>🧪 Résultats d'Analyses Saisis ({biologie.length})</h2>
                <button className="btn btn-outline btn-sm" onClick={() => setShowForm(!showForm)}>+ Saisie Manuelle</button>
              </div>
              {showForm && (
                <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" onChange={e => set('date_examen', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Type examen</label>
                      <select className="form-control" onChange={e => set('type_examen', e.target.value)}>
                        {['NFS', 'Biochimie', 'Marqueurs tumoraux', 'Coagulation', 'Ionogramme', 'Autre'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Paramètre</label><input className="form-control" placeholder="Ex: Hémoglobine, CA15-3" onChange={e => set('parametre', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Valeur</label><input className="form-control" placeholder="Ex: 12.5" onChange={e => set('valeur', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Unité</label><input className="form-control" placeholder="g/dL, U/mL..." onChange={e => set('unite', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Valeur normale</label><input className="form-control" placeholder="12-16 g/dL" onChange={e => set('valeur_normale', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Interprétation</label>
                      <select className="form-control" onChange={e => set('interpretation', e.target.value)}>
                        {['Normal', 'Bas', 'Haut', 'Critique'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAddBiologie}>Enregistrer</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
                  </div>
                </div>
              )}
              <div className="card-body">
                {biologie.length >= 2 && (
                  <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📈 Évolution des paramètres</div>
                    <Line data={bioChartData()} options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'bottom' },
                        zoom: { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } }
                      },
                      scales: { x: { grid: { display: false } }, y: { beginAtZero: false } }
                    }} />
                  </div>
                )}
                {biologie.length === 0 ? (
                  <div className="empty-state"><div style={{ fontSize: 36 }}>🧪</div><p>Aucune analyse au dossier</p></div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Date', 'Type', 'Paramètre', 'Valeur', 'Unité', 'Référence', 'Interp.', ''].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {biologie.map((b, i) => (
                        <tr key={b.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>{b.date_examen?.slice(0, 10)}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>{b.type_examen}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{b.parametre}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{b.valeur}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{b.unite}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontSize: 12 }}>{b.valeur_normale}</td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: STATUS_COLORS[b.interpretation] + '22', color: STATUS_COLORS[b.interpretation] }}>{b.interpretation}</span>
                          </td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                            <button onClick={() => handleDeleteBiologie(b.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer' }}>🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}
      </Layout>
    );
  }

  // ─── LIST VIEW (no patient selected) ─────────────────────────────────────
  return (
    <Layout title="Analyses Biologie">

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Analyses Biologie</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Consultez et gérez les analyses biologiques par patient
          </p>
        </div>
      </div>

      {/* Search bar — same style as Diagnostics */}
      <div className="filter-bar" style={{ background: 'white', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: 24 }}>
        <div className="search-bar" style={{ border: 'none', boxShadow: 'none' }}>
          <input
            placeholder="Rechercher un patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Patient cards */}
      {loadingPatients ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filteredPatients.length === 0 ? (
        <div className="empty-state">
          <h3>Aucun patient trouvé</h3>
          <p>Essayez de modifier votre recherche.</p>
        </div>
      ) : (
        <div className="diag-grid">
          {filteredPatients.map(p => {
            const stats = patientStats[p.id];
            const parts = [];
            if (stats) {
              parts.push(`${stats.nb_analyses} analyse${stats.nb_analyses !== 1 ? 's' : ''}`);
              parts.push(`${stats.nb_demandes} demande${stats.nb_demandes !== 1 ? 's' : ''}`);
              if (stats.nb_en_attente > 0) parts.push(`${stats.nb_en_attente} en attente`);
              if (stats.derniere_analyse) {
                const d = new Date(stats.derniere_analyse);
                parts.push(d.toLocaleDateString('fr-FR'));
              }
            }
            const statsText = parts.join(' · ');
            return (
              <div
                key={p.id}
                className="diag-card"
                onClick={() => selectPatient(p)}
                style={{ cursor: 'pointer' }}
              >
                <div className="diag-header">
                  <div className="diag-patient-info">
                    <div className="diag-patient-name">{p.prenom} {p.nom}</div>
                    {statsText && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, fontWeight: 400 }}>
                        {statsText}
                      </div>
                    )}
                  </div>
                </div>

                <div className="diag-body">
                  <div className="diag-attributes">
                    {p.fumeur && <span className="diag-attr-pill">Fumeur</span>}
                    {p.alcool && <span className="diag-attr-pill">Alcool</span>}
                    {p.activite_sportive && <span className="diag-attr-pill">Sport</span>}
                    {p.cancer_cases?.length > 0 && (
                      <span className="diag-attr-pill">{p.cancer_cases.length} cas de cancer</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
