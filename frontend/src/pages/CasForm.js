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
    decision_rcp: ''
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
  const recognitionRef = useRef(null);

  useEffect(() => {
    getPatients({ limit: 200 }).then(r => setPatients(r.data.patients || r.data));
    getUsers().then(r => setMedecins(r.data.filter(u => u.role === 'medecin' || u.role === 'admin')));
    api.get('/parametres').then(r => setParametres(r.data)).catch(()=>{});
    api.get('/champs-dynamiques?entite=cancer').then(r => setChampsDynamiques(r.data)).catch(()=>{});
  }, []);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

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
      toast.error('Reconnaissance vocale non supportée'); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;
    
    let currentActiveField = null;

    rec.onstart = () => { setIsListening(true); setActiveVoiceField(null); toast.success("Écoute démarrée. Dites le nom d'un champ..."); };
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
            currentActiveField = keywordToField[lowerToken];
            setActiveVoiceField(currentActiveField);
            toast.success(`🎤 Champ: ${currentActiveField.toUpperCase()}`);
          } else {
            if (currentActiveField) {
              handleVoiceValue(currentActiveField, lowerToken);
            }
          }
        }
      }
    };
    rec.onerror = (e) => { 
      if (e.error === 'no-speech') return;
      toast.error('Erreur microphone'); 
      setIsListening(false); 
      setActiveVoiceField(null);
    };
    rec.onend = () => { 
      setIsListening(false); 
      setVoiceTranscript(''); 
      setActiveVoiceField(null);
      currentActiveField = null;
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

  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.date_diagnostic) return setError('Champs obligatoires manquants');
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
    <Layout title="Nouveau Diagnostic">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Nouveau Diagnostic</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Complétion du dossier oncologique</div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Informations Cliniques */}
        <div className="form-section-modern">
          <div className="form-section-header">
            <span style={{ fontSize: 20 }}>👤</span>
            <h3>Informations Cliniques</h3>
          </div>
          <div className="form-section-body">
            <div className="form-grid-modern">
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Patient *</label>
                <div className="search-bar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input 
                    placeholder="Rechercher par nom..." 
                    value={patientSearch} 
                    onChange={e => {
                      setPatientSearch(e.target.value);
                      if (e.target.value === '') set('patient_id', '');
                    }} 
                  />
                </div>
                {patientSearch && !form.patient_id && (
                  <div className="search-results">
                    {filteredPatients.slice(0, 5).map(p => (
                      <div key={p.id} className="search-result-item" onClick={() => {
                        set('patient_id', p.id);
                        setPatientSearch(`${p.prenom} ${p.nom}`);
                      }}>
                        <div className="search-result-name">{p.prenom} {p.nom}</div>
                        <div className="search-result-meta">{p.num_carte_nationale || 'Sans ID'}</div>
                      </div>
                    ))}
                    {filteredPatients.length === 0 && <div className="search-result-item">Aucun patient trouvé</div>}
                  </div>
                )}
                {form.patient_id && <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 4, fontWeight: 600 }}>Patient sélectionné ✓</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Date du diagnostic *</label>
                <input type="date" className="form-control" value={form.date_diagnostic} onChange={e => set('date_diagnostic', e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Date 1ers symptômes</label>
                <input type="date" className="form-control" value={form.date_premiers_symptomes} onChange={e => set('date_premiers_symptomes', e.target.value)} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Établissement diagnostiqueur</label>
                <input className="form-control" placeholder="Lieu de diagnostic..." value={form.etablissement_diagnostiqueur} onChange={e => set('etablissement_diagnostiqueur', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Médecin diagnostiqueur</label>
                <input className="form-control" placeholder="Dr. XYZ..." value={form.medecin_diagnostiqueur} onChange={e => set('medecin_diagnostiqueur', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Médecin Traitant (Interne)</label>
                <select className="form-control" value={form.medecin_traitant} onChange={e => set('medecin_traitant', e.target.value)}>
                  <option value="">Non assigné</option>
                  {medecins.map(m => <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Médecin Inapte (si applicable)</label>
                <select className="form-control" value={form.medecin_inapte} onChange={e => set('medecin_inapte', e.target.value)}>
                  <option value="">Aucun</option>
                  {medecins.map(m => <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base de diagnostic</label>
                <select className="form-control" value={form.base_diagnostic} onChange={e => set('base_diagnostic', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {['Histologie','Cytologie','Imagerie','Clinique','Marqueurs tumoraux'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 🧬 Tumeur & Histologie */}
        <div className="form-section-modern">
          <div className="form-section-header">
            <span style={{ fontSize: 20 }}>🧬</span>
            <h3>Tumeur & Histologie</h3>
          </div>
          <div className="form-section-body">
            <div className="form-grid-modern">
              <div className="form-group">
                <label className="form-label">Type Majoritaire *</label>
                <select className="form-control" value={form.type_cancer} onChange={e => set('type_cancer', e.target.value)} required>
                  <option value="Solide">🧫 Solide</option>
                  <option value="Liquide">🩸 Liquide (Hématologie)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sous-type / Nom du cancer *</label>
                <select className="form-control" value={showCustomType ? '__custom__' : form.sous_type} onChange={e => handleTypeChange(e.target.value)} required>
                  <option value="">Sélectionner</option>
                  {ALL_CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="__custom__">+ Autre nom personnalisé...</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Organe / Localisation</label>
                <select className="form-control" value={form.localisation} onChange={e => set('localisation', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {ALL_LOCALISATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Latéralité</label>
                <select className="form-control" value={form.lateralite} onChange={e => set('lateralite', e.target.value)}>
                  <option value="">N/A</option>
                  <option value="Droit">Droit</option>
                  <option value="Gauche">Gauche</option>
                  <option value="Bilatéral">Bilatéral</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Code CIM-10</label>
                <input className="form-control" placeholder="Ex: C50..." value={form.code_cim10} onChange={e => set('code_cim10', e.target.value)} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Type Histologique</label>
                <input className="form-control" placeholder="Ex: Carcinome canalaire infiltrant..." value={form.type_histologique} onChange={e => set('type_histologique', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Grade</label>
                <input className="form-control" placeholder="I, II, III..." value={form.grade_histologique} onChange={e => set('grade_histologique', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">N° Bloc / CompteRendu</label>
                <input className="form-control" placeholder="N°..." value={form.numero_bloc} onChange={e => set('numero_bloc', e.target.value)} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Anomalies Génétiques</label>
                <input className="form-control" placeholder="BRCA, EGFR..." value={form.anomalies_genetiques} onChange={e => set('anomalies_genetiques', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: 📊 Stadification & Marqueurs */}
        <div className="form-section-modern">
          <div className="form-section-header">
            <span style={{ fontSize: 20 }}>📊</span>
            <h3>Stadification & Marqueurs</h3>
          </div>
          <div className="form-section-body">
            <div className="form-grid-modern" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">TNM — T</label>
                <select className="form-control" value={form.tnm_t} onChange={e => set('tnm_t', e.target.value)}>
                   <option value=""></option>
                   {(cancerInfo?.T || ['T1','T2','T3','T4']).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">N</label>
                <select className="form-control" value={form.tnm_n} onChange={e => set('tnm_n', e.target.value)}>
                   <option value=""></option>
                   {(cancerInfo?.N || ['N0','N1','N2','N3']).map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">M</label>
                <select className="form-control" value={form.tnm_m} onChange={e => set('tnm_m', e.target.value)}>
                   <option value=""></option>
                   {(cancerInfo?.M || ['M0','M1']).map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label className="form-label">Stade Globl</label>
                <select className="form-control" value={form.stade} onChange={e => set('stade', e.target.value)}>
                   <option value=""></option>
                   {(cancerInfo?.stades || ['I','II','III','IV']).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label className="form-label">État</label>
                <select className="form-control" value={form.etat} onChange={e => set('etat', e.target.value)}>
                   <option value="Localisé">Localisé</option>
                   <option value="Métastase">Métastatique</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label className="form-label">Taille (cm)</label>
                <input type="number" step="0.1" className="form-control" placeholder="ex: 2.5" value={form.taille_cancer} onChange={e => set('taille_cancer', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label className="form-label">Ganglions envahis</label>
                <input type="number" className="form-control" placeholder="Nombre..." value={form.nb_ganglions_envahis} onChange={e => set('nb_ganglions_envahis', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label className="form-label">Sites métastatiques</label>
                <input className="form-control" placeholder="Os, Foie, Cerveau..." value={form.sites_metastatiques} onChange={e => set('sites_metastatiques', e.target.value)} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label className="form-label">Récepteur ER</label>
                <select className="form-control" value={form.recepteur_er} onChange={e => set('recepteur_er', e.target.value)}>
                   <option value="Inconnu">Inconnu / Non Testé</option>
                   <option value="Positif">Positif (+)</option>
                   <option value="Négatif">Négatif (-)</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label className="form-label">Récepteur PR</label>
                <select className="form-control" value={form.recepteur_pr} onChange={e => set('recepteur_pr', e.target.value)}>
                   <option value="Inconnu">Inconnu / Non Testé</option>
                   <option value="Positif">Positif (+)</option>
                   <option value="Négatif">Négatif (-)</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label className="form-label">HER2</label>
                <select className="form-control" value={form.her2} onChange={e => set('her2', e.target.value)}>
                   <option value="Inconnu">Inconnu / Non Testé</option>
                   <option value="Positif">Positif (+)</option>
                   <option value="Négatif">Négatif (-)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: 📋 Informations complémentaires */}
        <div className="form-section-modern">
          <div className="form-section-header">
            <span style={{ fontSize: 20 }}>📋</span>
            <h3>Informations complémentaires</h3>
          </div>
          <div className="form-section-body">
            <div className="form-group">
              <label className="form-label">Rapport anatomopathologique / Notes cliniques</label>
              <textarea className="form-control" rows={3} placeholder="Résumé du rapport ou notes..." value={form.rapport_anatomopathologique} onChange={e => set('rapport_anatomopathologique', e.target.value)} />
            </div>
            <div className="form-grid-modern">
              <div className="form-group">
                <label className="form-label">N° Lecteur / Dossier</label>
                <input className="form-control" placeholder="Identifiant interne..." value={form.numero_lecteur} onChange={e => set('numero_lecteur', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Décision RCP</label>
                <input className="form-control" placeholder="S'il y a eu une Réunion de Concertation Pluridisciplinaire..." value={form.decision_rcp} onChange={e => set('decision_rcp', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '⏳ Enregistrement...' : '💾 Créer le diagnostic'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
