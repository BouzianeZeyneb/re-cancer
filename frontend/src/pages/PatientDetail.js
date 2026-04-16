import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );
}

function EmptyState({ icon, title, message, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, marginBottom: action ? 20 : 0 }}>{message}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

function SectionCard({ title, children, action, style = {} }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #eef2f6',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden', ...style }}>
      {(title || action) && (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit' }}>{title}</div>}
          {action}
        </div>
      )}
      <div style={{ padding: '0 24px 24px' }}>{children}</div>
    </div>
  );
}

const ClinicalTableRow = ({ label, value, last }) => (
  <div style={{ 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '12px 0', borderBottom: last ? 'none' : '1px solid #f1f5f9',
    gap: 16
  }}>
    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', textAlign: 'right', wordBreak: 'break-word' }}>{value || '—'}</span>
  </div>
);

const ClinicalAbstract = ({ patient, mainCase, age }) => {
  const hasRisk = patient.consommation_tabac || patient.consommation_alcool;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Profil Oncologique</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#7f1d1d' }}>{mainCase?.stade || 'Stade —'}</div>
        <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 4 }}>TNM: {mainCase?.tnm_t || 'T'}{mainCase?.tnm_n || 'N'}{mainCase?.tnm_m || 'M'}</div>
      </div>
      <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#075985', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Standard ICD-O-3</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>{mainCase?.topographie_icdo3 || 'C—'} (Topographie)</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1', marginTop: 4 }}>{mainCase?.morphologie_icdo3 || 'M—'} (Morphologie)</div>
      </div>
      <div style={{ background: hasRisk ? '#fff7ed' : '#f0fdf4', border: hasRisk ? '1px solid #ffedd5' : '1px solid #dcfce7', borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 11, color: hasRisk ? '#9a3412' : '#166534', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Facteurs de Risque</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {patient.consommation_tabac && <span title="Tabac" style={{ fontSize: 20 }}>🚬</span>}
          {patient.consommation_alcool && <span title="Alcool" style={{ fontSize: 20 }}>🍷</span>}
          {!hasRisk && <span style={{ fontSize: 13, color: '#15803d', fontWeight: 700 }}>Profil Faible Risque</span>}
        </div>
      </div>
    </div>
  );
};

const CycleBar = ({ total, completed }) => {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ 
          width: 48, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', 
          justifyContent: 'center', fontSize: 11, fontWeight: 700,
          background: i < completed ? '#dcfce7' : '#f1f5f9',
          color: i < completed ? '#15803d' : '#94a3b8',
          border: i < completed ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
          transition: 'all 0.2s'
        }}>
          C{i + 1}
        </div>
      ))}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────── */
