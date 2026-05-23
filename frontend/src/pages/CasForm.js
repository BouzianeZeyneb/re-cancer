import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { createCase, getPatients, getUsers } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ===== MAPPING TYPE → LOCALISATIONS =====
const CANCER_DATA = {
  'Cancer du Sein': {
    localisations: ['Sein droit','Sein gauche','Bilatéral','Quadrant supéro-externe droit','Quadrant supéro-externe gauche','Quadrant supéro-interne','Quadrant inféro-externe','Quadrant inféro-interne','Région centrale / mamelon','Prolongement axillaire'],
    T: ['Tx','T0','Tis','T1','T1a','T1b','T1c','T2','T3','T4','T4a','T4b','T4c','T4d'],
    N: ['Nx','N0','N1','N1mi','N2','N2a','N2b','N3','N3a','N3b','N3c'],
    M: ['M0','M1'],
    stades: ['Stade 0','Stade IA','Stade IB','Stade IIA','Stade IIB','Stade IIIA','Stade IIIB','Stade IIIC','Stade IV'],
  },
  'Cancer de la Prostate': {
    localisations: ['Lobe droit','Lobe gauche','Bilatéral','Zone périphérique','Zone transitionnelle','Zone centrale','Vésicules séminales','Extension extracapsulaire'],
    T: ['Tx','T0','T1','T1a','T1b','T1c','T2','T2a','T2b','T2c','T3','T3a','T3b','T4'],
    N: ['Nx','N0','N1'],
    M: ['M0','M1','M1a','M1b','M1c'],
    stades: ['Stade I','Stade IIA','Stade IIB','Stade IIC','Stade IIIA','Stade IIIB','Stade IIIC','Stade IVA','Stade IVB'],
  },
  'Cancer du Poumon': {
    localisations: ['Poumon droit - Lobe supérieur','Poumon droit - Lobe moyen','Poumon droit - Lobe inférieur','Poumon gauche - Lobe supérieur','Poumon gauche - Lobe inférieur','Bronche principale droite','Bronche principale gauche','Carène','Plèvre','Médiastin'],
    T: ['Tx','T0','Tis','T1','T1a','T1b','T1c','T2','T2a','T2b','T3','T4'],
    N: ['Nx','N0','N1','N2','N3'],
    M: ['M0','M1','M1a','M1b','M1c'],
    stades: ['Stade IA1','Stade IA2','Stade IA3','Stade IB','Stade IIA','Stade IIB','Stade IIIA','Stade IIIB','Stade IIIC','Stade IVA','Stade IVB'],
  },
  'Cancer Colorectal': {
    localisations: ['Côlon droit','Côlon transverse','Côlon gauche','Côlon sigmoïde','Jonction recto-sigmoïdienne','Rectum haut','Rectum moyen','Rectum bas','Canal anal','Caecum','Appendice'],
    T: ['Tx','T0','Tis','T1','T2','T3','T4','T4a','T4b'],
    N: ['Nx','N0','N1','N1a','N1b','N1c','N2','N2a','N2b'],
    M: ['M0','M1','M1a','M1b','M1c'],
    stades: ['Stade 0','Stade I','Stade IIA','Stade IIB','Stade IIC','Stade IIIA','Stade IIIB','Stade IIIC','Stade IVA','Stade IVB','Stade IVC'],
  },
  'Cancer du Col Utérin': {
    localisations: ['Exocol','Endocol','Jonction squamo-cylindrique','Extension au vagin','Extension au paramètre','Extension à la paroi pelvienne','Extension à la vessie','Extension au rectum'],
    T: ['Tx','T0','T1','T1a','T1a1','T1a2','T1b','T1b1','T1b2','T1b3','T2','T2a','T2b','T3','T3a','T3b','T4'],
    N: ['Nx','N0','N1'],
    M: ['M0','M1'],
    stades: ['Stade IA1','Stade IA2','Stade IB1','Stade IB2','Stade IB3','Stade IIA','Stade IIB','Stade IIIA','Stade IIIB','Stade IIIC1','Stade IIIC2','Stade IVA','Stade IVB'],
  },
  'Cancer du Foie': {
    localisations: ['Lobe droit','Lobe gauche','Lobe caudé','Segments I-IV','Segments V-VIII','Veine porte','Veine cave','Voies biliaires'],
    T: ['Tx','T0','T1','T1a','T1b','T2','T3','T4'],
    N: ['Nx','N0','N1'],
    M: ['M0','M1'],
    stades: ['Stade I','Stade II','Stade IIIA','Stade IIIB','Stade IVA','Stade IVB'],
  },
  'Cancer de l\'Estomac': {
    localisations: ['Cardia','Fundus','Corps gastrique','Antre','Pylore','Grande courbure','Petite courbure','Jonction œso-gastrique'],
    T: ['Tx','T0','Tis','T1','T1a','T1b','T2','T3','T4','T4a','T4b'],
    N: ['Nx','N0','N1','N2','N3','N3a','N3b'],
    M: ['M0','M1'],
    stades: ['Stade 0','Stade IA','Stade IB','Stade IIA','Stade IIB','Stade IIIA','Stade IIIB','Stade IIIC','Stade IV'],
  },
  'Cancer de la Thyroïde': {
    localisations: ['Lobe droit','Lobe gauche','Isthme','Extension extrathyroïdienne','Ganglions cervicaux','Ganglions médiastinaux'],
    T: ['Tx','T0','T1','T1a','T1b','T2','T3','T3a','T3b','T4','T4a','T4b'],
    N: ['Nx','N0','N0a','N0b','N1','N1a','N1b'],
    M: ['M0','M1'],
    stades: ['Stade I','Stade II','Stade III','Stade IVA','Stade IVB','Stade IVC'],
  },
  'Cancer de la Vessie': {
    localisations: ['Dôme','Paroi latérale droite','Paroi latérale gauche','Paroi antérieure','Paroi postérieure','Col vésical','Trigone','Urètre'],
    T: ['Tx','T0','Ta','Tis','T1','T2','T2a','T2b','T3','T3a','T3b','T4','T4a','T4b'],
    N: ['Nx','N0','N1','N2','N3'],
    M: ['M0','M1','M1a','M1b'],
    stades: ['Stade 0a','Stade 0is','Stade I','Stade II','Stade IIIA','Stade IIIB','Stade IVA','Stade IVB'],
  },
  'Cancer du Rein': {
    localisations: ['Rein droit','Rein gauche','Pôle supérieur','Pôle inférieur','Région médiane','Sinus rénal','Veine rénale','Veine cave'],
    T: ['Tx','T0','T1','T1a','T1b','T2','T2a','T2b','T3','T3a','T3b','T3c','T4'],
    N: ['Nx','N0','N1'],
    M: ['M0','M1'],
    stades: ['Stade I','Stade II','Stade III','Stade IV'],
  },
  'Lymphome': {
    localisations: ['Ganglions cervicaux','Ganglions axillaires','Ganglions inguinaux','Ganglions médiastinaux','Ganglions abdominaux','Rate','Moelle osseuse','Thymus','Amygdales','Tube digestif'],
    T: ['Non applicable'],
    N: ['Stade I Ann Arbor','Stade II Ann Arbor','Stade III Ann Arbor','Stade IV Ann Arbor'],
    M: ['Sans symptômes B','Avec symptômes B'],
    stades: ['Stade I','Stade IE','Stade II','Stade IIE','Stade III','Stade IIIE','Stade IV'],
  },
  'Leucémie': {
    localisations: ['Moelle osseuse','Sang périphérique','Ganglions lymphatiques','Rate','Foie','SNC','Testicules'],
    T: ['Non applicable'],
    N: ['Risque faible','Risque intermédiaire','Risque élevé'],
    M: ['M0','M1','M2','M3','M4','M5','M6','M7'],
    stades: ['Phase chronique','Phase accélérée','Phase blastique','Rémission complète'],
  },
  'Autre': {
    localisations: ['À préciser'],
    T: ['Tx','T0','T1','T2','T3','T4'],
    N: ['Nx','N0','N1','N2','N3'],
    M: ['M0','M1'],
    stades: ['Stade I','Stade II','Stade III','Stade IV'],
  },
};

