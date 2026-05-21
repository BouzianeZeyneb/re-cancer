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
import { Heart, Droplets, Thermometer, Wind, Activity, Edit3, Printer, Share2, FileDown, Calendar as CalendarIcon, ArrowLeft, MoreHorizontal, User, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  'Guéri': pill('#15803d', '#dcfce7', 'Guéri'),
  'Décédé': pill('#b91c1c', '#fee2e2', 'Décédé'),
};
const ETAT_PILL = {
  'Localisé': pill('#5b21b6', '#ede9fe', 'Localisé'),
  'Métastase': pill('#c2410c', '#ffedd5', 'Métastatique'),
};
const INTERP_COLORS = { Normal: '#16a34a', Bas: '#2563eb', Haut: '#d97706', Critique: '#dc2626' };
const GRADE_COLORS = { 'Grade 1': '#16a34a', 'Grade 2': '#d97706', 'Grade 3': '#ea580c', 'Grade 4': '#dc2626' };

const inputGroup = { marginBottom: '16px' };
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' };
const sectionTitle = { gridColumn: 'span 2', fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '8px', marginTop: '8px', marginBottom: '12px' };

function InfoRow({ label, value, icon }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: '1px solid #f1f5f9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <span style={{ opacity: 0.6 }}>{icon}</span>}
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>
        {typeof value === 'boolean' || value === 'true' || value === 'false'
          ? (value === true || value === 'true' ? '✅ Oui' : '❌ Non')
          : (value || '—')}
      </span>
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
    <div style={{
      background: 'white',
      borderRadius: 24,
      border: '1px solid #f1f5f9',
      boxShadow: '0 4px 24px -12px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      ...style
    }}>
      {(title || action) && (
        <div style={{
          padding: '24px 28px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          {title && <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.3px' }}>{title}</div>}
          {action}
        </div>
      )}
      <div style={{ padding: '0 28px 28px' }}>{children}</div>
    </div>
  );
}