export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [patient,  setPatient]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('resume');

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const confirmDelete = async (hardDelete) => {
    try {
      await api.delete(`/patients/${id}${hardDelete ? '?hardDelete=true' : ''}`);
      toast.success(hardDelete ? 'Patient supprimé définitivement de la base de données' : 'Patient archivé avec succès');
      navigate('/patients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setShowDeleteModal(false);
    }
  };

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
  const [documents,setDocuments] = useState([]);

  // Modal visibility states
  const [showTraitementModal, setShowTraitementModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAnapathModal, setShowAnapathModal] = useState(false);
  const [showImagerieModal, setShowImagerieModal] = useState(false);
  const [showEffetsModal, setShowEffetsModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showBiologieModal, setShowBiologieModal] = useState(false);

  // Form states
  const [traitementForm, setTraitementForm] = useState({ type_traitement: 'Chimiothérapie', statut: 'En cours', nb_cycles_prevus: 1 });
  const [consultationForm, setConsultationForm] = useState({ date_consultation: new Date().toISOString().slice(0, 10) });
  const [anapathForm, setAnapathForm] = useState({ date_prelevement: new Date().toISOString().slice(0, 10), grade_sbr: 'Grade 1' });
  const [imagerieForm, setImagerieForm] = useState({ date_examen: new Date().toISOString().slice(0, 10), type_examen: 'Scanner' });
  const [effetsForm, setEffetsForm] = useState({ date_apparition: new Date().toISOString().slice(0, 10), grade: 'Grade 1' });
  const [documentForm, setDocumentForm] = useState({ date_doc: new Date().toISOString().slice(0, 10), categorie: 'Compte-rendu' });
  const [showBioForm,  setShowBioForm]  = useState(false);
  const [bioForm,      setBioForm]      = useState({});
  const [aiMessages,   setAiMessages]   = useState([
    { role: 'assistant', text: "👋 Bonjour! Je suis l'Assistant IA OncoTrack. Comment puis-je vous aider à analyser ce dossier?" }
  ]);
  const [aiInput,  setAiInput]  = useState('');
  const [aiLoading,setAiLoading]= useState(false);
  const chatBottom = useRef(null);
  const bioFormRef = useRef(null);

  useEffect(() => {
    if (showBioForm && bioFormRef.current) {
      bioFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showBioForm]);

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
    setLoading(true);
    Promise.all([
      getPatient(id),
      api.get(`/cases/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/biologie/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/lab-requests/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/anapath/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/imagerie/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/traitements/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/consultations/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/effets-secondaires/patient/${id}`).catch(() => ({ data: [] })),
      api.get('/champs-dynamiques').catch(() => ({ data: [] })),
      api.get(`/valeurs-dynamiques/${id}`).catch(() => ({ data: [] })),
      api.get('/users/role/laboratoire').catch(() => ({ data: [] })),
      api.get(`/documents/patient/${id}`).catch(() => ({ data: [] })),
    ]).then(([pRes, casRes, bioRes, labRes, anRes, imgRes, trRes, consultRes, effRes, chRes, vRes, lboRes, docRes]) => {
      setPatient(pRes.data);
      setCases(Array.isArray(casRes.data) ? casRes.data : casRes.data?.cases || []);
      setBiologie(Array.isArray(bioRes.data) ? bioRes.data : []);
      setLabRequests(Array.isArray(labRes.data) ? labRes.data : []);
      setAnapath(Array.isArray(anRes.data) ? anRes.data : []);
      setImagerie(Array.isArray(imgRes.data) ? imgRes.data : []);
      setTraitements(Array.isArray(trRes.data) ? trRes.data : []);
      setConsultations(Array.isArray(consultRes.data) ? consultRes.data : []);
      setEffets(Array.isArray(effRes.data) ? effRes.data : []);
      setChampsDyn(Array.isArray(chRes.data) ? chRes.data : []);
      setLabos(Array.isArray(lboRes.data) ? lboRes.data : []);
      setDocuments(Array.isArray(docRes.data) ? docRes.data : []);
      const vv = {};
      (Array.isArray(vRes.data) ? vRes.data : []).forEach(v => (vv[v.champ_id] = v.valeur));
      setValsDyn(vv);
    }).catch(() => navigate('/patients')).finally(() => setLoading(false));
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
  };

  /* ── Biologie add ── */
  const handleSaveBiologie = async () => {
    try {
      if (!bioForm.date_examen || !bioForm.parametre || !bioForm.valeur) {
        return toast.error("Veuillez remplir les champs obligatoires (Date, Paramètre, Valeur)");
      }
      await api.post('/biologie', { ...bioForm, patient_id: id });
      toast.success('Résultat d\'analyse ajouté');
      setShowBiologieModal(false);
      setBioForm({ date_examen: new Date().toISOString().slice(0, 10), interpretation: 'Normal' });
      api.get(`/biologie/patient/${id}`).then(r => setBiologie(r.data));
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const handleSaveTraitement = async () => {
    try {
      const caseId = (patient.cancer_cases || cases)[0]?.id;
      if (!caseId) return toast.error("Veuillez d'abord créer un dossier diagnostic.");
      await api.post('/traitements', { ...traitementForm, case_id: caseId });
      toast.success('Traitement ajouté');
      setShowTraitementModal(false);
      api.get(`/traitements/patient/${id}`).then(r => setTraitements(r.data));
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const handleSaveConsultation = async () => {
    try {
      const caseId = (patient.cancer_cases || cases)[0]?.id;
      if (!caseId) return toast.error("Veuillez d'abord créer un dossier diagnostic.");
      await api.post('/consultations', { ...consultationForm, case_id: caseId });
      toast.success('Consultation ajoutée');
      setShowConsultationModal(false);
      api.get(`/consultations/patient/${id}`).then(r => setConsultations(r.data));
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const handleSaveAnapath = async () => {
    try {
      const caseId = (patient.cancer_cases || cases)[0]?.id;
      if (!caseId) return toast.error("Veuillez d'abord créer un dossier diagnostic.");
      await api.post('/anapath', { ...anapathForm, case_id: caseId });
      toast.success('Résultat Anapath ajouté');
      setShowAnapathModal(false);
      api.get(`/anapath/patient/${id}`).then(r => setAnapath(r.data));
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const handleSaveImagerie = async () => {
    try {
      const caseId = (patient.cancer_cases || cases)[0]?.id;
      if (!caseId) return toast.error("Veuillez d'abord créer un dossier diagnostic.");
      await api.post('/imagerie', { ...imagerieForm, case_id: caseId });
      toast.success('Imagerie ajoutée');
      setShowImagerieModal(false);
      api.get(`/imagerie/patient/${id}`).then(r => setImagerie(r.data));
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const handleSaveEffets = async () => {
    try {
      const caseId = (patient.cancer_cases || cases)[0]?.id;
      if (!caseId) return toast.error("Veuillez d'abord créer un dossier diagnostic.");
      await api.post('/effets-secondaires', { ...effetsForm, case_id: caseId });
      toast.success('Effet secondaire signalé');
      setShowEffetsModal(false);
      api.get(`/effets-secondaires/patient/${id}`).then(r => setEffets(r.data));
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const handleSaveDocument = async () => {
    try {
      // In a real app we'd use FormData for file upload, but keeping it simple for now
      await api.post('/documents', { ...documentForm, patient_id: id });
      toast.success('Document ajouté');
      setShowDocumentModal(false);
      api.get(`/documents/patient/${id}`).then(r => setDocuments(r.data));
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
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
    { key: 'documents',   label: `Documents (${documents.length})` },
    { key: 'ia',          label: '🤖 Assistant IA' },
  ];

  /* ═══════════════════════════════════════════════════════ */
  return (
    <Layout title="Fiche Patient">

      {/* ── Top action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate('/patients')}
          style={{ background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 16, color: '#475569', 
            padding: '8px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: 'Outfit', color: '#0f172a', letterSpacing: '-0.5px' }}>
            {patient.prenom} {patient.nom}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>{dossierNum}</span>
            <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 700 }}>•</span>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              MÀJ: {patient.updated_at ? format(parseISO(patient.updated_at), 'dd/MM/yyyy HH:mm') : patient.created_at ? format(parseISO(patient.created_at), 'dd/MM/yyyy HH:mm') : '—'}
            </span>
          </div>
        </div>
<<<<<<< HEAD
        <Link to={`/patients/${id}/modifier`}
          style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, borderRadius: 12,
            background: 'white', border: '1px solid #e2e8f0', color: '#334155', textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
          Modifier
        </Link>
=======
        
        <div style={{ display: 'flex', gap: 10 }}>
          {(isAdmin || user?.role === 'medecin') && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                background: '#fff1f2', border: '1px solid #fecaca', color: '#e11d48', cursor: 'pointer', transition: 'all 0.2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              {isAdmin ? 'Supprimer / Archiver' : 'Archiver'}
            </button>
          )}
          
          <Link to={`/patients/${id}/modifier`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
              background: 'white', border: '1px solid #e2e8f0', color: '#475569', textDecoration: 'none', transition: 'all 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Modifier
          </Link>
        </div>
>>>>>>> sauvegarde-zeyneb
      </div>

      {/* ── Patient header card ── */}
      <SectionCard style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { label: 'Sexe / Âge', value: `${patient.sexe === 'M' ? 'Homme' : 'Femme'} · ${age} ans` },
            { label: 'Type Cancer', value: mainCase ? `${mainCase.sous_type || mainCase.type_cancer} — ${mainCase.stade || '—'}` : 'Aucun diagnostic' },
            { label: 'Téléphone', value: patient.telephone || '—' },
            { label: 'Admission', value: patient.created_at ? format(parseISO(patient.created_at), 'yyyy-MM-dd') : '—' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '0 24px',
              borderLeft: i === 0 ? 'none' : '1px solid #f1f5f9'
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Horizontal tabs ── */}
      <div style={{ display: 'flex', gap: 8, padding: '4px', background: '#f8fafc', borderRadius: 12, marginBottom: 24, overflowX: 'auto', border: '1px solid #eef2f6' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? 'white' : 'transparent', 
              border: 'none', cursor: 'pointer',
              padding: '10px 20px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? '#2563eb' : '#64748b',
              borderRadius: 10,
              boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              whiteSpace: 'nowrap', transition: 'all 0.2s',
              fontFamily: 'Outfit'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════ TAB CONTENT ════════════════════ */}

      {/* ── RÉSUMÉ ── */}
      {tab === 'resume' && (
        <div>
          <ClinicalAbstract patient={patient} mainCase={mainCase} age={age} />
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
            <InfoRow label="Tabac"      value={patient.consommation_tabac} />
            <InfoRow label="Alcool"     value={patient.consommation_alcool} />
            <InfoRow label="Sport"      value={patient.activite_sportive ? 'Actif' : 'Sédentaire'} />
            {patient.autres_facteurs_risque && (
              <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Autres facteurs de risque</div>
                <div style={{ fontSize: 13, color: '#334155' }}>{patient.autres_facteurs_risque}</div>
              </div>
            )}
          </SectionCard>
        </div>
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
                <SectionCard key={c.id} title={c.type_cancer ? `Diagnostic : ${c.type_cancer}` : 'Dossier Oncologique'} style={{ marginBottom: 24 }}>
                  <div style={{ padding: '8px 0' }}>
                    <ClinicalTableRow label="Type" value={c.type_cancer} />
                    <ClinicalTableRow label="Sous-type" value={c.sous_type} />
                    <ClinicalTableRow label="Stade" value={c.stade} />
                    <ClinicalTableRow label="État" value={c.etat} />
                    <ClinicalTableRow label="Topographie (ICD-O-3)" value={c.topographie_icdo3} />
                    <ClinicalTableRow label="Morphologie (ICD-O-3)" value={c.morphologie_icdo3} />
                    <ClinicalTableRow label="État Vital" value={c.statut_vital} />
                    <ClinicalTableRow label="Date diagnostic" value={c.date_diagnostic} last />
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Dossier ID: {c.id}</div>
                     <button onClick={() => navigate(`/cas-cancer/${c.id}`)}
                      style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                        background: '#f8fafc', border: '1px solid #eef2f6', cursor: 'pointer', color: '#2563eb', transition: 'all 0.2s' }}>
                      Dossier Complet →
                    </button>
                  </div>
                </SectionCard>
            ))
          }
        </div>
      )}

      {/* ── ANAPATH ── */}
      {tab === 'anapath' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => setShowAnapathModal(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              + Nouveau résultat
            </button>
          </div>
          {anapath.length === 0 && patient.cancer_cases?.some(c => c.anapath)
            ? patient.cancer_cases.filter(c => c.anapath).map(c => {
              const a = c.anapath;
              return (
                <SectionCard key={c.id} title="Résultat Anatomopathologique" style={{ marginBottom: 20 }}>
                  <div style={{ padding: '8px 0' }}>
                    <ClinicalTableRow label="Type histologique" value={a.type_histologique} />
                    <ClinicalTableRow label="Grade tumoral" value={a.grade_sbr ? `SBR ${a.grade_sbr}` : null} />
                    <ClinicalTableRow label="ER (Récepteurs œstrogènes)" value={a.er} />
                    <ClinicalTableRow label="PR (Récepteurs progestérone)" value={a.pr} />
                    <ClinicalTableRow label="HER2" value={a.her2} />
                    <ClinicalTableRow label="Ki67" value={a.ki67} />
                    <ClinicalTableRow label="PD-L1" value={a.pd_l1} />
                    <ClinicalTableRow label="MMR/MSI" value={a.mmr_msi} />
                    <ClinicalTableRow label="Date prélèvement" value={a.date_prelevement} last />
                  </div>
                  {a.compte_rendu && (
                    <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 12, borderLeft: '4px solid #3b82f6', fontSize: 13, lineHeight: 1.6, color: '#475569' }}>
                      <strong>Conclusion :</strong><br/>{a.compte_rendu}
                    </div>
                  )}
                </SectionCard>
              );
            })
            : <EmptyState icon="🧫" title="Aucun résultat" message="Les rapports d'anatomopathologie apparaissent ici." />
          }
        </div>
      )}

      {/* ── BIOLOGIE ── */}
      {tab === 'biologie' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setShowBiologieModal(true)}
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              + Nouveau résultat
            </button>
          </div>
          {biologie.length === 0
            ? <EmptyState icon="🧪" title="Aucun résultat" message="Les analyses biologiques apparaissent ici." />
            : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {biologie.map(b => (
                    <div key={b.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #eef2f6', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧪</div>
                        <div>
                          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{b.type_examen} · {format(parseISO(b.date_examen), 'yyyy-MM-dd')} </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{b.parametre}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: b.interpretation === 'Critique' ? '#ef4444' : '#1e293b' }}>
                          {b.valeur} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{b.unite}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: b.interpretation === 'Normal' ? '#16a34a' : '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {b.interpretation} {b.valeur_normale && `(${b.valeur_normale})`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {biologie.length >= 2 && (
                  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px', marginTop: 10 }}>
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
              </>
            )
          }
        </div>
      )}

      {/* ── IMAGERIE ── */}
      {tab === 'imagerie' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => setShowImagerieModal(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              + Nouvelle imagerie
            </button>
          </div>
          {(() => {
            const imgs = imagerie.length > 0 ? imagerie 
              : patient.cancer_cases?.flatMap(c => c.imagerie || []) || [];
            return imgs.length === 0
              ? <EmptyState icon="🖼️" title="Aucune imagerie" message="Les comptes-rendus d'imagerie apparaissent ici." />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {imgs.map((img, i) => (
                    <div key={img.id || i} 
                      style={{ background: 'white', borderRadius: 16, border: '1px solid #eef2f6',
                        padding: '20px 24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{img.type_examen} {img.region ? `· ${img.region}` : ''}</div>
                          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{img.conclusion || 'Aucune conclusion renseignée.'}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', background: '#f8fafc', padding: '4px 10px', borderRadius: 8 }}>
                          {img.date_examen ? format(parseISO(img.date_examen), 'yyyy-MM-dd') : '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
          })()}
        </div>
      )}

      {/* ── TRAITEMENT ── */}
      {tab === 'traitement' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => setShowTraitementModal(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer' }}>
              + Nouveau traitement
            </button>
          </div>
          {(() => {
            const treats = traitements.length > 0 ? traitements
              : patient.cancer_cases?.flatMap(c => c.traitements || []) || [];
            return treats.length === 0
              ? <EmptyState icon="💊" title="Aucun traitement" message="Les protocoles thérapeutiques apparaissent ici." />
              : treats.map((t, i) => (
                  <SectionCard key={t.id || i} title={`${t.type_traitement} — Protocole ${t.protocole || 'N/A'}`} style={{ marginBottom: 20 }}>
                    <div style={{ padding: '8px 0' }}>
                      <ClinicalTableRow label="Protocole" value={t.protocole} />
                      <ClinicalTableRow label="Nombre de cycles" value={t.nb_cycles_prevus ? `${t.cycles_realises || 0} / ${t.nb_cycles_prevus}` : null} />
                      <ClinicalTableRow label="Date début" value={t.date_debut} />
                      <ClinicalTableRow label="Date fin prévue" value={t.date_fin} />
                      <ClinicalTableRow label="Intention" value={t.intention_therapeutique} last />
                    </div>
                    
                    {t.type_traitement === 'Chimiothérapie' && t.nb_cycles_prevus > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>Progression des cycles</div>
                        <CycleBar total={t.nb_cycles_prevus} completed={t.cycles_realises || 0} />
                      </div>
                    )}

                    {t.description && (
                      <div style={{ marginTop: 20, padding: 16, background: '#f8fafc', borderRadius: 12, fontSize: 13, color: '#475569' }}>
                         {t.description}
                      </div>
                    )}
                  </SectionCard>
                ));
          })()}
        </div>
      )}

      {/* ── CONSULTATIONS ── */}
      {tab === 'consultations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => setShowConsultationModal(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              + Nouvelle consultation
            </button>
          </div>
          {(() => {
            const cons = consultations.length > 0 ? consultations
              : patient.cancer_cases?.flatMap(c => c.consultations || []) || [];
            return cons.length === 0
              ? <EmptyState icon="👨‍⚕️" title="Aucun suivi" message="L'historique des consultations apparaîtra ici." />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {cons.map((c, i) => (
                    <div key={c.id || i} style={{ background: 'white', borderRadius: 16, border: '1px solid #eef2f6', padding: '20px 24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Consultation</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{c.date_consultation ? format(parseISO(c.date_consultation), 'dd MMMM yyyy') : '—'}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '4px 12px', borderRadius: 8 }}>Dr. {c.medecin || '—'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 14, color: '#475569', lineHeight: 1.6, borderLeft: '4px solid #3b82f6' }}>
                        {c.motif && <div style={{ marginBottom: 8 }}><strong>Motif :</strong> {c.motif}</div>}
                        {c.observations && <div><strong>Observations :</strong> {c.observations}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              );
          })()}
        </div>
      )}

      {/* ── EFFETS SECONDAIRES ── */}
      {tab === 'effets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button onClick={() => setShowEffetsModal(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
              background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              + Signaler
            </button>
          </div>
          {(() => {
            const eff = effets.length > 0 ? effets
              : patient.cancer_cases?.flatMap(c => c.effets_secondaires || []) || [];
            return eff.length === 0
              ? <EmptyState icon="⚠️" title="Aucune alerte" message="Les toxicités et effets secondaires apparaissent ici." />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {eff.map((e, i) => (
                    <div key={e.id || i}
                      onClick={() => setSelectedEffect(selectedEffect?.id === e.id ? null : e)}
                      style={{ background: 'white', borderRadius: 16, border: `1px solid ${selectedEffect?.id === e.id ? '#3b82f6' : '#eef2f6'}`,
                        padding: '20px 24px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{e.type_effet}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                             {e.grade && <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                              background: (GRADE_COLORS[e.grade] || '#64748b') + '15', color: GRADE_COLORS[e.grade] || '#64748b' }}>{e.grade}</span>}
                            <span style={pill(e.resolu ? '#15803d' : '#d97706', e.resolu ? '#dcfce7' : '#fef3c7')}>{e.resolu ? 'RÉSOLU' : 'ACTIF'}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{e.date_apparition}</div>
                      </div>
                      {selectedEffect?.id === e.id && (
                        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                           <ClinicalTableRow label="Description" value={e.description} />
                           <ClinicalTableRow label="Mesures prises" value={e.traitement_pris} />
                           {e.date_resolution && <ClinicalTableRow label="Date de résolution" value={e.date_resolution} last />}
                        </div>
                      )}
                      {e.date_resolution && <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Résolu le: {format(parseISO(e.date_resolution), 'dd/MM/yyyy')}</div>}
                    </div>
                  ))}
                </div>
              );
          })()}
        </div>
      )}

      {/* ── DOCUMENTS ── */}
      {tab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowDocumentModal(true)}
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              + Nouveau document
            </button>
          </div>
          {documents.length === 0
            ? <EmptyState icon="📂" title="Aucun document" message="Les fichiers scannés et comptes-rendus PDF apparaissent ici." />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {documents.map(d => (
                  <div key={d.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #eef2f6', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{d.titre}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{d.categorie} · {format(parseISO(d.date_doc), 'yyyy-MM-dd')} </div>
                    </div>
                    <button style={{ color: '#2563eb', fontWeight: 700, fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', padding: '8px' }}>Ouvrir</button>
                  </div>
                ))}
              </div>
            )
          }
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
      )}

<<<<<<< HEAD
      {/* ════════════════════ MODALS ════════════════════ */}
      
      {showTraitementModal && (
        <Modal title="Nouveau Protocole Thérapeutique" onClose={() => setShowTraitementModal(false)} onSave={handleSaveTraitement}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={inputGroup}>
              <label style={labelStyle}>Type de traitement</label>
              <select className="form-control" value={traitementForm.type_traitement} onChange={e => setTraitementForm({...traitementForm, type_traitement: e.target.value})}>
                {['Chimiothérapie','Radiothérapie','Chirurgie','Immunothérapie','Hormonothérapie','Soins palliatifs'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Intention Thérapeutique</label>
              <select className="form-control" value={traitementForm.intention_therapeutique} onChange={e => setTraitementForm({...traitementForm, intention_therapeutique: e.target.value})}>
                {['Curative','Adjuvante','Néoadjuvante','Palliative','Prophylactique'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Protocole / Molécules</label>
              <input type="text" className="form-control" placeholder="ex: FEC 100, AC-T, etc." value={traitementForm.protocole} onChange={e => setTraitementForm({...traitementForm, protocole: e.target.value})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Date de début</label>
              <input type="date" className="form-control" value={traitementForm.date_debut} onChange={e => setTraitementForm({...traitementForm, date_debut: e.target.value})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Nb de cycles prévus</label>
              <input type="number" className="form-control" value={traitementForm.nb_cycles_prevus} onChange={e => setTraitementForm({...traitementForm, nb_cycles_prevus: e.target.value})} />
            </div>

            {/* Section spécifique Chimio */}
            {(traitementForm.type_traitement === 'Chimiothérapie' || traitementForm.type_traitement === 'Immunothérapie') && (
              <>
                <div style={sectionTitle}>Détails Systémiques</div>
                <div style={inputGroup}>
                  <label style={labelStyle}>Ligne de traitement</label>
                  <select className="form-control" value={traitementForm.ligne_traitement} onChange={e => setTraitementForm({...traitementForm, ligne_traitement: e.target.value})}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}ère ligne</option>)}
                  </select>
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>Voie d'administration</label>
                  <select className="form-control" value={traitementForm.voie_administration} onChange={e => setTraitementForm({...traitementForm, voie_administration: e.target.value})}>
                    {['Intraveineuse','Orale','Sous-cutanée','Intra-artérielle'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Section spécifique Radio */}
            {traitementForm.type_traitement === 'Radiothérapie' && (
              <>
                <div style={sectionTitle}>Paramètres de Radiothérapie</div>
                <div style={inputGroup}>
                  <label style={labelStyle}>Dose Totale (Gy)</label>
                  <input type="text" className="form-control" placeholder="ex: 50 Gy" value={traitementForm.radio_dose_totale} onChange={e => setTraitementForm({...traitementForm, radio_dose_totale: e.target.value})} />
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>Nb de séances</label>
                  <input type="number" className="form-control" value={traitementForm.radio_nb_seances} onChange={e => setTraitementForm({...traitementForm, radio_nb_seances: e.target.value})} />
                </div>
              </>
            )}

            {/* Section spécifique Chirurgie */}
            {traitementForm.type_traitement === 'Chirurgie' && (
              <>
                <div style={sectionTitle}>Données Chirurgicales</div>
                <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Type d'intervention</label>
                  <input type="text" className="form-control" placeholder="ex: Tumorectomie, Mastectomie..." value={traitementForm.chirurgie_type} onChange={e => setTraitementForm({...traitementForm, chirurgie_type: e.target.value})} />
                </div>
              </>
            )}

            <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Observations / Réponse Patient</label>
              <textarea className="form-control" rows="3" value={traitementForm.description} onChange={e => setTraitementForm({...traitementForm, description: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}

      {showConsultationModal && (
        <Modal title="Nouvelle consultation" onClose={() => setShowConsultationModal(false)} onSave={handleSaveConsultation}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Date consultation</label>
              <input type="date" className="form-control" value={consultationForm.date_consultation} onChange={e => setConsultationForm({...consultationForm, date_consultation: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Médecin</label>
              <input type="text" className="form-control" value={consultationForm.medecin} onChange={e => setConsultationForm({...consultationForm, medecin: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Motif</label>
              <input type="text" className="form-control" value={consultationForm.motif} onChange={e => setConsultationForm({...consultationForm, motif: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Observations</label>
              <textarea className="form-control" rows="3" value={consultationForm.examen_clinique} onChange={e => setConsultationForm({...consultationForm, examen_clinique: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Plan / Décision</label>
              <textarea className="form-control" rows="2" value={consultationForm.decision_medicale} onChange={e => setConsultationForm({...consultationForm, decision_medicale: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}

      {showAnapathModal && (
        <Modal title="Nouveau Rapport Anatomopathologique" onClose={() => setShowAnapathModal(false)} onSave={handleSaveAnapath}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={inputGroup}>
              <label style={labelStyle}>Date prélèvement</label>
              <input type="date" className="form-control" value={anapathForm.date_prelevement} onChange={e => setAnapathForm({...anapathForm, date_prelevement: e.target.value})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Type de Prélèvement</label>
              <select className="form-control" value={anapathForm.type_prelevement} onChange={e => setAnapathForm({...anapathForm, type_prelevement: e.target.value})}>
                {['Biopsie à l\'aiguille','Biopsie chirurgicale','Exérèse chirurgicale','Cytologie','Pièce opératoire'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={sectionTitle}>Marqueurs & IHC</div>
            <div style={inputGroup}>
              <label style={labelStyle}>RE / RP</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="form-control" placeholder="RE %" value={anapathForm.er} onChange={e => setAnapathForm({...anapathForm, er: e.target.value})} />
                <input type="text" className="form-control" placeholder="RP %" value={anapathForm.pr} onChange={e => setAnapathForm({...anapathForm, pr: e.target.value})} />
              </div>
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>HER2 & Ki-67</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="form-control" placeholder="HER2 (ex: 3+)" value={anapathForm.her2} onChange={e => setAnapathForm({...anapathForm, her2: e.target.value})} />
                <input type="text" className="form-control" placeholder="Ki-67 %" value={anapathForm.ki_67} onChange={e => setAnapathForm({...anapathForm, ki_67: e.target.value})} />
              </div>
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>PD-L1</label>
              <input type="text" className="form-control" placeholder="CPS/TPS score" value={anapathForm.pd_l1} onChange={e => setAnapathForm({...anapathForm, pd_l1: e.target.value})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Statut MMR / MSI</label>
              <select className="form-control" value={anapathForm.mmr_msi} onChange={e => setAnapathForm({...anapathForm, mmr_msi: e.target.value})}>
                {['Stable (MSS)','Instable (MSI-H)','Inconnu'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Compte-rendu Histologique</label>
              <textarea className="form-control" rows="4" value={anapathForm.compte_rendu} onChange={e => setAnapathForm({...anapathForm, compte_rendu: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}

      {showImagerieModal && (
        <Modal title="Nouvelle imagerie" onClose={() => setShowImagerieModal(false)} onSave={handleSaveImagerie}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" className="form-control" value={imagerieForm.date_examen} onChange={e => setImagerieForm({...imagerieForm, date_examen: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Modalité</label>
              <select className="form-control" value={imagerieForm.type_examen} onChange={e => setImagerieForm({...imagerieForm, type_examen: e.target.value})}>
                {['Scanner','IRM','PET-scan','Échographie','Radio','Scintigraphie'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Région anatomique</label>
              <input type="text" className="form-control" value={imagerieForm.region} onChange={e => setImagerieForm({...imagerieForm, region: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Conclusion / Résultats</label>
              <textarea className="form-control" rows="4" value={imagerieForm.conclusion} onChange={e => setImagerieForm({...imagerieForm, conclusion: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}

      {showEffetsModal && (
        <Modal title="Signaler une Toxicité / Effet Indésirable" onClose={() => setShowEffetsModal(false)} onSave={handleSaveEffets}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={inputGroup}>
              <label style={labelStyle}>Date d'apparition</label>
              <input type="date" className="form-control" value={effetsForm.date_apparition} onChange={e => setEffetsForm({...effetsForm, date_apparition: e.target.value})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Grade (CTCAE)</label>
              <select className="form-control" value={effetsForm.grade} onChange={e => setEffetsForm({...effetsForm, grade: e.target.value})}>
                {['Grade 1 (Léger)','Grade 2 (Modéré)','Grade 3 (Sévère)','Grade 4 (Vie en danger)','Grade 5 (Décès)'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Type d'effet / Symptôme</label>
              <input type="text" className="form-control" placeholder="ex: Neutropénie fébrile, Mucosite..." value={effetsForm.type_effet} onChange={e => setEffetsForm({...effetsForm, type_effet: e.target.value})} />
            </div>
            <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Traitement entrepris / Mesures</label>
              <input type="text" className="form-control" placeholder="ex: G-CSF, Suspension du traitement..." value={effetsForm.traitement_pris} onChange={e => setEffetsForm({...effetsForm, traitement_pris: e.target.value})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Résolution</label>
              <select className="form-control" value={effetsForm.resolu} onChange={e => setEffetsForm({...effetsForm, resolu: e.target.value})}>
                <option value="0">En cours</option>
                <option value="1">Résolu</option>
              </select>
            </div>
            {effetsForm.resolu === "1" && (
              <div style={inputGroup}>
                <label style={labelStyle}>Date de résolution</label>
                <input type="date" className="form-control" value={effetsForm.date_resolution} onChange={e => setEffetsForm({...effetsForm, date_resolution: e.target.value})} />
              </div>
            )}
            <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Description détaillée</label>
              <textarea className="form-control" rows="3" value={effetsForm.description} onChange={e => setEffetsForm({...effetsForm, description: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}

      {showDocumentModal && (
        <Modal title="Nouveau document" onClose={() => setShowDocumentModal(false)} onSave={handleSaveDocument}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Titre du document</label>
              <input type="text" className="form-control" value={documentForm.titre} onChange={e => setDocumentForm({...documentForm, titre: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Catégorie</label>
              <select className="form-control" value={documentForm.categorie} onChange={e => setDocumentForm({...documentForm, categorie: e.target.value})}>
                {['Compte-rendu','Ordonnance','Courrier','Facture','Autre'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date du document</label>
              <input type="date" className="form-control" value={documentForm.date_doc} onChange={e => setDocumentForm({...documentForm, date_doc: e.target.value})} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Fichier</label>
              <input type="file" className="form-control" />
            </div>
          </div>
        </Modal>
      )}

      {showBiologieModal && (
        <Modal title="Nouveau résultat de biologie" onClose={() => setShowBiologieModal(false)} onSave={handleSaveBiologie}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Date de l'examen</label>
              <input type="date" className="form-control" value={bioForm.date_examen} onChange={e => setBioForm({...bioForm, date_examen: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Type d'examen</label>
              <select className="form-control" value={bioForm.type_examen} onChange={e => setBioForm({...bioForm, type_examen: e.target.value})}>
                {['NFS','Biochimie','Marqueurs tumoraux','Coagulation','Ionogramme','Autre'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Paramètre / Analyse</label>
              <input type="text" className="form-control" placeholder="ex: Hémoglobine, CA-153..." value={bioForm.parametre} onChange={e => setBioForm({...bioForm, parametre: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Valeur</label>
              <input type="text" className="form-control" placeholder="ex: 12.4" value={bioForm.valeur} onChange={e => setBioForm({...bioForm, valeur: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Unité</label>
              <input type="text" className="form-control" placeholder="ex: g/dL" value={bioForm.unite} onChange={e => setBioForm({...bioForm, unite: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Valeur Normale</label>
              <input type="text" className="form-control" placeholder="ex: 12.0 - 16.0" value={bioForm.valeur_normale} onChange={e => setBioForm({...bioForm, valeur_normale: e.target.value})} />
            </div>
            <div>
              <label style={labelStyle}>Interprétation</label>
              <select className="form-control" value={bioForm.interpretation} onChange={e => setBioForm({...bioForm, interpretation: e.target.value})}>
                {['Normal','Bas','Haut','Critique'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Notes techniques</label>
              <textarea className="form-control" rows="2" value={bioForm.notes} onChange={e => setBioForm({...bioForm, notes: e.target.value})} />
            </div>
          </div>
        </Modal>
=======
      {/* ── MODAL DE SUPPRESSION ── */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          
          <div style={{ background: 'white', borderRadius: 16, width: 450, maxWidth: '90%', 
            padding: 30, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'slideUp 0.3s ease-out' }}>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#dc2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{isAdmin ? 'Gérer le dossier patient' : 'Archiver le dossier'}</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Vous êtes sur le point de retirer ce patient de la liste principale.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => confirmDelete(false)}
                style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: 12,
                  background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>📂 Archiver uniquement</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Le patient ne sera visible que dans les archives. Les données restent dans la base de données.</span>
              </button>

              {isAdmin && (
                <button onClick={() => confirmDelete(true)}
                  style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: 12,
                    background: '#fff1f2', border: '1px solid #fecaca', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>🗑 Supprimer définitivement</span>
                  <span style={{ fontSize: 12, color: '#991b1b' }}>Toutes les traces seront effacées de la base de données. Attention : Action irréversible.</span>
                </button>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0',
                  color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
>>>>>>> sauvegarde-zeyneb
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </Layout>
  );
}

function Modal({ title, onClose, onSave, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        animation: 'modalSlideUp 0.3s ease-out'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {title}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', padding: '5px' }}>✕</button>
        </div>
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          {children}
        </div>
        <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white',
            color: '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
          }}>Annuler</button>
          <button onClick={onSave} style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
          }}>Enregistrer</button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '4px' };
const sectionTitle = { gridColumn: 'span 2', fontSize: '14px', fontWeight: 700, color: '#0f172a', paddingBottom: '8px', borderBottom: '2px solid #3b82f6', marginTop: '10px', marginBottom: '5px' };