const CANCER_TYPES = Object.keys(CANCER_DATA);

const CIM10_CANCER_CODES = [
  { code: 'C00', label: 'Tumeur maligne de la lèvre' },
  { code: 'C15', label: 'Tumeur maligne de l\'esophage' },
  { code: 'C16', label: 'Tumeur maligne de l\'estomac' },
  { code: 'C18', label: 'Tumeur maligne du côlon' },
  { code: 'C19', label: 'Tumeur maligne de la jonction rectosigmoïdienne' },
  { code: 'C20', label: 'Tumeur maligne du rectum' },
  { code: 'C22', label: 'Tumeur maligne du foie et des voies biliaires intrahépatiques' },
  { code: 'C25', label: 'Tumeur maligne du pancréas' },
  { code: 'C32', label: 'Tumeur maligne du larynx' },
  { code: 'C33', label: 'Tumeur maligne de la trachée' },
  { code: 'C34', label: 'Tumeur maligne des bronches et du poumon' },
  { code: 'C43', label: 'Mélanome malin de la peau' },
  { code: 'C44', label: 'Autres tumeurs malignes de la peau' },
  { code: 'C50', label: 'Tumeur maligne du sein' },
  { code: 'C50.1', label: 'Tumeur maligne de la portion centrale du sein' },
  { code: 'C50.2', label: 'Tumeur maligne du quadrant supéro-interne du sein' },
  { code: 'C50.3', label: 'Tumeur maligne du quadrant inféro-interne du sein' },
  { code: 'C50.4', label: 'Tumeur maligne du quadrant supéro-externe du sein' },
  { code: 'C50.5', label: 'Tumeur maligne du quadrant inféro-externe du sein' },
  { code: 'C50.8', label: 'Tumeur maligne à localisations contiguës du sein' },
  { code: 'C50.9', label: 'Tumeur maligne du sein, sans précision' },
  { code: 'C53', label: 'Tumeur maligne du col de l\'utérus' },
  { code: 'C54', label: 'Tumeur maligne du corps de l\'utérus' },
  { code: 'C56', label: 'Tumeur maligne de l\'ovaire' },
  { code: 'C61', label: 'Tumeur maligne de la prostate' },
  { code: 'C64', label: 'Tumeur maligne du rein, à l\'exception du bassinet' },
  { code: 'C67', label: 'Tumeur maligne de la vessie' },
  { code: 'C71', label: 'Tumeur maligne de l\'encéphale' },
  { code: 'C73', label: 'Tumeur maligne de la glande thyroïde' },
  { code: 'C81', label: 'Maladie de Hodgkin' },
  { code: 'C82', label: 'Lymphome folliculaire [nodulaire] non hodgkinien' },
  { code: 'C83', label: 'Lymphome diffus non hodgkinien' },
  { code: 'C90', label: 'Myélome multiple et tumeurs malignes à plasmocytes' },
  { code: 'C91', label: 'Leucémie lymphoïde' },
  { code: 'C92', label: 'Leucémie myéloïde' }
];

