import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPatient, getCasesByPatient } from '../utils/api';
import api from '../utils/api';
import { differenceInYears, parseISO, format } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

/* ─── Helpers ─────────────────────────────────────────────── */
const pill = (color, bg, text) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 700,
  color, background: bg, letterSpacing: '0.3px'
});
const STATUS_PILL = {
  'En traitement': pill('#1d4ed8', '#dbeafe', 'En traitement'),
  'Guéri':         pill('#15803d', '#dcfce7', 'Guéri'),
  'Décédé':        pill('#b91c1c', '#fee2e2', 'Décédé'),
};
const ETAT_PILL = {
  'Localisé':   pill('#5b21b6', '#ede9fe', 'Localisé'),
  'Métastase':  pill('#c2410c', '#ffedd5', 'Métastatique'),
};
const INTERP_COLORS = { Normal: '#16a34a', Bas: '#2563eb', Haut: '#d97706', Critique: '#dc2626' };
const GRADE_COLORS  = { 'Grade 1': '#16a34a', 'Grade 2': '#d97706', 'Grade 3': '#ea580c', 'Grade 4': '#dc2626' };

<<<<<<< HEAD
const ANALYSES_CATEGORIES = {
  'Hématologie & Hémostase': ['NFS', 'Frottis sanguin', 'Groupage sanguin', 'VS', 'TP / INR', 'TCA', 'Fibrinogène'],
  'Biochimie & Ionogramme': ['Glycémie', 'Urée', 'Créatinine', 'Sodium (Na)', 'Potassium (K)', 'Calcium (Ca)'],
  'Bilan Hépatique': ['ASAT (TGO)', 'ALAT (TGP)', 'Gamma-GT', 'Bilirubine totale'],
  'Marqueurs Tumoraux': ['ACE', 'CA 15-3', 'CA 125', 'CA 19-9', 'PSA', 'AFP'],
  'Hormonologie & Inflammation': ['TSH', 'CRP', 'Œstradiol', 'Progestérone']
};

=======
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );
}

function EmptyState({ icon, title, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {(title || action) && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</div>}
          {action}
        </div>
      )}
      <div style={{ padding: '0 20px 20px' }}>{children}</div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