function VitalCard({ icon: Icon, iconColor, iconBg, title, value, unit, trend }) {
  return (
    <div style={{
      background: 'white', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', flex: 1, minWidth: 150,
      border: '1px solid #f1f5f9', boxShadow: '0 4px 24px -12px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {trend && (
          <div style={{ color: trend === 'up' ? '#dc2626' : (trend === 'down' ? '#16a34a' : '#94a3b8') }}>
            <Activity size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#0f172a', letterSpacing: '-1px' }}>{value}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{unit}</span>
      </div>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
      <div style={{ background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 24, padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1px' }}>Stadification TNM</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit' }}>{mainCase?.stade || '—'}</div>
        <div style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 800, marginTop: 4 }}>Classification : {mainCase?.tnm_t || 'T'}{mainCase?.tnm_n || 'N'}{mainCase?.tnm_m || 'M'}</div>
      </div>
      <div style={{ background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 24, padding: '24px' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1px' }}>Code ICD-O-3</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{mainCase?.topographie_icdo3 || 'C—'}</div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>Morphologie : {mainCase?.morphologie_icdo3 || 'M—'}</div>
      </div>
      <div style={{ background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 24, padding: '24px' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1px' }}>Code ICD-10</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{mainCase?.code_icd10 || 'C50.9'}</div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>Diagnostic Principal</div>
      </div>
      <div style={{ background: hasRisk ? '#fff1f2' : '#f0fdf4', border: hasRisk ? '1.5px solid #fee2e2' : '1.5px solid #dcfce7', borderRadius: 24, padding: '24px' }}>
        <div style={{ fontSize: 11, color: hasRisk ? '#e11d48' : '#166534', fontWeight: 800, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '1px' }}>Risque Clinique</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {patient.consommation_tabac && <span title="Tabac" style={{ fontSize: 24 }}>🚬</span>}
          {patient.consommation_alcool && <span title="Alcool" style={{ fontSize: 24 }}>🍷</span>}
          {!hasRisk && <div style={{ fontSize: 14, color: '#166534', fontWeight: 800 }}>Profil Standard</div>}
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
  const { t } = useTranslation();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('resume');

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
  const [cases, setCases] = useState([]);
  const [biologie, setBiologie] = useState([]);
  const [anapath, setAnapath] = useState([]);
  const [imagerie, setImagerie] = useState([]);
  const [traitements, setTraitements] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [effets, setEffets] = useState([]);
  const [champsDyn, setChampsDyn] = useState([]);
  const [valsDyn, setValsDyn] = useState({});
  const [documents, setDocuments] = useState([]);

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
  const [showBioForm, setShowBioForm] = useState(false);
  const [bioForm, setBioForm] = useState({});
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: "👋 Bonjour! Je suis l'Assistant IA OncoTrack. Comment puis-je vous aider à analyser ce dossier?" }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatBottom = useRef(null);
  const bioFormRef = useRef(null);

  useEffect(() => {
    if (showBioForm && bioFormRef.current) {
      bioFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showBioForm]);

  // Selected detail for slide-over
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedAnapath, setSelectedAnapath] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState(null);
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
    ]).then(async ([pRes, casRes, bioRes, labRes, anRes, imgRes, trRes, consultRes, effRes, chRes, vRes, lboRes, docRes]) => {
      setPatient(pRes.data);
      const loadedCases = Array.isArray(casRes.data) ? casRes.data : casRes.data?.cases || [];
      setCases(loadedCases);
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
      // 1. Map patient-level values
      (Array.isArray(vRes.data) ? vRes.data : []).forEach(v => (vv[v.champ_id] = v.valeur));

      // 2. Fetch and map case-level values
      try {
        const caseValuePromises = loadedCases.map(c => api.get(`/valeurs-dynamiques/${c.id}`));
        const caseValueResponses = await Promise.all(caseValuePromises);
        caseValueResponses.forEach((res, index) => {
          const caseId = loadedCases[index].id;
          (Array.isArray(res.data) ? res.data : []).forEach(v => {
            vv[`${caseId}-${v.champ_id}`] = v.valeur;
          });
        });
      } catch (e) { console.error('Error loading case dynamic values', e); }

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
  const dossierNum = `PAT-${new Date(patient.created_at || Date.now()).getFullYear()}-${String(patient.patient_seq || 0).padStart(4, '0')}`;

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
      api.get(`/lab-requests/patient/${id}`).then(r => setLabRequests(r.data)).catch(() => { });
    } catch (e) { toast.error('Erreur: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDeleteBiologie = async (bId) => {
    if (!window.confirm('Supprimer cette analyse ?')) return;
    await api.delete(`/biologie/${bId}`);
    toast.success('Supprimé');
    api.get(`/biologie/patient/${id}`).then(r => setBiologie(r.data)).catch(() => { });
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
    { key: 'resume', label: t('patient_detail.tabs.summary') || 'Résumé' },
    { key: 'diagnostic', label: `${t('patient_detail.tabs.diagnosis') || 'Diagnostic'} (${(patient.cancer_cases || cases).length})` },
    { key: 'anapath', label: t('patient_detail.tabs.pathology') || 'Anapath' },
    { key: 'biologie', label: `${t('patient_detail.tabs.biology') || 'Biologie'} (${biologie.length})` },
    { key: 'imagerie', label: t('patient_detail.tabs.imaging') || 'Imagerie' },
    { key: 'traitement', label: t('patient_detail.tabs.treatment') || 'Traitement' },
    { key: 'consultations', label: t('patient_detail.tabs.consultations') || 'Consultations' },
    { key: 'effets', label: t('patient_detail.tabs.side_effects') || 'Effets secondaires' },
    { key: 'documents', label: `${t('patient_detail.tabs.documents') || 'Documents'} (${documents.length})` },
    { key: 'ia', label: '🤖 Assistant IA' },
  ];

  /* ═══════════════════════════════════════════════════════ */
  return (
    <Layout title="Fiche Patient">
      <div style={{
        background: 'radial-gradient(circle at 10% 20%, rgb(239, 246, 255) 0%, rgb(219, 234, 254) 90%)',
        minHeight: '100vh', padding: '32px', borderRadius: '32px', margin: '-24px', position: 'relative'
      }}>
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0369a1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(3,105,161,0.2)' }}>
              <Heart size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, fontFamily: "'Outfit', sans-serif", color: '#0f172a', letterSpacing: '-1px' }}>{t('patient_detail.title')}</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{t('patient_detail.subtitle')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/patients')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 24, border: '1px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <ArrowLeft size={18} /> {t('patient_detail.back')}
            </button>
          </div>
        </div>

        {/* ── HERO CARD ── */}
        <div style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          borderRadius: 32, padding: '32px 40px', marginBottom: 32,
          boxShadow: '0 20px 40px -15px rgba(2,132,199,0.15)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.4, backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Top section: Avatar + Info + Actions */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 120, height: 120, borderRadius: 32, background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: '-2px', boxShadow: '0 10px 25px rgba(2,132,199,0.3)' }}>
                  {initials}
                </div>
                <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', letterSpacing: '0.5px' }}>{t('patient_detail.active')}</span>
                </div>
              </div>

              <div style={{ flex: 1, paddingTop: 8 }}>
                <h2 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 12px 0', fontFamily: "'Outfit', sans-serif", color: '#0f172a', letterSpacing: '-1.5px' }}>
                  {patient.prenom} <span style={{ textTransform: 'uppercase' }}>{patient.nom}</span>
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: 24, fontSize: 13, fontWeight: 800, letterSpacing: '0.5px' }}>
                    {dossierNum}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)', padding: '6px 16px', borderRadius: 24, fontSize: 13, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarIcon size={14} /> {t('patient_detail.update')} {patient.updated_at ? format(parseISO(patient.updated_at), 'dd/MM/yyyy · HH:mm') : '—'}
                  </span>
                  {mainCase?.stade && (
                    <span style={{ background: '#ffedd5', color: '#c2410c', padding: '6px 16px', borderRadius: 24, fontSize: 13, fontWeight: 800, border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={14} /> {mainCase.stade}
                    </span>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: 15, color: '#475569', fontWeight: 500 }}>
                  {mainCase?.sous_type || 'Type non spécifié'} — {mainCase?.statut_patient || 'En attente'}.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.5)', padding: 6, borderRadius: 24 }}>
                  <button onClick={() => window.print()} title="Imprimer le dossier" style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}><Printer size={18} /></button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Lien copié dans le presse-papier'); }} title="Partager le dossier" style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}><Share2 size={18} /></button>
                  <button onClick={() => { const text = `DOSSIER PATIENT\n${dossierNum}\n\nNom: ${patient.prenom} ${patient.nom}\nSexe: ${patient.sexe === 'M' ? 'Homme' : 'Femme'} | Âge: ${age} ans\nDate naissance: ${patient.date_naissance}\nTéléphone: ${patient.telephone || '—'}\nWilaya: ${patient.wilaya || '—'}\nCarte Nationale: ${patient.num_carte_nationale || '—'}\n\nDIAGNOSTIC:\nType: ${mainCase?.type_cancer || '—'}\nSous-type: ${mainCase?.sous_type || '—'}\nStade: ${mainCase?.stade || '—'}\nÉtat: ${mainCase?.etat || '—'}\nStatut: ${mainCase?.statut_patient || '—'}\n\nAntécédents médicaux: ${patient.antecedents_medicaux || '—'}\nAntécédents familiaux: ${patient.antecedents_familiaux || '—'}\nTabac: ${patient.consommation_tabac || 'Inconnu'}\nAlcool: ${patient.consommation_alcool || 'Inconnu'}`; const blob = new Blob([text], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dossier_${patient.nom}_${patient.prenom}.txt`; a.click(); URL.revokeObjectURL(url); toast.success('Dossier téléchargé'); }} title="Télécharger le dossier" style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}><FileDown size={18} /></button>
                </div>
                <button onClick={() => navigate(`/patients/${id}/modifier`)} style={{ padding: '0 24px', height: 52, borderRadius: 26, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Edit3 size={18} /> {t('patient_detail.edit')}
                </button>
                <button onClick={() => { setTab('consultations'); setShowConsultationModal(true); }} style={{ padding: '0 24px', height: 52, borderRadius: 26, background: '#0284c7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
                  <CalendarIcon size={18} /> {t('patient_detail.schedule')}
                </button>
              </div>
            </div>

            {/* Bottom section: Quick Summary Strip */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', borderRadius: 24, padding: '20px 32px', gap: 40, border: '1px solid rgba(255,255,255,0.8)' }}>
              <div style={{ flex: 1, borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}><User size={14} /> {t('patient_detail.gender_age')}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>{patient.sexe === 'M' ? t('patient_detail.male') : t('patient_detail.female')} · {age} {t('patient_detail.years')}</div>
              </div>
              <div style={{ flex: 1, borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}><Activity size={14} /> {t('patient_detail.cancer_type')}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>{mainCase?.type_cancer || '—'}</div>
              </div>
              <div style={{ flex: 1, borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}><Printer size={14} /> {t('patient_detail.phone')}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>{patient.telephone || '—'}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}><CalendarIcon size={14} /> {t('patient_detail.admission')}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>{format(parseISO(patient.created_at || new Date().toISOString()), 'yyyy-MM-dd')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── VITALS ── */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
          <VitalCard icon={Heart} iconColor="#ef4444" iconBg="#fee2e2" title={t('patient_detail.vitals.pulse')} value="78" unit="bpm" trend="up" />
          <VitalCard icon={Droplets} iconColor="#3b82f6" iconBg="#dbeafe" title={t('patient_detail.vitals.bp')} value="128/82" unit="mmHg" trend="up" />
          <VitalCard icon={Thermometer} iconColor="#f59e0b" iconBg="#fef3c7" title={t('patient_detail.vitals.temp')} value="36.8" unit="°C" trend="down" />
          <VitalCard icon={Wind} iconColor="#10b981" iconBg="#d1fae5" title={t('patient_detail.vitals.spo2')} value="94" unit="%" trend="down" />
        </div>

        {/* ── Horizontal tabs ── */}
        <div style={{
          display: 'flex', gap: 10, padding: '6px',
          background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 16, marginBottom: 30, overflowX: 'auto',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 12px rgba(0,0,0,0.03)'
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? 'white' : 'transparent',
                border: 'none', cursor: 'pointer',
                padding: '12px 24px', fontSize: 14, fontWeight: tab === t.key ? 800 : 600,
                color: tab === t.key ? '#2563eb' : '#64748b',
                borderRadius: 12,
                boxShadow: tab === t.key ? '0 4px 14px rgba(37,99,235,0.15)' : 'none',
                whiteSpace: 'nowrap', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: "'Outfit', sans-serif"
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════ TAB CONTENT ════════════════════ */}

        {/* ── RÉSUMÉ ── */}
        {tab === 'resume' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top 3 Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {/* Profil Oncologique */}
              <div style={{ background: '#ffe4e6', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#be123c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Profil Oncologique</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#881337', fontFamily: "'Outfit', sans-serif", letterSpacing: '-1px', marginBottom: 8 }}>{mainCase?.stade || '—'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e11d48', display: 'flex', alignItems: 'center', gap: 8 }}>
                  TNM : {mainCase?.tnm || 'T? N? M?'}
                </div>
              </div>

              {/* Standard ICD-O-3 */}
              <div style={{ background: '#e0f2fe', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Standard ICD-O-3</div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#0c4a6e', fontFamily: "'Outfit', sans-serif" }}>{mainCase?.code_topographie || '—'}</span>
                  <span style={{ fontSize: 18, color: '#64748b', marginLeft: 8 }}>Topographie</span>
                </div>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#0c4a6e', fontFamily: "'Outfit', sans-serif" }}>{mainCase?.code_morphologie || '—'}</span>
                  <span style={{ fontSize: 18, color: '#64748b', marginLeft: 8 }}>Morphologie</span>
                </div>
              </div>

              {/* Facteurs de Risque */}
              <div style={{ background: '#ffedd5', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 20 }}>Facteurs de Risque</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {patient.consommation_tabac && patient.consommation_tabac !== 'Non' && (
                    <span style={{ background: 'white', color: '#9a3412', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><Wind size={14} /> Tabac</span>
                  )}
                  {patient.consommation_alcool && patient.consommation_alcool !== 'Non' && (
                    <span style={{ background: 'white', color: '#9a3412', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><Activity size={14} /> Alcool</span>
                  )}
                  {!patient.activite_sportive && (
                    <span style={{ background: 'white', color: '#9a3412', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><Activity size={14} /> Sédentaire</span>
                  )}
                  {(patient.consommation_tabac === 'Non' && patient.consommation_alcool === 'Non' && patient.activite_sportive) && (
                    <span style={{ background: 'white', color: '#16a34a', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}><CheckCircle2 size={14} /> Aucun connu</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Grid: Info & Timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SectionCard title="Informations Générales" action={<MoreHorizontal size={20} color="#94a3b8" />}>
                  <InfoRow label="Nom complet" value={`${patient.prenom} ${patient.nom}`} />
                  <InfoRow label="Date de naissance" value={patient.date_naissance ? format(parseISO(patient.date_naissance), 'yyyy-MM-dd') : null} />
                  <InfoRow label="Email" value={patient.email} />
                  <InfoRow label="Médecin responsable" value={patient.medecin_traitant_nom || (mainCase?.medecin_nom ? `Dr. ${mainCase.medecin_nom}` : null)} />
                  <InfoRow label="Wilaya" value={patient.wilaya} />
                  <InfoRow label="Téléphone" value={patient.telephone} />
                  <InfoRow label="Carte Nationale" value={patient.num_carte_nationale} />
                </SectionCard>

                <SectionCard title="Antécédents" action={<MoreHorizontal size={20} color="#94a3b8" />}>
                  <InfoRow label="Médicaux" value={patient.antecedents_medicaux} />
                  <InfoRow label="Familiaux" value={patient.antecedents_familiaux} />
                  <InfoRow label="Allergies" value={patient.allergies} />
                  <InfoRow label="Tabac" value={patient.consommation_tabac || 'Inconnu'} />
                  <InfoRow label="Alcool" value={patient.consommation_alcool || 'Inconnu'} />
                  <InfoRow label="Sport" value={patient.activite_sportive ? 'Actif' : 'Sédentaire'} />
                </SectionCard>
              </div>

              {/* Activité récente */}
              <SectionCard title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={20} color="#0284c7" /> Activité récente
                </div>
              } action={<span style={{ color: '#0284c7', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Voir tout {'>'}</span>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', marginTop: 8 }}>
                  <div style={{ position: 'absolute', top: 16, bottom: 16, left: 11, width: 2, background: '#f1f5f9' }} />

                  {(() => {
                    const allActivities = [
                      ...traitements.map(t => ({ type: 'traitement', date: t.date_debut || t.created_at, title: t.type_traitement, detail: t.protocole || 'Protocole non précisé', color: '#1e3a8a' })),
                      ...imagerie.map(i => ({ type: 'imagerie', date: i.date_examen || i.created_at, title: i.type_examen, detail: i.conclusion || '—', color: '#0891b2' })),
                      ...consultations.map(c => ({ type: 'consultation', date: c.date_consultation || c.created_at, title: 'Consultation oncologie', detail: `Dr. ${c.medecin_nom || c.medecin || '—'}`, color: '#d97706' })),
                      ...biologie.map(b => ({ type: 'biologie', date: b.date_examen || b.created_at, title: 'Analyse biologique', detail: `${b.parametre || b.type_examen || '—'}: ${b.valeur || ''} ${b.unite || ''}`, color: '#ef4444' })),
                      ...anapath.map(a => ({ type: 'anapath', date: a.date_prelevement || a.created_at, title: 'Résultat Anapath', detail: a.type_histologique || '—', color: '#7c3aed' })),
                      ...labRequests.map(l => ({ type: 'lab', date: l.created_at, title: `Demande labo ${l.statut === 'Terminée' ? '✅' : '⏳'}`, detail: (typeof l.analyses_demandees === 'string' ? l.analyses_demandees : (Array.isArray(l.analyses_demandees) ? l.analyses_demandees.join(', ') : '—')), color: '#059669' })),
                    ].filter(a => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

                    if (allActivities.length === 0) {
                      return <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Aucune activité récente.</div>;
                    }

                    return allActivities.map((act, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '4px solid white' }}></div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                            {(() => { try { return format(parseISO(act.date), 'dd MMM yyyy'); } catch { return '—'; } })()}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{act.title}</div>
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{act.detail}</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </SectionCard>
            </div>
          </div>
        )}
        {/* ── DIAGNOSTIC ── */}
        {tab === 'diagnostic' && (
          <div style={{ animation: 'fade-in 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Dossiers de Diagnostic</h2>
              <Link to={`/cas-cancer/nouveau?patient=${id}`}
                style={{
                  padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 12,
                  background: '#0f172a', color: 'white', textDecoration: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}>
                + NOUVEAU DIAGNOSTIC
              </Link>
            </div>

            {(patient.cancer_cases || cases).length === 0
              ? <EmptyState icon="🔬" title="Aucun diagnostic" message="Veuillez initialiser un dossier oncologique pour ce patient." />
              : (patient.cancer_cases || cases).map(c => (
                <div key={c.id} style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e69ff' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4.5 9h15M4.5 15h15" /><circle cx="12" cy="12" r="10" /></svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>{c.type_cancer || 'Nouveau Dossier'}</h3>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Diagnostic posé le {c.date_diagnostic ? format(parseISO(c.date_diagnostic), 'dd MMM yyyy') : '—'}</div>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/cas-cancer/${c.id}`)}
                      style={{ padding: '8px 16px', fontSize: 12, fontWeight: 800, borderRadius: 10, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                      VOIR DÉTAILS
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>Classification ICD</div>
                      <ClinicalTableRow label="Topographie" value={c.topographie_icdo3} />
                      <ClinicalTableRow label="Morphologie" value={c.morphologie_icdo3} last />
                    </div>
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>Stadification</div>
                      <ClinicalTableRow label="Stade" value={c.stade} />
                      <ClinicalTableRow label="TNM" value={`${c.tnm_t || '?'}${c.tnm_n || '?'}${c.tnm_m || '?'}`} last />
                    </div>
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>Statut Patient</div>
                      <ClinicalTableRow label="État Vital" value={c.statut_vital} />
                      <ClinicalTableRow label="Évolution" value={c.etat} last />
                    </div>
                  </div>

                  {/* Cancer Dynamic Fields for this Case */}
                  {champsDyn.filter(cd => cd.entite === 'cancer' && valsDyn[c.id + '-' + cd.id]).length > 0 && (
                    <div style={{ marginTop: 24, padding: 20, background: '#f1f5f9', borderRadius: 20 }}>
                      <div style={{ fontSize: 10, color: '#475569', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>Attributs Spécifiques (Générateur)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {champsDyn.filter(cd => cd.entite === 'cancer' && valsDyn[c.id + '-' + cd.id]).map(cd => (
                          <ClinicalTableRow key={cd.id} label={cd.nom} value={valsDyn[c.id + '-' + cd.id]} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* ── ANAPATH ── */}
        {tab === 'anapath' && (
          <div style={{ animation: 'fade-in 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Analyses Anatomopathologiques</h2>
              <button onClick={() => setShowAnapathModal(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                + AJOUTER RÉSULTAT
              </button>
            </div>

            {anapath.length === 0 && !patient.cancer_cases?.some(c => c.anapath)
              ? <EmptyState icon="🧫" title="Aucun rapport anapath" message="L'analyse des tissus et les récepteurs hormonaux apparaîtront ici." />
              : (patient.cancer_cases?.filter(c => c.anapath) || []).map(c => {
                const a = c.anapath;
                return (
                  <div key={c.id} style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>Rapport Histologique</h3>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Prélèvement du {a.date_prelevement ? format(parseISO(a.date_prelevement), 'dd MMM yyyy') : '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        <ClinicalTableRow label="Type histologique" value={a.type_histologique} />
                        <ClinicalTableRow label="Grade tumoral" value={a.grade_sbr ? `SBR ${a.grade_sbr}` : null} />
                        <ClinicalTableRow label="Ki67" value={a.ki67} last />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {['ER', 'PR', 'HER2', 'MMR_MSI'].map(k => (
                          <div key={k} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #f1f5f9' }}>
                            <div style={{ fontSize: 9, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{a[k.toLowerCase()] || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {a.compte_rendu && (
                      <div style={{ marginTop: 28, padding: 24, background: '#f8fafc', borderRadius: 20, borderLeft: '4px solid #db2777', color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Conclusion du Pathologiste</strong>
                        {a.compte_rendu}
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        )}

        {/* ── BIOLOGIE ── */}
        {tab === 'biologie' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowRequestForm(true)}
                style={{
                  padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                  background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                Demander une analyse
              </button>
              <button onClick={() => setShowBiologieModal(true)}
                style={{
                  padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                  background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
                }}>
                + Nouveau résultat
              </button>
            </div>

            {/* Lab Requests Section */}
            {labRequests.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>Demandes en cours / Résultats Labo</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {labRequests.map(req => {
                    let analyses = [];
                    try { analyses = typeof req.analyses_demandees === 'string' ? JSON.parse(req.analyses_demandees) : req.analyses_demandees; } catch (e) { analyses = [req.analyses_demandees]; }

                    return (
                      <div key={req.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #eef2f6', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: req.statut === 'Terminée' ? '#f0fdf4' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {req.statut === 'Terminée' ? '✅' : '⏳'}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Demande du {format(parseISO(req.created_at || new Date().toISOString()), 'yyyy-MM-dd')} · Labo: {req.labo_nom || '—'}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                              {Array.isArray(analyses) ? analyses.join(', ') : analyses}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {req.statut === 'Terminée' && req.fichier_pdf ? (
                            <a href={`http://localhost:5000${req.fichier_pdf}`} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-block', padding: '8px 16px', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 13, borderRadius: 8, textDecoration: 'none' }}>
                              Voir les résultats (PDF)
                            </a>
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '6px 12px', borderRadius: 6 }}>
                              En attente
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: -10, letterSpacing: '0.5px' }}>Résultats Saisis Manuellement</div>
            {biologie.length === 0
              ? <EmptyState icon="🧪" title="Pas d'analyses" message="Commandez ou enregistrez les résultats biologiques pour ce dossier." />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 32 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {biologie.map(b => (
                      <div key={b.id} style={{ background: 'white', borderRadius: 20, border: '1.5px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: INTERP_COLORS[b.interpretation] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: INTERP_COLORS[b.interpretation] }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20" /><path d="m4.93 4.93 14.14 14.14M4.93 19.07 19.07 4.93" /></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{b.parametre}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{format(parseISO(b.date_examen), 'dd MMM yyyy')} · {b.type_examen}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: INTERP_COLORS[b.interpretation] }}>
                            {b.valeur} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{b.unite}</span>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 900, color: INTERP_COLORS[b.interpretation], textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.interpretation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 24, position: 'sticky', top: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 20, borderBottom: '1.5px solid #f1f5f9', paddingBottom: 16 }}>Tendances Biologiques</div>
                    {biologie.length < 2
                      ? <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Saisissez au moins 2 analyses pour voir l'évolution.</div>
                      : <Line data={{
                        labels: [...new Set(biologie.map(b => b.date_examen?.slice(0, 10)))].sort(),
                        datasets: [...new Set(biologie.map(b => b.parametre))].slice(0, 2).map((p, i) => ({
                          label: p,
                          data: biologie.filter(b => b.parametre === p).map(b => parseFloat(b.valeur)).filter(v => !isNaN(v)),
                          borderColor: i === 0 ? '#3b82f6' : '#ec4899',
                          borderWidth: 3, pointRadius: 4, pointBackgroundColor: 'white', tension: 0.4
                        }))
                      }} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' } } } }, scales: { y: { display: false }, x: { grid: { display: false } } } }} />
                    }
                  </div>
                </div>
              )
            }
          </div>
        )}

        {/* ── IMAGERIE ── */}
        {tab === 'imagerie' && (
          <div style={{ animation: 'fade-in 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Rapports d'Imagerie</h2>
              <button onClick={() => setShowImagerieModal(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                + AJOUTER EXAMEN
              </button>
            </div>

            {(() => {
              const imgs = imagerie.length > 0 ? imagerie : (patient.cancer_cases?.flatMap(c => c.imagerie || []) || []);
              return imgs.length === 0
                ? <EmptyState icon="🖼️" title="Pas d'imagerie" message="Les scanners, IRM et radiographies apparaîtront ici." />
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {imgs.map((img, i) => (
                      <div key={img.id || i} style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                            </div>
                            <div>
                              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>{img.type_examen}</h3>
                              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{img.date_examen ? format(parseISO(img.date_examen), 'dd MMM yyyy') : '—'}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '4px 12px', borderRadius: 8, height: 'fit-content' }}>
                            {img.region || 'Standard'}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0, padding: 20, background: '#f8fafc', borderRadius: 16 }}>
                          <strong style={{ color: '#0f172a', display: 'block', marginBottom: 8, fontSize: 11, textTransform: 'uppercase' }}>Considérations Cliniques</strong>
                          {img.conclusion || 'Aucune conclusion détaillée.'}
                        </p>
                      </div>
                    ))}
                  </div>
                );
            })()}
          </div>
        )}

        {/* ── TRAITEMENT ── */}
        {tab === 'traitement' && (
          <div style={{ animation: 'fade-in 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Protocoles Thérapeutiques</h2>
              <button onClick={() => setShowTraitementModal(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                + AJOUTER TRAITEMENT
              </button>
            </div>

            {(() => {
              const treats = traitements.length > 0 ? traitements : (patient.cancer_cases?.flatMap(c => c.traitements || []) || []);
              return treats.length === 0
                ? <EmptyState icon="💊" title="Pas de traitement" message="Définissez les protocoles de chimiothérapie ou radiothérapie." />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {treats.map((t, i) => (
                      <div key={t.id || i} style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m10.5 20.5 10-10a4.95 4.950 1 1 7 7l-10 10a4.95 4.95 0 1 1-7-7Z" /><path d="m8.5 8.5 7 7" /></svg>
                            </div>
                            <div>
                              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>{t.type_traitement} · {t.protocole || 'Protocole Standard'}</h3>
                              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Débuté le {t.date_debut ? format(parseISO(t.date_debut), 'dd MMM yyyy') : '—'}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '6px 16px', borderRadius: 100 }}>{t.statut || 'En cours'}</div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                          <div>
                            <ClinicalTableRow label="Intention Thérapeutique" value={t.intention_therapeutique} />
                            <ClinicalTableRow label="Nombre de Cycles" value={t.nb_cycles_prevus ? `${t.cycles_realises || 0} / ${t.nb_cycles_prevus}` : 'N/A'} last />
                            {t.type_traitement === 'Chimiothérapie' && t.nb_cycles_prevus > 0 && <CycleBar total={t.nb_cycles_prevus} completed={t.cycles_realises || 0} />}
                          </div>
                          <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20, border: '1.5px solid #f1f5f9' }}>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Observance & Détails</div>
                            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{t.description || 'Protocole suivi sans complications signalées.'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
            })()}
          </div>
        )}

        {/* ── CONSULTATIONS ── */}
        {tab === 'consultations' && (
          <div style={{ animation: 'fade-in 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Suivi Clinique</h2>
              <button onClick={() => setShowConsultationModal(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                + NOUVELLE CONSULTATION
              </button>
            </div>

            {(() => {
              const cons = consultations.length > 0 ? consultations : (patient.cancer_cases?.flatMap(c => c.consultations || []) || []);
              return cons.length === 0
                ? <EmptyState icon="👨‍⚕️" title="Pas de suivi" message="L'historique des visites du patient apparaîtra ici." />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {cons.map((c, i) => (
                      <div key={c.id || i} style={{ background: 'white', borderRadius: 24, padding: 28, border: '1.5px solid #f1f5f9', display: 'flex', gap: 24, alignItems: 'start' }}>
                        <div style={{ padding: '10px 16px', borderRadius: 12, background: '#f8fafc', border: '1.5px solid #f1f5f9', textAlign: 'center', minWidth: 100 }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{c.date_consultation ? format(parseISO(c.date_consultation), 'dd') : '??'}</div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>{c.date_consultation ? format(parseISO(c.date_consultation), 'MMM yyyy') : ''}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Examen de Suivi Onco</div>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Par : Dr. {patient.medecin_traitant_nom || 'Médecin Référent'}</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Motif / Observations</div>
                              <div style={{ fontSize: 13, color: '#475569' }}>{c.motif || 'Visite de contrôle de routine.'}</div>
                            </div>
                            <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 12, border: '1px solid #e0f2fe' }}>
                              <div style={{ fontSize: 10, color: '#0369a1', fontWeight: 900, textTransform: 'uppercase', marginBottom: 4 }}>Conduite à tenir</div>
                              <div style={{ fontSize: 13, color: '#0c4a6e', fontWeight: 700 }}>{c.conduite_a_tenir || 'Poursuite du protocole actuel.'}</div>
                            </div>
                          </div>
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
          <div style={{ animation: 'fade-in 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Suivi des Toxicités</h2>
              <button onClick={() => setShowEffetsModal(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                + SIGNALER EFFET
              </button>
            </div>

            {(() => {
              const eff = effets.length > 0 ? effets : patient.cancer_cases?.flatMap(c => c.effets_secondaires || []) || [];
              return eff.length === 0
                ? <EmptyState icon="⚠️" title="Aucune toxicité" message="Signalez ici les effets indésirables liés aux traitements." />
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
                    {eff.map((e, i) => (
                      <div key={e.id || i} onClick={() => setSelectedEffect(selectedEffect?.id === e.id ? null : e)} style={{ background: 'white', borderRadius: 24, border: '1.5px solid #f1f5f9', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedEffect?.id === e.id ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: GRADE_COLORS[e.grade] || '#3b82f6' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>{e.type_effet}</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, background: (GRADE_COLORS[e.grade] || '#64748b') + '15', color: GRADE_COLORS[e.grade] || '#64748b', textTransform: 'uppercase' }}>GRADE {e.grade || '?'}</span>
                              <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, background: e.resolu ? '#dcfce7' : '#fef3c7', color: e.resolu ? '#15803d' : '#d97706', textTransform: 'uppercase' }}>{e.resolu ? 'RÉSOLU' : 'ACTIF'}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{e.date_apparition ? format(parseISO(e.date_apparition), 'dd MMM yyyy') : '—'}</div>
                        </div>

                        {selectedEffect?.id === e.id && (
                          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1.5px solid #f1f5f9', animation: 'fade-in 0.3s' }}>
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Description</div>
                              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{e.description || 'Pas de description.'}</div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 10, fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 4 }}>Conduite médicale</div>
                              <div style={{ fontSize: 13, color: '#1e3a8a', fontWeight: 700, lineHeight: 1.5 }}>{e.traitement_pris || 'Aucune mesure renseignée.'}</div>
                            </div>
                            {e.date_resolution && (
                              <div style={{ padding: '10px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7' }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: '#15803d', textTransform: 'uppercase' }}>Résolu le</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>{format(parseISO(e.date_resolution), 'dd MMMM yyyy', { locale: fr })}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
            })()}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab === 'documents' && (
          <div style={{ animation: 'fade-in 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Coffre-fort Médical</h2>
              <button onClick={() => setShowDocumentModal(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 800, borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                + UPLOADER DOCUMENT
              </button>
            </div>

            {documents.length === 0
              ? <EmptyState icon="📂" title="Aucun document" message="Les comptes-rendus PDF, scanners branchés et résultats externes apparaîtront ici." />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {documents.map(d => (
                    <div key={d.id} style={{ background: 'white', borderRadius: 20, border: '1.5px solid #f1f5f9', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, transition: 'transform 0.2s', cursor: 'default', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{d.titre}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{d.categorie} · {format(parseISO(d.date_doc), 'dd MMM yyyy')}</div>
                      </div>
                      <button style={{ color: '#0f172a', fontWeight: 800, fontSize: 11, border: '1.5px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}>OUVRIR</button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── ASSISTANT IA ── */}
        {tab === 'ia' && (
          <div style={{ animation: 'fade-in 0.4s ease-out', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {["Résumer le dossier patient", "Proposer un protocole adapté", "Analyser la toxicité IHC", "Options thérapeutiques (NCCN / ESMO)"].map(q => (
                <button key={q} onClick={() => handleAiSend(null, q)} style={{ padding: '8px 20px', fontSize: 12, fontWeight: 800, borderRadius: 20, background: 'white', border: '1.5px solid #f1f5f9', cursor: 'pointer', color: '#0f172a', transition: 'all 0.2s' }}>
                  {q}
                </button>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', display: 'flex', flexDirection: 'column', height: 540, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1.5px solid #f1f5f9', fontSize: 14, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 4px #10b98120' }} />
                CONSEILLER CLINIQUE IA
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {aiMessages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ padding: '14px 20px', borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: m.role === 'user' ? '#0f172a' : '#f1f5f9', color: m.role === 'user' ? 'white' : '#0f172a', fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ alignSelf: 'flex-start', padding: '14px 20px', background: '#f1f5f9', borderRadius: '20px 20px 20px 4px' }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  </div>
                )}
                <div ref={chatBottom} />
              </div>
              <form onSubmit={handleAiSend} style={{ padding: '16px 24px', borderTop: '1.5px solid #f1f5f9', display: 'flex', gap: 12, background: '#f8fafc' }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Interroger l'IA sur ce dossier..." style={{ flex: 1, padding: '12px 24px', borderRadius: 16, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, outline: 'none', background: 'white' }} />
                <button type="submit" disabled={aiLoading || !aiInput.trim()} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: 14, padding: '0 24px', fontSize: 12, fontWeight: 900, cursor: 'pointer', opacity: (aiLoading || !aiInput.trim()) ? 0.5 : 1 }}>ENVOYER</button>
              </form>
            </div>
          </div>
        )}

        {/* ════════════════════ MODALS ════════════════════ */}

        {showTraitementModal && (
          <Modal title="Nouveau Protocole Thérapeutique" onClose={() => setShowTraitementModal(false)} onSave={handleSaveTraitement}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>Type de traitement</label>
                <select className="form-control" value={traitementForm.type_traitement} onChange={e => setTraitementForm({ ...traitementForm, type_traitement: e.target.value })}>
                  {['Chimiothérapie', 'Radiothérapie', 'Chirurgie', 'Immunothérapie', 'Hormonothérapie', 'Soins palliatifs'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Intention Thérapeutique</label>
                <select className="form-control" value={traitementForm.intention_therapeutique} onChange={e => setTraitementForm({ ...traitementForm, intention_therapeutique: e.target.value })}>
                  {['Curative', 'Adjuvante', 'Néoadjuvante', 'Palliative', 'Prophylactique'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Protocole / Molécules</label>
                <input type="text" className="form-control" placeholder="ex: FEC 100, AC-T, etc." value={traitementForm.protocole} onChange={e => setTraitementForm({ ...traitementForm, protocole: e.target.value })} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Date de début</label>
                <input type="date" className="form-control" value={traitementForm.date_debut} onChange={e => setTraitementForm({ ...traitementForm, date_debut: e.target.value })} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Nb de cycles prévus</label>
                <input type="number" className="form-control" value={traitementForm.nb_cycles_prevus} onChange={e => setTraitementForm({ ...traitementForm, nb_cycles_prevus: e.target.value })} />
              </div>

              {/* Section spécifique Chimio */}
              {(traitementForm.type_traitement === 'Chimiothérapie' || traitementForm.type_traitement === 'Immunothérapie') && (
                <>
                  <div style={sectionTitle}>Détails Systémiques</div>
                  <div style={inputGroup}>
                    <label style={labelStyle}>Ligne de traitement</label>
                    <select className="form-control" value={traitementForm.ligne_traitement} onChange={e => setTraitementForm({ ...traitementForm, ligne_traitement: e.target.value })}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}ère ligne</option>)}
                    </select>
                  </div>
                  <div style={inputGroup}>
                    <label style={labelStyle}>Voie d'administration</label>
                    <select className="form-control" value={traitementForm.voie_administration} onChange={e => setTraitementForm({ ...traitementForm, voie_administration: e.target.value })}>
                      {['Intraveineuse', 'Orale', 'Sous-cutanée', 'Intra-artérielle'].map(o => <option key={o}>{o}</option>)}
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
                    <input type="text" className="form-control" placeholder="ex: 50 Gy" value={traitementForm.radio_dose_totale} onChange={e => setTraitementForm({ ...traitementForm, radio_dose_totale: e.target.value })} />
                  </div>
                  <div style={inputGroup}>
                    <label style={labelStyle}>Nb de séances</label>
                    <input type="number" className="form-control" value={traitementForm.radio_nb_seances} onChange={e => setTraitementForm({ ...traitementForm, radio_nb_seances: e.target.value })} />
                  </div>
                </>
              )}

              {/* Section spécifique Chirurgie */}
              {traitementForm.type_traitement === 'Chirurgie' && (
                <>
                  <div style={sectionTitle}>Données Chirurgicales</div>
                  <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Type d'intervention</label>
                    <input type="text" className="form-control" placeholder="ex: Tumorectomie, Mastectomie..." value={traitementForm.chirurgie_type} onChange={e => setTraitementForm({ ...traitementForm, chirurgie_type: e.target.value })} />
                  </div>
                </>
              )}

              <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Observations / Réponse Patient</label>
                <textarea className="form-control" rows="3" value={traitementForm.description} onChange={e => setTraitementForm({ ...traitementForm, description: e.target.value })} />
              </div>
            </div>
          </Modal>
        )}

        {showConsultationModal && (
          <Modal title="Nouvelle consultation" onClose={() => setShowConsultationModal(false)} onSave={handleSaveConsultation}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Date consultation</label>
                <input type="date" className="form-control" value={consultationForm.date_consultation} onChange={e => setConsultationForm({ ...consultationForm, date_consultation: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Médecin</label>
                <input type="text" className="form-control" value={consultationForm.medecin} onChange={e => setConsultationForm({ ...consultationForm, medecin: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Motif</label>
                <input type="text" className="form-control" value={consultationForm.motif} onChange={e => setConsultationForm({ ...consultationForm, motif: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Observations</label>
                <textarea className="form-control" rows="3" value={consultationForm.examen_clinique} onChange={e => setConsultationForm({ ...consultationForm, examen_clinique: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Plan / Décision</label>
                <textarea className="form-control" rows="2" value={consultationForm.decision_medicale} onChange={e => setConsultationForm({ ...consultationForm, decision_medicale: e.target.value })} />
              </div>
            </div>
          </Modal>
        )}

        {showAnapathModal && (
          <Modal title="Nouveau Rapport Anatomopathologique" onClose={() => setShowAnapathModal(false)} onSave={handleSaveAnapath}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>Date prélèvement</label>
                <input type="date" className="form-control" value={anapathForm.date_prelevement} onChange={e => setAnapathForm({ ...anapathForm, date_prelevement: e.target.value })} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Type de Prélèvement</label>
                <select className="form-control" value={anapathForm.type_prelevement} onChange={e => setAnapathForm({ ...anapathForm, type_prelevement: e.target.value })}>
                  {['Biopsie à l\'aiguille', 'Biopsie chirurgicale', 'Exérèse chirurgicale', 'Cytologie', 'Pièce opératoire'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={sectionTitle}>Marqueurs & IHC</div>
              <div style={inputGroup}>
                <label style={labelStyle}>RE / RP</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="form-control" placeholder="RE %" value={anapathForm.er} onChange={e => setAnapathForm({ ...anapathForm, er: e.target.value })} />
                  <input type="text" className="form-control" placeholder="RP %" value={anapathForm.pr} onChange={e => setAnapathForm({ ...anapathForm, pr: e.target.value })} />
                </div>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>HER2 & Ki-67</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="form-control" placeholder="HER2 (ex: 3+)" value={anapathForm.her2} onChange={e => setAnapathForm({ ...anapathForm, her2: e.target.value })} />
                  <input type="text" className="form-control" placeholder="Ki-67 %" value={anapathForm.ki_67} onChange={e => setAnapathForm({ ...anapathForm, ki_67: e.target.value })} />
                </div>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>PD-L1</label>
                <input type="text" className="form-control" placeholder="CPS/TPS score" value={anapathForm.pd_l1} onChange={e => setAnapathForm({ ...anapathForm, pd_l1: e.target.value })} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Statut MMR / MSI</label>
                <select className="form-control" value={anapathForm.mmr_msi} onChange={e => setAnapathForm({ ...anapathForm, mmr_msi: e.target.value })}>
                  {['Stable (MSS)', 'Instable (MSI-H)', 'Inconnu'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Compte-rendu Histologique</label>
                <textarea className="form-control" rows="4" value={anapathForm.compte_rendu} onChange={e => setAnapathForm({ ...anapathForm, compte_rendu: e.target.value })} />
              </div>
            </div>
          </Modal>
        )}

        {showImagerieModal && (
          <Modal title="Nouvelle imagerie" onClose={() => setShowImagerieModal(false)} onSave={handleSaveImagerie}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" className="form-control" value={imagerieForm.date_examen} onChange={e => setImagerieForm({ ...imagerieForm, date_examen: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Modalité</label>
                <select className="form-control" value={imagerieForm.type_examen} onChange={e => setImagerieForm({ ...imagerieForm, type_examen: e.target.value })}>
                  {['Scanner', 'IRM', 'PET-scan', 'Échographie', 'Radio', 'Scintigraphie'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Région anatomique</label>
                <input type="text" className="form-control" value={imagerieForm.region} onChange={e => setImagerieForm({ ...imagerieForm, region: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Conclusion / Résultats</label>
                <textarea className="form-control" rows="4" value={imagerieForm.conclusion} onChange={e => setImagerieForm({ ...imagerieForm, conclusion: e.target.value })} />
              </div>
            </div>
          </Modal>
        )}

        {showEffetsModal && (
          <Modal title="Signaler une Toxicité / Effet Indésirable" onClose={() => setShowEffetsModal(false)} onSave={handleSaveEffets}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>Date d'apparition</label>
                <input type="date" className="form-control" value={effetsForm.date_apparition} onChange={e => setEffetsForm({ ...effetsForm, date_apparition: e.target.value })} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Grade (CTCAE)</label>
                <select className="form-control" value={effetsForm.grade} onChange={e => setEffetsForm({ ...effetsForm, grade: e.target.value })}>
                  {['Grade 1 (Léger)', 'Grade 2 (Modéré)', 'Grade 3 (Sévère)', 'Grade 4 (Vie en danger)', 'Grade 5 (Décès)'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Type d'effet / Symptôme</label>
                <input type="text" className="form-control" placeholder="ex: Neutropénie fébrile, Mucosite..." value={effetsForm.type_effet} onChange={e => setEffetsForm({ ...effetsForm, type_effet: e.target.value })} />
              </div>
              <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Traitement entrepris / Mesures</label>
                <input type="text" className="form-control" placeholder="ex: G-CSF, Suspension du traitement..." value={effetsForm.traitement_pris} onChange={e => setEffetsForm({ ...effetsForm, traitement_pris: e.target.value })} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Résolution</label>
                <select className="form-control" value={effetsForm.resolu} onChange={e => setEffetsForm({ ...effetsForm, resolu: e.target.value })}>
                  <option value="0">En cours</option>
                  <option value="1">Résolu</option>
                </select>
              </div>
              {effetsForm.resolu === "1" && (
                <div style={inputGroup}>
                  <label style={labelStyle}>Date de résolution</label>
                  <input type="date" className="form-control" value={effetsForm.date_resolution} onChange={e => setEffetsForm({ ...effetsForm, date_resolution: e.target.value })} />
                </div>
              )}
              <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                <label style={labelStyle}>Description détaillée</label>
                <textarea className="form-control" rows="3" value={effetsForm.description} onChange={e => setEffetsForm({ ...effetsForm, description: e.target.value })} />
              </div>
            </div>
          </Modal>
        )}

        {showDocumentModal && (
          <Modal title="Nouveau document" onClose={() => setShowDocumentModal(false)} onSave={handleSaveDocument}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Titre du document</label>
                <input type="text" className="form-control" value={documentForm.titre} onChange={e => setDocumentForm({ ...documentForm, titre: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select className="form-control" value={documentForm.categorie} onChange={e => setDocumentForm({ ...documentForm, categorie: e.target.value })}>
                  {['Compte-rendu', 'Ordonnance', 'Courrier', 'Facture', 'Autre'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Date du document</label>
                <input type="date" className="form-control" value={documentForm.date_doc} onChange={e => setDocumentForm({ ...documentForm, date_doc: e.target.value })} />
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
                <input type="date" className="form-control" value={bioForm.date_examen} onChange={e => setBioForm({ ...bioForm, date_examen: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Type d'examen</label>
                <select className="form-control" value={bioForm.type_examen} onChange={e => setBioForm({ ...bioForm, type_examen: e.target.value })}>
                  {['NFS', 'Biochimie', 'Marqueurs tumoraux', 'Coagulation', 'Ionogramme', 'Autre'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Paramètre / Analyse</label>
                <input type="text" className="form-control" placeholder="ex: Hémoglobine, CA-153..." value={bioForm.parametre} onChange={e => setBioForm({ ...bioForm, parametre: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Valeur</label>
                <input type="text" className="form-control" placeholder="ex: 12.4" value={bioForm.valeur} onChange={e => setBioForm({ ...bioForm, valeur: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Unité</label>
                <input type="text" className="form-control" placeholder="ex: g/dL" value={bioForm.unite} onChange={e => setBioForm({ ...bioForm, unite: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Valeur Normale</label>
                <input type="text" className="form-control" placeholder="ex: 12.0 - 16.0" value={bioForm.valeur_normale} onChange={e => setBioForm({ ...bioForm, valeur_normale: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Interprétation</label>
                <select className="form-control" value={bioForm.interpretation} onChange={e => setBioForm({ ...bioForm, interpretation: e.target.value })}>
                  {['Normal', 'Bas', 'Haut', 'Critique'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Notes techniques</label>
                <textarea className="form-control" rows="2" value={bioForm.notes} onChange={e => setBioForm({ ...bioForm, notes: e.target.value })} />
              </div>
            </div>
          </Modal>
        )}

        {/* ── MODAL DE SUPPRESSION ── */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>

            <div style={{
              background: 'white', borderRadius: 16, width: 450, maxWidth: '90%',
              padding: 30, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              animation: 'slideUp 0.3s ease-out'
            }}>

              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
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
                  style={{
                    display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: 12,
                    background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                  }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>📂 Archiver uniquement</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Le patient ne sera visible que dans les archives. Les données restent dans la base de données.</span>
                </button>

                {isAdmin && (
                  <button onClick={() => confirmDelete(true)}
                    style={{
                      display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: 12,
                      background: '#fff1f2', border: '1px solid #fecaca', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                    }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>🗑 Supprimer définitivement</span>
                    <span style={{ fontSize: 12, color: '#991b1b' }}>Toutes les traces seront effacées de la base de données. Attention : Action irréversible.</span>
                  </button>
                )}
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDeleteModal(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0',
                    color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                  }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
      {/* ── MODAL DEMANDE LABO ── */}
      {showRequestForm && (
        <Modal title="Demander une Analyse Biologique" onClose={() => setShowRequestForm(false)} onSave={handleRequestLab}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Laboratoire Destinataire</label>
              <select className="form-control" value={requestData.labo_id} onChange={e => setReq('labo_id', e.target.value)}>
                <option value="">Sélectionnez un laboratoire...</option>
                {labos.map(l => (
                  <option key={l.id} value={l.id}>{l.nom} {l.prenom}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Analyses Demandées (séparées par une virgule)</label>
              <input type="text" className="form-control" placeholder="ex: NFS, Glycémie, Bilan hépatique..."
                value={typeof requestData.analyses_demandees === 'string' ? requestData.analyses_demandees : requestData.analyses_demandees.join(', ')}
                onChange={e => setReq('analyses_demandees', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Notes pour le laboratoire</label>
              <textarea className="form-control" rows="3" placeholder="Informations cliniques, urgence, etc."
                value={requestData.notes_labo} onChange={e => setReq('notes_labo', e.target.value)} />
            </div>
          </div>
        </Modal>
      )}

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