export default function CasForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');

  const [form, setForm] = useState({
    patient_id: patientId || '',
    type_cancer: 'Solide',
    sous_type: '',
    localisation: '',
    lateralite: '',
    code_cim10: '',
    anomalies_genetiques: '',
    type_histologique: '',
    grade_histologique: '',
    numero_bloc: '',
    etat: 'Localisé',
    stade: '',
    tnm_t: '',
    tnm_n: '',
    tnm_m: '',
    recepteur_er: 'Inconnu',
    recepteur_pr: 'Inconnu',
    her2: 'Inconnu',
    taille_cancer: '',
    nb_ganglions_envahis: '',
    sites_metastatiques: '',
    rapport_anatomopathologique: '',
    medecin_traitant: '',
    medecin_inapte: '',
    medecin_diagnostiqueur: '',
    etablissement_diagnostiqueur: '',
    numero_lecteur: '',
    base_diagnostic: '',
    date_diagnostic: new Date().toISOString().slice(0, 10),
    date_premiers_symptomes: '',
    decision_rcp: '',
    topographie_icdo3: '',
    morphologie_icdo3: '',
    comportement_code: '3',
    statut_vital: 'Vivant',
    date_dernieres_nouvelles: new Date().toISOString().slice(0, 10),
    date_deces: '',
    cause_deces: ''
  });

  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [parametres, setParametres] = useState([]);
  const [champsDynamiques, setChampsDynamiques] = useState([]);
  const [valeursDynamiques, setValeursDynamiques] = useState({});

  // Voice Dictation States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [customType, setCustomType] = useState('');
  const recognitionRef = useRef(null);
  const voiceActiveRef = useRef(false);
  const activeVoiceFieldRef = useRef(null);

  useEffect(() => {
    getPatients({ limit: 200 }).then(r => setPatients(r.data.patients || r.data));
    getUsers().then(r => setMedecins(r.data.filter(u => u.role === 'medecin' || u.role === 'admin')));
    api.get('/parametres').then(r => setParametres(r.data)).catch(()=>{});
    api.get('/champs-dynamiques?entite=cancer').then(r => setChampsDynamiques(r.data)).catch(()=>{});
  }, []);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: typeof val === 'function' ? val(prev[field]) : val }));

  const filteredPatients = patients.filter(p => {
    if (!patientSearch) return true;
    const q = patientSearch.toLowerCase();
    return `${p.nom} ${p.prenom}`.toLowerCase().includes(q) || (p.num_carte_nationale || '').includes(q);
  });

  const adminCancers = parametres.filter(p => p.categorie === 'cancer').map(p => p.valeur);
  const adminLocalites = parametres.filter(p => p.categorie === 'localite').map(p => p.valeur);
  const ALL_CANCER_TYPES = Array.from(new Set([...CANCER_TYPES.filter(t => t !== 'Autre'), ...adminCancers]));

  const currentType = showCustomType ? customType : form.type_cancer;
  const cancerInfo = CANCER_DATA[currentType] || null;
  const baseLocalisations = cancerInfo?.localisations || [];
  const ALL_LOCALISATIONS = Array.from(new Set([...baseLocalisations, ...adminLocalites]));

  const handleTypeChange = (val) => {
    if (val === '__custom__') { setShowCustomType(true); }
    else { setShowCustomType(false); set('sous_type', val); set('localisation', ''); set('stade', ''); set('tnm_t',''); set('tnm_n',''); set('tnm_m',''); }
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconnaissance vocale non supportée par ce navigateur (utilisez Chrome)'); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;
    voiceActiveRef.current = true;
    
    rec.onstart = () => { setIsListening(true); toast.success("🎤 Écoute démarrée. Dites le nom d'un champ..."); };
    rec.onresult = (e) => {
      const interimTranscript = Array.from(e.results)
        .slice(e.resultIndex)
        .map(r => r[0].transcript)
        .join('');
      
      setVoiceTranscript(interimTranscript);

      if (e.results[e.results.length - 1].isFinal) {
        const finalTranscript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
        
        const keywordToField = {
          'type de cancer': 'type_cancer', 'cancer': 'type_cancer',
          'organe': 'localisation', 'localisation': 'localisation', 'localisé': 'localisation',
          'état': 'etat', 'etat': 'etat',
          'stade': 'stade',
          'tumeur': 'tnm_t', 'tnm t': 'tnm_t', 't n m t': 'tnm_t',
          'ganglions': 'tnm_n', 'tnm n': 'tnm_n', 't n m n': 'tnm_n',
          'métastases': 'tnm_m', 'metastases': 'tnm_m', 'tnm m': 'tnm_m', 't n m m': 'tnm_m',
          'taille': 'taille_cancer',
          'numéro lecteur': 'numero_lecteur', 'lecteur': 'numero_lecteur',
          'anomalies génétiques': 'anomalies_genetiques', 'anomalies': 'anomalies_genetiques', 'génétiques': 'anomalies_genetiques',
          'rapport anatomopathologique': 'rapport_anatomopathologique', 'rapport': 'rapport_anatomopathologique', 'anapath': 'rapport_anatomopathologique',
          'décision rcp': 'decision_rcp', 'décision': 'decision_rcp', 'rcp': 'decision_rcp', 'réunion': 'decision_rcp'
        };

        const sortedKeywords = Object.keys(keywordToField).sort((a,b) => b.length - a.length);
        const keywordRegex = new RegExp(`(?<![A-Za-zÀ-ÖØ-öø-ÿ])(${sortedKeywords.join('|')})(?![A-Za-zÀ-ÖØ-öø-ÿ])`, 'gi');
        const tokens = finalTranscript.split(keywordRegex);

        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          if (!token || !token.trim()) continue;

          const lowerToken = token.trim().toLowerCase();
          
          if (sortedKeywords.includes(lowerToken)) {
            activeVoiceFieldRef.current = keywordToField[lowerToken];
            setActiveVoiceField(activeVoiceFieldRef.current);
            toast.success(`🎤 Champ: ${activeVoiceFieldRef.current.toUpperCase()}`);
          } else {
            if (activeVoiceFieldRef.current) {
              handleVoiceValue(activeVoiceFieldRef.current, lowerToken);
            }
          }
        }
      }
    };
    rec.onerror = (e) => { 
      if (e.error === 'no-speech') return;
      if (e.error === 'not-allowed') { toast.error('⛔ Accès microphone refusé. Vérifiez les permissions du navigateur.'); voiceActiveRef.current = false; setVoiceMode(false); }
      else { toast.error('Erreur microphone: ' + e.error); }
      setIsListening(false); 
    };
    rec.onend = () => { 
      setIsListening(false); 
      setVoiceTranscript(''); 
      // Auto-reprise : créer une NOUVELLE instance (rec.start() sur instance terminée échoue)
      if (voiceActiveRef.current) {
        setTimeout(() => { if (voiceActiveRef.current) startVoice(); }, 400);
      }
    };
    rec.start();
    recognitionRef.current = rec;
  };

  const handleVoiceValue = (field, text) => {
    if (!text) return;
    let formattedText = text.charAt(0).toUpperCase() + text.slice(1);

    if (field === 'sous_type') {
      const match = ALL_CANCER_TYPES.find(t => t.toLowerCase().includes(text.toLowerCase()));
      if (match) { handleTypeChange(match); toast.success(`✅ Type: ${match}`); }
      else { setCustomType(formattedText); setShowCustomType(true); toast.success(`✅ Type personnalisé: ${formattedText}`); }
    } else if (field === 'localisation') {
      const match = ALL_LOCALISATIONS.find(l => l.toLowerCase().includes(text.toLowerCase()));
      if (match) { set('localisation', match); toast.success(`✅ Organe: ${match}`); }
      else { set('localisation', formattedText); toast.success(`✅ Organe: ${formattedText}`); }
    } else if (field === 'etat') {
      if (text.toLowerCase().includes('localis')) { set('etat', 'Localisé'); toast.success('✅ État: Localisé'); }
      else if (text.toLowerCase().includes('méta') || text.toLowerCase().includes('meta')) { set('etat', 'Métastase'); toast.success('✅ État: Métastatique'); }
    } else if (field === 'taille_cancer') {
      const nums = text.match(/[\d.,]+/);
      if (nums) { set('taille_cancer', nums[0].replace(',','.')); toast.success(`✅ Taille: ${nums[0]}`); }
    } else if (['tnm_t', 'tnm_n', 'tnm_m', 'stade'].includes(field)) {
      set(field, text.toUpperCase().replace(/\s/g, ''));
      toast.success(`✅ ${field.toUpperCase()}: ${text.toUpperCase()}`);
    } else {
      set(field, prev => (prev ? prev + ' ' + formattedText : formattedText));
      toast.success(`✅ ${field}: Ajouté au texte`);
    }
  };

  const stopVoice = () => { 
    voiceActiveRef.current = false; 
    recognitionRef.current?.stop(); 
    setIsListening(false); 
    setVoiceMode(false); 
    setActiveVoiceField(null);
    activeVoiceFieldRef.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.date_diagnostic) return setError('Champs obligatoires manquants');
    
    // Validation des champs dynamiques obligatoires
    const missingChamps = champsDynamiques.filter(c => c.obligatoire && !valeursDynamiques[c.id]);
    if (missingChamps.length > 0) {
      setError(`Veuillez remplir les champs obligatoires : ${missingChamps.map(c => c.nom).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form, sous_type: showCustomType ? customType : form.sous_type };
      const res = await createCase(payload);
      const caseId = res.data.id || res.data; // Depending on API response shape

      const valeurs = Object.entries(valeursDynamiques).map(([champ_id, valeur]) => ({ champ_id, valeur }));
      if (valeurs.length) await api.post('/valeurs-dynamiques', { record_id: caseId, valeurs });

      toast.success('Cas de cancer enregistré');
      navigate(`/cas-cancer/${caseId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };



  return (
    <Layout title="">
      <div style={{ padding: '0 12px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)}
            style={{ 
              background: 'white', border: '1.5px solid #f1f5f9', cursor: 'pointer', 
              width: 44, height: 44, color: '#64748b', 
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' 
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Nouveau Dossier Cancer</h1>
            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginTop: 4 }}>Standardisation FIGO / TNM / ICD-O-3</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <button type="button" 
                onClick={() => { if (!voiceMode) { setVoiceMode(true); startVoice(); } else { stopVoice(); } }}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                    background: voiceMode ? '#fef2f2' : 'white', 
                    border: `1.5px solid ${voiceMode ? '#fee2e2' : '#f1f5f9'}`,
                    color: voiceMode ? '#ef4444' : '#64748b',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                {voiceMode ? 'DICTÉE ACTIVE' : 'MODE VOCAL'}
             </button>
          </div>
        </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Section 1: Informations Cliniques */}
          <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e69ff' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Parcours Patient</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>Patient Référent *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-control"
                    style={{ height: 50, paddingLeft: 44, borderRadius: 14, fontWeight: 700, fontSize: 15 }}
                    placeholder="Chercher par nom ou carte..." 
                    value={patientSearch} 
                    onChange={e => {
                      setPatientSearch(e.target.value);
                      if (e.target.value === '') set('patient_id', '');
                    }} 
                  />
                  <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                </div>
                {patientSearch && !form.patient_id && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'white', borderRadius: 16, border: '1.5px solid #f1f5f9', marginTop: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {filteredPatients.slice(0, 5).map(p => (
                      <div key={p.id} onClick={() => { set('patient_id', p.id); setPatientSearch(`${p.prenom} ${p.nom}`); }}
                        style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'all 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{p.prenom} {p.nom}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>ID: {p.num_carte_nationale || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
                {form.patient_id && <div style={{ fontSize: 12, color: '#10b981', marginTop: 8, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    IDENTITÉ VÉRIFIÉE
                </div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Date Diagnostic *</label>
                  <input type="date" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.date_diagnostic} onChange={e => set('date_diagnostic', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Premiers Symptômes</label>
                  <input type="date" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.date_premiers_symptomes} onChange={e => set('date_premiers_symptomes', e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Établissement Diagnostic</label>
                <input className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} placeholder="Hôpital, Clinique..." value={form.etablissement_diagnostiqueur} onChange={e => set('etablissement_diagnostiqueur', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Médecin Référent</label>
                <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.medecin_traitant} onChange={e => set('medecin_traitant', e.target.value)}>
                  <option value="">Non sollicité</option>
                  {medecins.map(m => <option key={m.id} value={m.id}>Dr. {m.nom} {m.prenom}</option>)}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Base du diagnostic</label>
                <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.base_diagnostic} onChange={e => set('base_diagnostic', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {['Histologie','Cytologie','Imagerie','Clinique','Marqueurs tumoraux'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: 🧬 Tumeur & Histologie */}
          <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Histologie & Localisation</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Type Majeur *</label>
                  <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800, color: '#ef4444' }} value={form.type_cancer} onChange={e => set('type_cancer', e.target.value)} required>
                    <option value="Solide">🧫 Tumeur Solide</option>
                    <option value="Liquide">🩸 Hémopathie</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Organe / Siège *</label>
                  <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800 }} value={showCustomType ? '__custom__' : form.sous_type} onChange={e => handleTypeChange(e.target.value)} required>
                    <option value="">Sélectionner</option>
                    {ALL_CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="__custom__">+ Autre siège...</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Localisation Précise</label>
                  <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.localisation} onChange={e => set('localisation', e.target.value)}>
                    <option value="">Sélectionner</option>
                    {ALL_LOCALISATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Latéralité</label>
                  <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.lateralite} onChange={e => set('lateralite', e.target.value)}>
                    <option value="">N/A</option>
                    <option value="Droit">Droit</option>
                    <option value="Gauche">Gauche</option>
                    <option value="Bilatéral">Bilatéral</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Type Histologique (Libellé)</label>
                <input className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} placeholder="Ex: Adénocarcinome..." value={form.type_histologique} onChange={e => set('type_histologique', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Code Topographie (C...)</label>
                  <input className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#6366f1' }} placeholder="C50.9" value={form.topographie_icdo3} onChange={e => set('topographie_icdo3', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Code Morphologie (M...)</label>
                  <input className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#6366f1' }} placeholder="M8500/3" value={form.morphologie_icdo3} onChange={e => set('morphologie_icdo3', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: 📊 Stadification & Marqueurs */}
        <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, marginTop: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 13.5-13.5z"/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Stadification TNM & Biomarqueurs</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>T (Tumeur)</label>
                <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 900, fontSize: 18, color: '#0f172a', border: '2px solid #f1f5f9' }} value={form.tnm_t} onChange={e => set('tnm_t', e.target.value)}>
                   <option value="">—</option>
                   {(cancerInfo?.T || ['T1','T2','T3','T4']).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>N (Adénopathie)</label>
                <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 900, fontSize: 18, color: '#0f172a', border: '2px solid #f1f5f9' }} value={form.tnm_n} onChange={e => set('tnm_n', e.target.value)}>
                   <option value="">—</option>
                   {(cancerInfo?.N || ['N0','N1','N2','N3']).map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>M (Métastase)</label>
                <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 900, fontSize: 18, color: '#0f172a', border: '2px solid #f1f5f9' }} value={form.tnm_m} onChange={e => set('tnm_m', e.target.value)}>
                   <option value="">—</option>
                   {(cancerInfo?.M || ['M0','M1']).map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>Stade Final</label>
                <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 900, fontSize: 18, color: '#2563eb', border: '2px solid #dbeafe', background: '#f0f9ff' }} value={form.stade} onChange={e => set('stade', e.target.value)}>
                   <option value="">—</option>
                   {(cancerInfo?.stades || ['I','II','III','IV']).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>État Extension</label>
                <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 900, fontSize: 15 }} value={form.etat} onChange={e => set('etat', e.target.value)}>
                   <option value="Localisé">Localisé</option>
                   <option value="Métastase">Métastatique</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20 }}>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Taille Tumeur (cm)</label>
                    <input type="number" step="0.1" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} placeholder="0.0" value={form.taille_cancer} onChange={e => set('taille_cancer', e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Récepteur Œstrogène (ER)</label>
                    <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.recepteur_er} onChange={e => set('recepteur_er', e.target.value)}>
                        <option value="Inconnu">Inconnu</option>
                        <option value="Positif">Positif (+)</option>
                        <option value="Négatif">Négatif (-)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Récepteur Progestérone (PR)</label>
                    <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.recepteur_pr} onChange={e => set('recepteur_pr', e.target.value)}>
                        <option value="Inconnu">Inconnu</option>
                        <option value="Positif">Positif (+)</option>
                        <option value="Négatif">Négatif (-)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>HER2 (Statut IHC)</label>
                    <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700 }} value={form.her2} onChange={e => set('her2', e.target.value)}>
                        <option value="Inconnu">Inconnu</option>
                        <option value="Positif">Positif (+)</option>
                        <option value="Négatif">Négatif (-)</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Section 4: 📝 Champs Dynamiques */}
        {champsDynamiques.length > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: 28, border: '1.5px dashed #cbd5e1', padding: 32, marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1.5px solid #e2e8f0' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 13.5-13.5z"/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Attributs Spécifiques (Générateur)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                {champsDynamiques.map(c => (
                  <div className="form-group" key={c.id}>
                    <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#64748b', marginBottom: 8, display: 'block' }}>{c.nom} {c.obligatoire ? '*' : ''}</label>
                    {c.type_champ === 'liste' ? (
                      <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700, background: 'white', border: '1.5px solid #e2e8f0' }}
                        value={valeursDynamiques[c.id] || ''} 
                        onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: e.target.value })}
                        required={c.obligatoire}>
                        <option value="">Sélectionner</option>
                        {c.options_liste?.split(',').map(o => <option key={o.trim()} value={o.trim()}>{o.trim()}</option>)}
                      </select>
                    ) : c.type_champ === 'booleen' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48 }}>
                        <input type="checkbox" checked={valeursDynamiques[c.id] === 'true'} onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: String(e.target.checked) })} style={{ width: 20, height: 20 }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Oui / Non</span>
                      </div>
                    ) : (
                      <input 
                        type={c.type_champ === 'nombre' ? 'number' : c.type_champ === 'date' ? 'date' : 'text'}
                        className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 700, background: 'white', border: '1.5px solid #e2e8f0' }}
                        value={valeursDynamiques[c.id] || ''}
                        onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: e.target.value })}
                        required={c.obligatoire}
                        placeholder={c.nom}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Section 5: 🏥 Suivi & État Vital */}
        <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, marginTop: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Suivi Post-Thérapeutique</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>Statut Vital</label>
                <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800, border: '1.5px solid #f1f5f9' }} value={form.statut_vital} onChange={e => set('statut_vital', e.target.value)}>
                  <option value="Vivant">VIVANT</option>
                  <option value="Décédé">DÉCÉDÉ</option>
                  <option value="Inconnu">PERDU DE VUE</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>Dernier Contact Clinique</label>
                <input type="date" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800, border: '1.5px solid #f1f5f9' }} value={form.date_dernieres_nouvelles} onChange={e => set('date_dernieres_nouvelles', e.target.value)} />
              </div>
              {form.statut_vital === 'Décédé' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#ef4444', marginBottom: 8, display: 'block' }}>Date du Décès</label>
                  <input type="date" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800, border: '1.5px solid #fecaca', background: '#fef2f2' }} value={form.date_deces} onChange={e => set('date_deces', e.target.value)} />
                </div>
              )}
            </div>
            
            {form.statut_vital === 'Décédé' && (
              <div className="form-group" style={{ marginTop: 24 }}>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>Cause Déterminante</label>
                <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 800, border: '1.5px solid #f1f5f9' }} value={form.cause_deces} onChange={e => set('cause_deces', e.target.value)}>
                  <option value="">Sélectionner...</option>
                  <option value="Cancer">Liée au processus cancéreux</option>
                  <option value="Traitement">Liée à la toxicité thérapeutique (iaterogène)</option>
                  <option value="Autre">Comorbidité ou cause externe</option>
                  <option value="Inconnue">Non documentée</option>
                </select>
              </div>
            )}
        </div>

        {isListening && (
           <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', padding: '16px 32px', borderRadius: 100, border: '2px solid #ef4444', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', minWidth: 400 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ef4444', animation: 'voice-pulse 1.2s infinite' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>Agent AI en écoute</div>
                    <div style={{ fontSize: 14, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{voiceTranscript || 'Dites un champ (ex: "Stade", "Tumeur")...'}</div>
                </div>
                <button type="button" onClick={stopVoice} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 50, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>ARRÊTER</button>
           </div>
        )}

        <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', marginTop: 40, borderTop: '1.5px solid #f1f5f9', paddingTop: 40 }}>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '0 32px', height: 50, borderRadius: 16, border: '1.5px solid #f1f5f9', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button type="submit" disabled={loading} style={{ padding: '0 48px', height: 50, borderRadius: 16, background: '#0f172a', border: 'none', color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 10px 30px rgba(15,23,42,0.3)' }}>
            {loading ? 'ENREGISTREMENT...' : 'CONFIRMER & CRÉER DOSSIER'}
          </button>
        </div>
      </form>
      </div>
      <style>{`
        @keyframes voice-pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </Layout>
  );
}