>>>>>>> 4554ad2e0cf96f5cae585554676fcd0f8d388821
export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient,  setPatient]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('resume');

  // Data states
  const [cases,    setCases]    = useState([]);
  const [biologie, setBiologie] = useState([]);
  const [anapath,  setAnapath]  = useState([]);
  const [imagerie, setImagerie] = useState([]);
  const [traitements, setTraitements] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [effets,   setEffets]   = useState([]);
  const [champsDyn,setChampsDyn]= useState([]);
  const [valsDyn,  setValsDyn]  = useState({});

  // Form states
  const [showBioForm,  setShowBioForm]  = useState(false);
  const [bioForm,      setBioForm]      = useState({});
  const [aiMessages,   setAiMessages]   = useState([
    { role: 'assistant', text: "👋 Bonjour! Je suis l'Assistant IA OncoTrack. Comment puis-je vous aider à analyser ce dossier?" }
  ]);
  const [aiInput,  setAiInput]  = useState('');
  const [aiLoading,setAiLoading]= useState(false);
  const chatBottom = useRef(null);

  // Selected detail for slide-over
  const [selectedCase,    setSelectedCase]    = useState(null);
  const [selectedAnapath, setSelectedAnapath] = useState(null);
  const [selectedEffect,  setSelectedEffect]  = useState(null);
  const [selectedImgerie, setSelectedImgerie] = useState(null);

  const [labRequests, setLabRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [labos, setLabos] = useState([]);
  const [requestData, setRequestData] = useState({ labo_id: '', analyses_demandees: [], notes_labo: '' });
  const setReq = (k, v) => setRequestData(p => ({ ...p, [k]: v }));

  useEffect(() => {
<<<<<<< HEAD
    getPatient(id).then(r => setPatient(r.data)).catch(() => navigate('/patients')).finally(() => setLoading(false));
    api.get('/champs-dynamiques').then(r => setChampsDynamiques(r.data)).catch(() => {});
    api.get(`/valeurs-dynamiques/${id}`).then(r => {
      const vals = {};
      r.data.forEach(v => vals[v.champ_id] = v.valeur);
      setValeursDynamiques(vals);
    }).catch(() => {});
    api.get(`/biologie/patient/${id}`).then(r => setBiologie(r.data)).catch(()=>{});
    api.get(`/lab-requests/patient/${id}`).then(r => setLabRequests(r.data)).catch(()=>{});
    api.get('/users/role/laboratoire').then(r => setLabos(r.data)).catch(()=>{});
=======
    setLoading(true);
    Promise.all([
      getPatient(id),
      api.get(`/cases/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/biologie/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/anapath/case`).catch(() => ({ data: [] })),
      api.get(`/imagerie/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/traitements/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/consultations/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/effets-secondaires/patient/${id}`).catch(() => ({ data: [] })),
      api.get('/champs-dynamiques').catch(() => ({ data: [] })),
      api.get(`/valeurs-dynamiques/${id}`).catch(() => ({ data: [] })),
    ]).then(([pRes, casRes, bioRes, anRes, imgRes, trRes, consultRes, effRes, chRes, vRes]) => {
      setPatient(pRes.data);
      setCases(Array.isArray(casRes.data) ? casRes.data : casRes.data?.cases || []);
      setBiologie(Array.isArray(bioRes.data) ? bioRes.data : []);
      setAnapath(Array.isArray(anRes.data) ? anRes.data : []);
      setImagerie(Array.isArray(imgRes.data) ? imgRes.data : []);
      setTraitements(Array.isArray(trRes.data) ? trRes.data : []);
      setConsultations(Array.isArray(consultRes.data) ? consultRes.data : []);
      setEffets(Array.isArray(effRes.data) ? effRes.data : []);
      setChampsDyn(Array.isArray(chRes.data) ? chRes.data : []);
      const vv = {};
      (Array.isArray(vRes.data) ? vRes.data : []).forEach(v => (vv[v.champ_id] = v.valeur));
      setValsDyn(vv);
    }).catch(() => navigate('/patients')).finally(() => setLoading(false));
>>>>>>> 4554ad2e0cf96f5cae585554676fcd0f8d388821
  }, [id, navigate]);

  // also load cancer_cases from patient object directly if API endpoint missing
  useEffect(() => {
    if (patient?.cancer_cases?.length && cases.length === 0) {
      setCases(patient.cancer_cases);
    }
  }, [patient, cases.length]);

  useEffect(() => {
    if (chatBottom.current) chatBottom.current.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  if (loading) return <Layout title="Fiche Patient"><div className="loading-center"><div className="spinner" /></div></Layout>;
  if (!patient) return null;

  const age = patient.date_naissance
    ? differenceInYears(new Date(), parseISO(patient.date_naissance))
    : '—';
  const initials = `${(patient.prenom || ' ')[0]}${(patient.nom || ' ')[0]}`.toUpperCase();
  const mainCase = (patient.cancer_cases || cases)[0];
  const dossierNum = `ONC-${new Date(patient.created_at || Date.now()).getFullYear()}-${String(patient.id || '').slice(-3).toUpperCase().padStart(3, '0')}`;

  /* ── AI Chat ── */
  const handleAiSend = async (e, presetMsg) => {
    if (e) e.preventDefault();
    const msg = presetMsg || aiInput.trim();
    if (!msg) return;
    setAiMessages(prev => [...prev, { role: 'user', text: msg }]);
    setAiInput('');
    setAiLoading(true);
    try {
      const patientCtx = `Patient: ${patient.prenom} ${patient.nom}, ${age} ans, ${patient.sexe === 'M' ? 'Homme' : 'Femme'}. `
        + (mainCase ? `Cancer: ${mainCase.type_cancer || mainCase.sous_type || ''}, Stade: ${mainCase.stade || 'inconnu'}. ` : '')
        + `Antécédents: ${patient.antecedents_medicaux || 'non renseigné'}. `
        + `Traitements actifs: ${(patient.cancer_cases || cases).flatMap(c => c.traitements || []).filter(t => t.statut === 'En cours').map(t => t.protocole).join(', ') || 'aucun'}.`;
      const res = await api.post('/chat-ia', { message: msg, context: patientCtx });
      const reply = res.data?.reply || res.data?.message || 'Aucune réponse reçue.';
      setAiMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Erreur de connexion à l\'assistant IA.';
      setAiMessages(prev => [...prev, { role: 'assistant', text: `❌ ${errMsg}` }]);
    } finally {
      setAiLoading(false);
    }
  };

<<<<<<< HEAD
  const handleRequestLab = async () => {
    try {
      if (!requestData.labo_id) return toast.error('Veuillez sélectionner un laborantin');
      let analysesArray = requestData.analyses_demandees;
      if (typeof analysesArray === 'string') {
        analysesArray = analysesArray.split(',').map(a => a.trim()).filter(a => a);
      }
      if (analysesArray.length === 0) return toast.error('Veuillez spécifier les analyses');
      
      const payload = {
         patient_id: id,
         labo_id: requestData.labo_id,
         analyses_demandees: analysesArray,
         notes_labo: requestData.notes_labo
      };
      
      await api.post('/lab-requests', payload);
      toast.success('Demande envoyée au laboratoire !');
      setShowRequestForm(false);
      setRequestData({ labo_id: '', analyses_demandees: [], notes_labo: '' });
      api.get(`/lab-requests/patient/${id}`).then(r => setLabRequests(r.data)).catch(()=>{});
    } catch(e) { toast.error('Erreur: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDeleteBiologie = async (bId) => {
    if(!window.confirm('Supprimer cette analyse ?')) return;
    await api.delete(`/biologie/${bId}`);
    toast.success('Supprimé');
    api.get(`/biologie/patient/${id}`).then(r => setBiologie(r.data)).catch(()=>{});
=======
  /* ── Biologie add ── */
  const handleAddBio = async () => {
    try {
      await api.post('/biologie', { ...bioForm, patient_id: id });
      toast.success('Analyse ajoutée');
      setShowBioForm(false);
      setBioForm({});
      api.get(`/biologie/patient/${id}`).then(r => setBiologie(r.data || [])).catch(() => {});
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
>>>>>>> 4554ad2e0cf96f5cae585554676fcd0f8d388821
  };

  const TABS = [
    { key: 'resume',      label: 'Résumé' },
    { key: 'diagnostic',  label: `Diagnostic (${(patient.cancer_cases || cases).length})` },
    { key: 'anapath',     label: 'Anapath' },
    { key: 'biologie',    label: `Biologie (${biologie.length})` },
    { key: 'imagerie',    label: 'Imagerie' },
    { key: 'traitement',  label: 'Traitement' },
    { key: 'consultations', label: 'Consultations' },
    { key: 'effets',      label: 'Effets secondaires' },
    { key: 'ia',          label: '🤖 Assistant IA' },
  ];

  /* ═══════════════════════════════════════════════════════ */
  return (
    <Layout title="Fiche Patient">

      {/* ── Top action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={() => navigate('/patients')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#475569', padding: '4px 8px' }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, fontFamily: 'Outfit', color: '#0f172a' }}>
            {patient.prenom} {patient.nom}
          </h1>
          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{dossierNum}</div>
        </div>
        <Link to={`/patients/${id}/modifier`}
          style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            background: 'white', border: '1px solid #e2e8f0', color: '#475569', textDecoration: 'none' }}>
          Modifier
        </Link>
      </div>

      {/* ── Patient header card ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, position: 'relative' }}>
          {[
            {
              label: 'Sexe / Âge',
              value: `${patient.sexe === 'M' ? 'Homme' : 'Femme'} · ${age} ans`
            },
            {
              label: 'Type Cancer',
              value: mainCase
                ? `${mainCase.type_cancer || mainCase.sous_type || '—'} — ${mainCase.stade || '—'}`
                : 'Aucun diagnostic'
            },
            {
              label: 'Téléphone',
              value: patient.telephone || '—'
            },
            {
              label: 'Admission',
              value: patient.date_naissance
                ? format(parseISO(patient.date_naissance), 'yyyy-MM-dd')
                : '—'
            },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '0 24px',
              borderLeft: i === 0 ? 'none' : '1px solid #f1f5f9'
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Informations</button>
        <button className={`tab ${tab === 'styles_vie' ? 'active' : ''}`} onClick={() => setTab('styles_vie')}>Styles de Vie</button>
        <button className={`tab ${tab === 'cancers' ? 'active' : ''}`} onClick={() => setTab('cancers')}>Cancers ({patient.cancer_cases?.length || 0})</button>
        <button className={`tab ${tab === 'rdv' ? 'active' : ''}`} onClick={() => setTab('rdv')}>Rendez-vous ({patient.rendez_vous?.length || 0})</button>
=======
      {/* ── Horizontal tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 18px', fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? '#2563eb' : '#64748b',
              borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2, whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}>
            {t.label}
          </button>
        ))}
>>>>>>> 4554ad2e0cf96f5cae585554676fcd0f8d388821
      </div>

      {/* ════════════════════ TAB CONTENT ════════════════════ */}

      {/* ── RÉSUMÉ ── */}
      {tab === 'resume' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <SectionCard title="Informations Générales">
            <InfoRow label="Nom complet"        value={`${patient.prenom} ${patient.nom}`} />
            <InfoRow label="Date de naissance"  value={patient.date_naissance ? format(parseISO(patient.date_naissance), 'yyyy-MM-dd') : null} />
            <InfoRow label="Email"              value={patient.email} />
            <InfoRow label="Médecin responsable" value={patient.medecin_traitant_nom || (mainCase?.medecin_nom ? `Dr. ${mainCase.medecin_nom}` : null)} />
            <InfoRow label="Wilaya"             value={patient.wilaya} />
            <InfoRow label="Téléphone"          value={patient.telephone} />
            <InfoRow label="Carte Nationale"    value={patient.num_carte_nationale} />
            <InfoRow label="Statut" value={
              mainCase?.statut_patient
                ? <span style={STATUS_PILL[mainCase.statut_patient] || pill('#475569','#f1f5f9')}>{mainCase.statut_patient}</span>
                : '—'
            } />
            {champsDyn.filter(c => c.entite === 'patient').map(c => (
              <InfoRow key={c.id} label={c.nom}
                value={valsDyn[c.id] || '—'} />
            ))}
          </SectionCard>

          <SectionCard title="Antécédents">
            <InfoRow label="Médicaux"   value={patient.antecedents_medicaux} />
            <InfoRow label="Familiaux"  value={patient.antecedents_familiaux} />
            <InfoRow label="Allergies"  value={patient.allergies} />
            <InfoRow label="Tabac"      value={patient.fumeur ? 'Fumeur actif' : 'Non fumeur'} />
            <InfoRow label="Alcool"     value={patient.alcool ? 'Consommateur' : 'Non'} />
            <InfoRow label="Sport"      value={patient.activite_sportive ? 'Actif' : 'Sédentaire'} />
            {patient.autres_facteurs_risque && (
              <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Autres facteurs de risque</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{patient.autres_facteurs_risque}</div>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── DIAGNOSTIC ── */}
      {tab === 'diagnostic' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Link to={`/cas-cancer/nouveau?patient=${id}`}
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', textDecoration: 'none' }}>
              + Nouveau Diagnostic
            </Link>
          </div>
          {(patient.cancer_cases || cases).length === 0
            ? <EmptyState icon="🔬" title="Aucun diagnostic enregistré" message="Cliquez sur '+ Nouveau Diagnostic' pour ajouter un dossier oncologique." />
            : (patient.cancer_cases || cases).map(c => (
              <div key={c.id}
                onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}
                style={{ background: 'white', borderRadius: 12, border: `1px solid ${selectedCase?.id === c.id ? '#3b82f6' : '#e2e8f0'}`,
                  padding: '18px 20px', marginBottom: 12, cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {c.type_cancer && <span style={pill('#1d4ed8','#dbeafe')}>{c.type_cancer}</span>}
                      {c.sous_type   && <span style={pill('#5b21b6','#ede9fe')}>{c.sous_type}</span>}
                      {c.stade       && <span style={pill('#0f172a','#f1f5f9')}>{c.stade}</span>}
                      {c.etat        && <span style={ETAT_PILL[c.etat] || pill('#475569','#f1f5f9')}>{c.etat}</span>}
                      {c.statut_patient && <span style={STATUS_PILL[c.statut_patient] || pill('#475569','#f1f5f9')}>{c.statut_patient}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {c.localisation && <span>📍 {c.localisation} · </span>}
                      {c.date_diagnostic && <span>📅 {format(parseISO(c.date_diagnostic), 'dd/MM/yyyy')}</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); navigate(`/cas-cancer/${c.id}`); }}
                    style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                      background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#475569' }}>
                    Voir le dossier →
                  </button>
                </div>

                {selectedCase?.id === c.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9',
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      ['Type histologique',   c.type_histologique],
                      ['Grade',               c.grade_histologique],
                      ['TNM — T',             c.tnm_t],
                      ['N',                   c.tnm_n],
                      ['M',                   c.tnm_m],
                      ['Code CIM-10',         c.code_cim10],
                      ['Latéralité',          c.lateralite],
                      ['Base diagnostic',     c.base_diagnostic],
                      ['Anomalies génétiques',c.anomalies_genetiques],
                      ['Taille (cm)',         c.taille_cancer],
                      ['Ganglions envahis',   c.nb_ganglions_envahis],
                      ['Sites métastatiques', c.sites_metastatiques],
                      ['Récepteur ER',        c.recepteur_er],
                      ['Récepteur PR',        c.recepteur_pr],
                      ['HER2',                c.her2],
                    ].filter(([,v]) => v).map(([label, val]) => (
                      <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{val}</div>
                      </div>
                    ))}
                    {c.rapport_anatomopathologique && (
                      <div style={{ gridColumn: '1 / -1', background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Notes cliniques</div>
                        <div style={{ fontSize: 13, color: '#334155' }}>{c.rapport_anatomopathologique}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* ── ANAPATH ── */}
      {tab === 'anapath' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
              + Nouveau résultat Anapath
            </button>
          </div>
          {anapath.length === 0 && patient.cancer_cases?.some(c => c.anapath)
            ? patient.cancer_cases.filter(c => c.anapath).map(c => {
              const a = c.anapath;
              return (
                <div key={c.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
                  padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{patient.prenom} {patient.nom}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {a.type_histologique && <span style={pill('#1d4ed8','#dbeafe')}>{a.type_histologique?.slice(0,30)}</span>}
                        {a.grade_sbr && <span style={pill('#5b21b6','#ede9fe')}>Grade {a.grade_sbr}</span>}
                        {a.er === 'Positif' && <span style={pill('#15803d','#dcfce7')}>ER+</span>}
                        {a.pr === 'Positif' && <span style={pill('#0369a1','#e0f2fe')}>PR+</span>}
                        {a.her2 === 'Positif' && <span style={pill('#b45309','#fef3c7')}>HER2+</span>}
                        {a.ki67 && <span style={pill('#6b21a8','#f5f3ff')}>Ki-67: {a.ki67}</span>}
                        {a.pd_l1 && <span style={pill('#475569','#f1f5f9')}>PD-L1: {a.pd_l1}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                      <div>{a.date_prelevement ? format(parseISO(a.date_prelevement), 'dd/MM/yyyy') : '—'}</div>
                      <div style={{ marginTop: 2 }}>{a.type_prelevement}</div>
                      <div style={{ marginTop: 2, fontWeight: 600, color: '#475569' }}>{a.pathologiste}</div>
                    </div>
                  </div>
                  {a.compte_rendu && (
                    <div style={{ fontSize: 13, color: '#475569', fontStyle: 'italic',
                      background: '#f8fafc', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #3b82f6' }}>
                      {a.compte_rendu}
                    </div>
                  )}
                  {a.mmr_msi && (
                    <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>MMR/MSI: <strong>{a.mmr_msi}</strong></div>
                  )}
                </div>
              );
            })
            : <EmptyState icon="🧫" title="Aucun résultat anatomopathologique" message="Les résultats d'anapath liés aux dossiers oncologiques apparaissent ici." />
          }
        </div>
      )}

<<<<<<< HEAD
      {tab === 'analyses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Section Demandes au labo */}
        <div className="card" style={{ border: '2px solid #bae6fd'}}>
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
                                const active = e.target.checked;
                                setReq('analyses_demandees', active ? [...requestData.analyses_demandees, item] : requestData.analyses_demandees.filter(a => a !== item));
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
             {labRequests.length === 0 ? <p style={{color: '#64748b'}}>Aucune demande d'analyses en cours.</p> : (
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                 <thead><tr style={{ background: '#f1f5f9' }}>
                   {['Date','Laborantin','Analyses','Notes','Statut','Résultat PDF'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{h}</th>)}
                 </tr></thead>
                 <tbody>
                   {labRequests.map((r, i) => {
                     let anals = [];
                     try { anals = typeof r.analyses_demandees === 'string' ? JSON.parse(r.analyses_demandees) : r.analyses_demandees; } catch(e){}
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
                            {r.fichier_pdf ? (
                              <a href={`http://localhost:5000${r.fichier_pdf}`} target="_blank" rel="noreferrer" style={{color: '#0284c7', fontWeight: 600}}>📄 Voir PDF</a>
                            ) : (
                              <span style={{color: '#94a3b8'}}>-</span>
                            )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>🧪 Résultats d'Analyses Saisis ({biologie.length})</h2>
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(!showForm)}>+ Saisie Manuelle</button>
=======
      {/* ── BIOLOGIE ── */}
      {tab === 'biologie' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => setShowBioForm(!showBioForm)}
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
              + Nouvelle analyse
            </button>
>>>>>>> 4554ad2e0cf96f5cae585554676fcd0f8d388821
          </div>
          {showBioForm && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  { label: 'Date', key: 'date_examen', type: 'date' },
                  { label: 'Paramètre', key: 'parametre', placeholder: 'Ex: Hémoglobine' },
                  { label: 'Valeur', key: 'valeur', placeholder: '12.5' },
                  { label: 'Unité', key: 'unite', placeholder: 'g/dL' },
                  { label: 'Valeur normale', key: 'valeur_normale', placeholder: '12-16 g/dL' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type || 'text'} placeholder={f.placeholder} className="form-control"
                      value={bioForm[f.key] || ''} onChange={e => setBioForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Type examen</label>
                  <select className="form-control" value={bioForm.type_examen || ''} onChange={e => setBioForm(p => ({ ...p, type_examen: e.target.value }))}>
                    {['NFS','Biochimie','Marqueurs tumoraux','Coagulation','Ionogramme','Autre'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Interprétation</label>
                  <select className="form-control" value={bioForm.interpretation || 'Normal'} onChange={e => setBioForm(p => ({ ...p, interpretation: e.target.value }))}>
                    {['Normal','Bas','Haut','Critique'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleAddBio}
                  style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                    background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
                  Enregistrer
                </button>
                <button onClick={() => setShowBioForm(false)}
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                    background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#475569' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {biologie.length >= 2 && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📈 Évolution des paramètres</div>
              <Line data={{
                labels: [...new Set(biologie.map(b => b.date_examen?.slice(0,10)))].sort(),
                datasets: [...new Set(biologie.map(b => b.parametre))].slice(0,3).map((p, i) => ({
                  label: p,
                  data: biologie.filter(b => b.parametre === p).map(b => parseFloat(b.valeur)).filter(v => !isNaN(v)),
                  borderColor: ['#3b82f6','#e63946','#22c55e'][i],
                  backgroundColor: ['#3b82f622','#e6394622','#22c55e22'][i],
                  tension: 0.4, fill: false
                }))
              }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } } } }} />
            </div>
          )}

          {biologie.length === 0
            ? <EmptyState icon="🧪" title="Aucune analyse biologique" message="Cliquez sur '+ Nouvelle analyse' pour ajouter des résultats." />
            : (
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Date','Type','Paramètre','Valeur','Unité','Référence','Statut',''].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                          color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px',
                          borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {biologie.map((b, i) => (
                      <tr key={b.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                        <td style={{ padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>{b.date_examen?.slice(0,10)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{b.type_examen}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{b.parametre}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', borderBottom: '1px solid #f1f5f9' }}>{b.valeur}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{b.unite}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{b.valeur_normale}</td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: (INTERP_COLORS[b.interpretation] || '#64748b') + '22',
                            color: INTERP_COLORS[b.interpretation] || '#64748b' }}>
                            {b.interpretation}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                          <button onClick={() => { if(window.confirm('Supprimer?')) api.delete(`/biologie/${b.id}`).then(() => { toast.success('Supprimé'); api.get(`/biologie/patient/${id}`).then(r => setBiologie(r.data || [])); }); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* ── IMAGERIE ── */}
      {tab === 'imagerie' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
              + Nouvelle imagerie
            </button>
          </div>
          {(() => {
            const imgs = imagerie.length > 0 ? imagerie 
              : patient.cancer_cases?.flatMap(c => c.imagerie || []) || [];
            return imgs.length === 0
              ? <EmptyState icon="🖼️" title="Aucune imagerie" message="Les résultats d'imagerie (Scanner, IRM, PET) apparaissent ici." />
              : imgs.map((img, i) => (
                <div key={img.id || i} onClick={() => setSelectedImgerie(selectedImgerie?.id === img.id ? null : img)}
                  style={{ background: 'white', borderRadius: 12, border: `1px solid ${selectedImgerie?.id === img.id ? '#3b82f6' : '#e2e8f0'}`,
                    padding: '18px 20px', marginBottom: 12, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span style={pill('#0369a1','#e0f2fe')}>{img.type_examen}</span>
                        {img.region && <span style={pill('#475569','#f1f5f9')}>{img.region}</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{img.conclusion}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{img.date_examen ? format(parseISO(img.date_examen), 'dd/MM/yyyy') : '—'}</div>
                    </div>
                  </div>
                  {selectedImgerie?.id === img.id && img.resultat_resume && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9',
                      fontSize: 13, color: '#475569', background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                      {img.resultat_resume}
                    </div>
                  )}
                </div>
              ));
          })()}
        </div>
      )}

      {/* ── TRAITEMENT ── */}
      {tab === 'traitement' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
              + Nouveau traitement
            </button>
          </div>
          {(() => {
            const treats = traitements.length > 0 ? traitements
              : patient.cancer_cases?.flatMap(c => c.traitements || []) || [];
            return treats.length === 0
              ? <EmptyState icon="💊" title="Aucun traitement enregistré" message="Les protocoles de traitement (chimio, radio, chirurgie) apparaissent ici." />
              : treats.map((t, i) => {
                const statutStyle = { 'En cours': pill('#15803d','#dcfce7'), 'Terminé': pill('#475569','#f1f5f9'), 'Abandonné': pill('#b91c1c','#fee2e2'), 'Suspendu': pill('#d97706','#fef3c7') };
                return (
                  <div key={t.id || i} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
                    padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{t.protocole}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={pill('#1d4ed8','#dbeafe')}>{t.type_traitement}</span>
                          {t.statut && <span style={statutStyle[t.statut] || pill('#475569','#f1f5f9')}>{t.statut}</span>}
                          {t.intention_therapeutique && <span style={pill('#0369a1','#e0f2fe')}>{t.intention_therapeutique}</span>}
                          {t.ligne_traitement && <span style={pill('#6b21a8','#f5f3ff')}>Ligne {t.ligne_traitement}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {t.date_debut && `📅 ${format(parseISO(t.date_debut), 'dd/MM/yyyy')}`}
                          {t.date_fin && ` → ${format(parseISO(t.date_fin), 'dd/MM/yyyy')}`}
                          {t.cycles_realises && ` · ${t.cycles_realises}/${t.nb_cycles_prevus || '?'} cycles`}
                        </div>
                      </div>
                    </div>
                    {t.medicaments && (
                      <div style={{ marginTop: 10, fontSize: 13, color: '#475569',
                        background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                        💊 {t.medicaments}
                      </div>
                    )}
                    {t.resultat && (
                      <div style={{ marginTop: 8, fontSize: 13, color: '#475569', fontStyle: 'italic' }}>
                        📋 {t.resultat}
                      </div>
                    )}
                  </div>
                );
              });
          })()}
        </div>
      )}

      {/* ── CONSULTATIONS ── */}
      {tab === 'consultations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
              + Nouvelle consultation
            </button>
          </div>
          {(() => {
            const rdvs = consultations.length > 0 ? consultations : patient.rendez_vous || [];
            return rdvs.length === 0
              ? <EmptyState icon="📅" title="Aucune consultation" message="Les rendez-vous et consultations apparaissent ici." />
              : rdvs.map((r, i) => (
                <div key={r.id || i} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
                  padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{r.motif || 'Consultation'}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={pill('#475569','#f1f5f9')}>{r.date_rdv ? format(new Date(r.date_rdv), 'dd/MM/yyyy HH:mm') : '—'}</span>
                        {r.statut && <span style={{ ...pill(r.statut==='Effectué'?'#15803d':r.statut==='Annulé'?'#b91c1c':'#1d4ed8', r.statut==='Effectué'?'#dcfce7':r.statut==='Annulé'?'#fee2e2':'#dbeafe') }}>{r.statut}</span>}
                      </div>
                    </div>
                  </div>
                  {r.notes && <div style={{ marginTop: 10, fontSize: 13, color: '#475569', fontStyle: 'italic' }}>{r.notes}</div>}
                </div>
              ));
          })()}
        </div>
      )}

      {/* ── EFFETS SECONDAIRES ── */}
      {tab === 'effets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
              + Signaler effet secondaire
            </button>
          </div>
          {(() => {
            const eff = effets.length > 0 ? effets
              : patient.cancer_cases?.flatMap(c => c.effets_secondaires || []) || [];
            return eff.length === 0
              ? <EmptyState icon="⚠️" title="Aucun effet secondaire signalé" message="Les effets secondaires des traitements apparaissent ici." />
              : eff.map((e, i) => (
                <div key={e.id || i}
                  onClick={() => setSelectedEffect(selectedEffect?.id === e.id ? null : e)}
                  style={{ background: 'white', borderRadius: 12, border: `1px solid ${selectedEffect?.id === e.id ? '#3b82f6' : '#e2e8f0'}`,
                    padding: '18px 20px', marginBottom: 12, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{e.type_effet}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {e.grade && <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: (GRADE_COLORS[e.grade] || '#64748b') + '22', color: GRADE_COLORS[e.grade] || '#64748b' }}>{e.grade}</span>}
                        <span style={pill(e.resolu ? '#15803d' : '#d97706', e.resolu ? '#dcfce7' : '#fef3c7')}>{e.resolu ? 'Résolu' : 'En cours'}</span>
                        {e.date_apparition && <span style={pill('#475569','#f1f5f9')}>📅 {format(parseISO(e.date_apparition), 'dd/MM/yyyy')}</span>}
                      </div>
                    </div>
                  </div>
                  {selectedEffect?.id === e.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      {e.description && <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{e.description}</div>}
                      {e.traitement_pris && (
                        <div style={{ fontSize: 13, color: '#334155', background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                          💊 Traitement: {e.traitement_pris}
                        </div>
                      )}
                      {e.date_resolution && <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Résolu le: {format(parseISO(e.date_resolution), 'dd/MM/yyyy')}</div>}
                    </div>
                  )}
                </div>
              ));
          })()}
        </div>
      )}

      {/* ── ASSISTANT IA ── */}
      {tab === 'ia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Preset questions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {["Résumer le dossier patient", "Proposer un protocole adapté", "Analyser les derniers résultats biologie", "Quelles sont les options thérapeutiques ?"].map(q => (
              <button key={q} onClick={() => handleAiSend(null, q)}
                style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 20,
                  background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#475569' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Chat window */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column', height: 480 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aiMessages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  {m.role === 'assistant' && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, marginLeft: 4 }}>OncoTrack IA</div>
                  )}
                  <div style={{ padding: '10px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : '#f8fafc',
                    color: m.role === 'user' ? 'white' : '#334155',
                    border: m.role !== 'user' ? '1px solid #e2e8f0' : 'none',
                    fontSize: 13, lineHeight: 1.6 }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 16px', background: '#f8fafc',
                  borderRadius: '16px 16px 16px 4px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8',
                      animation: `bounce 1s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={chatBottom} />
            </div>
            <form onSubmit={handleAiSend}
              style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Posez une question sur ce patient..."
                style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1px solid #e2e8f0',
                  fontSize: 13, outline: 'none', fontFamily: 'Inter' }} />
              <button type="submit" disabled={aiLoading || !aiInput.trim()}
                style={{ padding: '10px 20px', borderRadius: 24, background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: aiLoading || !aiInput.trim() ? 0.5 : 1 }}>
                Envoyer
              </button>
            </form>
          </div>
        </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </Layout>
  );
}
