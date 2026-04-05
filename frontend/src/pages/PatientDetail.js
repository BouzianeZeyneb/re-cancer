import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPatient } from '../utils/api';
import api from '../utils/api';
import { differenceInYears, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QRCodeCanvas } from 'qrcode.react';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');
  const [showQR, setShowQR] = useState(false);

  const [champsDynamiques, setChampsDynamiques] = useState([]);
  const [valeursDynamiques, setValeursDynamiques] = useState({});

  useEffect(() => {
    getPatient(id).then(r => setPatient(r.data)).catch(() => navigate('/patients')).finally(() => setLoading(false));
    api.get('/champs-dynamiques').then(r => setChampsDynamiques(r.data)).catch(() => {});
    api.get(`/valeurs-dynamiques/${id}`).then(r => {
      const vals = {};
      r.data.forEach(v => vals[v.champ_id] = v.valeur);
      setValeursDynamiques(vals);
    }).catch(() => {});
  }, [id, navigate]);

  useEffect(() => {
    let interval;
    if (tab === 'styles_vie') {
      interval = setInterval(() => {
        getPatient(id).then(r => {
          if (r.data) setPatient(r.data);
        }).catch(() => {});
        api.get(`/valeurs-dynamiques/${id}`).then(r => {
          const vals = {};
          r.data.forEach(v => vals[v.champ_id] = v.valeur);
          setValeursDynamiques(vals);
        }).catch(() => {});
      }, 3000); // Polling every 3s
    }
    return () => clearInterval(interval);
  }, [tab, id]);

  if (loading) return <Layout title="Fiche Patient"><div className="loading-center"><div className="spinner" /></div></Layout>;
  if (!patient) return null;

  const age = patient.date_naissance ? differenceInYears(new Date(), parseISO(patient.date_naissance)) : '-';
  const initials = `${patient.prenom[0]}${patient.nom[0]}`.toUpperCase();
  
  const hasLifestyleData = patient.fumeur || patient.alcool || patient.activite_sportive || 
    (patient.autres_facteurs_risque && patient.autres_facteurs_risque.includes('Alimentation étudiée:')) || 
    (patient.antecedents_familiaux && patient.antecedents_familiaux.trim() !== '');

  const statusClass = (s) => ({ 'En traitement': 'badge badge-blue', 'Guéri': 'badge badge-green', 'Décédé': 'badge badge-red' }[s] || 'badge badge-gray');
  const etatClass = (e) => ({ 'Localisé': 'badge badge-purple', 'Métastase': 'badge badge-orange' }[e] || 'badge badge-gray');

  return (
    <Layout title="Fiche Patient">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-outline" onClick={() => navigate('/patients')}>← Retour</button>
        <Link to={`/patients/${id}/modifier`} className="btn btn-outline">✏️ Modifier</Link>
        <Link to={`/cas-cancer/nouveau?patient=${id}`} className="btn btn-primary">+ Nouveau Cas de Cancer</Link>
      </div>

      {/* Patient header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="patient-header">
            <div className="patient-avatar-lg" style={{ background: patient.sexe === 'M' ? '#0f4c81' : '#e63946' }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div className="patient-name">{patient.prenom} {patient.nom}</div>
              <div className="patient-meta">
                <span className="patient-meta-item">📅 {age} ans · {patient.date_naissance ? format(parseISO(patient.date_naissance), 'dd/MM/yyyy') : '-'}</span>
                <span className="patient-meta-item">{patient.sexe === 'M' ? '♂' : '♀'} {patient.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
                {patient.telephone && <span className="patient-meta-item">📞 {patient.telephone}</span>}
                {patient.wilaya && <span className="patient-meta-item">📍 {patient.commune ? `${patient.commune}, ` : ''}{patient.wilaya}</span>}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {patient.fumeur && <span className="badge badge-red">🚬 Fumeur</span>}
                {patient.alcool && <span className="badge badge-orange">🍷 Alcool</span>}
                {patient.activite_sportive && <span className="badge badge-green">🏃 Sport</span>}
                <span className="badge badge-purple">{patient.cancer_cases?.length || 0} cas de cancer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Informations</button>
        <button className={`tab ${tab === 'styles_vie' ? 'active' : ''}`} onClick={() => setTab('styles_vie')}>Styles de Vie</button>
        <button className={`tab ${tab === 'cancers' ? 'active' : ''}`} onClick={() => setTab('cancers')}>Cancers ({patient.cancer_cases?.length || 0})</button>
        <button className={`tab ${tab === 'rdv' ? 'active' : ''}`} onClick={() => setTab('rdv')}>Rendez-vous ({patient.rendez_vous?.length || 0})</button>
      </div>

      {tab === 'info' && (
        <div className="card">
          <div className="card-header"><h2>Informations Personnelles</h2></div>
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item"><label>Carte Nationale</label><span style={{ fontFamily: 'JetBrains Mono' }}>{patient.num_carte_nationale || '-'}</span></div>
              <div className="info-item"><label>Carte Chifa</label><span style={{ fontFamily: 'JetBrains Mono' }}>{patient.num_carte_chifa || '-'}</span></div>
              <div className="info-item"><label>Téléphone</label><span>{patient.telephone || '-'}</span></div>
              <div className="info-item"><label>Wilaya</label><span>{patient.wilaya || '-'}</span></div>
              <div className="info-item"><label>Commune</label><span>{patient.commune || '-'}</span></div>
              <div className="info-item"><label>Adresse</label><span>{patient.adresse || '-'}</span></div>
              {champsDynamiques.filter(c => c.entite === 'patient').map(c => (
                 <div className="info-item" key={c.id}>
                    <label>{c.nom} <span style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 'normal' }}>(Dynamique)</span></label>
                    <span style={{ fontWeight: 600, color: '#4c1d95' }}>
                       {c.type_champ === 'booleen' ? (valeursDynamiques[c.id] === 'true' ? 'Oui' : valeursDynamiques[c.id] === 'false' ? 'Non' : '-') : (valeursDynamiques[c.id] || '-')}
                    </span>
                 </div>
              ))}
            </div>
            {patient.autres_facteurs_risque && (
              <div style={{ marginTop: 20 }}>
                <div className="form-label">Autres facteurs de risque</div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13.5 }}>{patient.autres_facteurs_risque}</div>
              </div>
            )}
            {patient.autres_medicaments && (
              <div style={{ marginTop: 16 }}>
                <div className="form-label">Autres médicaments</div>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13.5 }}>{patient.autres_medicaments}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'styles_vie' && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2>Styles de Vie & Antécédents</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span> Mise à jour en direct
              </div>
            </div>
          </div>
          <div className="card-body">
            {!hasLifestyleData ? (
              <div style={{ background: '#f8fafc', padding: 40, borderRadius: 16, border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Questionnaire Patient</div>
                <p style={{ fontSize: 15, color: '#64748b', marginBottom: 30, maxWidth: 500 }}>Demandez au patient de scanner ce code depuis son téléphone pour remplir lui-même ses informations de style de vie (Tabac, Alcool, Alimentation, Antécédents). Celles-ci apparaîtront automatiquement ici après le scan.</p>
                <div style={{ background: 'white', padding: 24, display: 'flex', justifyContent: 'center', borderRadius: 20, border: '2px solid #cbd5e1', width: 260, height: 260 }}>
                  <div style={{ margin: "0 auto", alignSelf: "center" }}>
                    <QRCodeCanvas size={208} value={`${window.location.origin}/patient-forms/${patient.id}`} level="H" />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ padding: 16, background: patient.fumeur ? '#fee2e2' : '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 24 }}>🚬</div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Tabagisme</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: patient.fumeur ? '#b91c1c' : '#0f172a' }}>{patient.fumeur ? 'Oui' : 'Non'}</div>
                      </div>
                    </div>
                    <div style={{ padding: 16, background: patient.alcool ? '#ffedd5' : '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 24 }}>🍷</div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Alcool</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: patient.alcool ? '#c2410c' : '#0f172a' }}>{patient.alcool ? 'Oui' : 'Non'}</div>
                      </div>
                    </div>
                    <div style={{ padding: 16, background: patient.activite_sportive ? '#dcfce7' : '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 24 }}>🏃</div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Sport / Activité</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: patient.activite_sportive ? '#15803d' : '#0f172a' }}>{patient.activite_sportive ? 'Oui' : 'Non'}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f4c81', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>🍽️ Habitudes alimentaires</div>
                    <div style={{ fontSize: 14, color: '#334155', whiteSpace: 'pre-wrap' }}>{(patient.autres_facteurs_risque?.includes('Alimentation étudiée:') ? patient.autres_facteurs_risque.split('Alimentation étudiée:')[1].trim() : patient.autres_facteurs_risque) || 'Non renseigné'}</div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f4c81', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>👨‍👩‍👧‍👦 Antécédents familiaux</div>
                    <div style={{ fontSize: 14, color: '#334155', whiteSpace: 'pre-wrap' }}>{patient.antecedents_familiaux || 'Aucun antécédent renseigné'}</div>
                  </div>

                  {champsDynamiques.filter(c => c.entite === 'habitudes_vie').length > 0 && (
                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0369a1', marginBottom: 12 }}>⚡ Facteurs Dynamiques (Méta-données)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {champsDynamiques.filter(c => c.entite === 'habitudes_vie').map(c => {
                           const val = valeursDynamiques[c.id];
                           return (
                             <div key={c.id} style={{ padding: '10px 14px', background: 'white', borderRadius: 8, border: '1px solid #e0f2fe' }}>
                               <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: 4 }}>{c.nom}</div>
                               <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                                 {c.type_champ === 'booleen' ? (val === 'true' ? 'Oui' : val === 'false' ? 'Non' : '-') : (val || '-')}
                               </div>
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ background: '#f8fafc', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Mettre à jour</div>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Le patient peut scanner ce code pour mettre à jour ses informations.</p>
                  <div style={{ background: 'white', padding: 16, display: 'flex', justifyContent: 'center', borderRadius: 16, border: '2px solid #cbd5e1', marginBottom: 8, width: 192, height: 192 }}>
                    <div style={{ margin: "0 auto", alignSelf: 'center' }}>
                      <QRCodeCanvas size={160} value={`${window.location.origin}/patient-forms/${patient.id}`} level="H" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'cancers' && (
        <div className="card">
          <div className="card-header">
            <h2>Historique des Cancers</h2>
            <Link to={`/cas-cancer/nouveau?patient=${id}`} className="btn btn-primary btn-sm">+ Ajouter</Link>
          </div>
          {!patient.cancer_cases?.length ? (
            <div className="empty-state"><h3>Aucun cas enregistré</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Sous-type</th><th>État</th><th>Stade</th><th>Statut</th><th>Diagnostic</th><th>Actions</th></tr></thead>
                <tbody>
                  {patient.cancer_cases.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-blue">{c.type_cancer}</span></td>
                      <td>{c.sous_type || '-'}</td>
                      <td><span className={etatClass(c.etat)}>{c.etat}</span></td>
                      <td>{c.stade || '-'}</td>
                      <td><span className={statusClass(c.statut_patient)}>{c.statut_patient}</span></td>
                      <td>{c.date_diagnostic ? format(parseISO(c.date_diagnostic), 'dd/MM/yyyy') : '-'}</td>
                      <td>
                        <button className="btn-icon" onClick={() => navigate(`/cas-cancer/${c.id}`)} title="Voir le dossier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'rdv' && (
        <div className="card">
          <div className="card-header"><h2>Historique des Rendez-vous</h2></div>
          {!patient.rendez_vous?.length ? (
            <div className="empty-state"><h3>Aucun rendez-vous</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Motif</th><th>Statut</th><th>Notes</th></tr></thead>
                <tbody>
                  {patient.rendez_vous.map(r => (
                    <tr key={r.id}>
                      <td>{r.date_rdv ? format(new Date(r.date_rdv), 'dd/MM/yyyy HH:mm') : '-'}</td>
                      <td>{r.motif || '-'}</td>
                      <td><span className={r.statut === 'Effectué' ? 'badge badge-green' : r.statut === 'Annulé' ? 'badge badge-red' : 'badge badge-blue'}>{r.statut}</span></td>
                      <td>{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
