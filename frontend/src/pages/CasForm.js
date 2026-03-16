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

export default function CasForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');

  const [form, setForm] = useState({
    patient_id: patientId || '',
    type_cancer: '',
    sous_type: '',
    localisation: '',
    anomalies_genetiques: '',
    etat: 'Localisé',
    stade: '',
    tnm_t: '',
    tnm_n: '',
    tnm_m: '',
    taille_cancer: '',
    rapport_anatomopathologique: '',
    medecin_traitant: '',
    numero_lecteur: '',
    date_diagnostic: new Date().toISOString().slice(0, 10),
    decision_rcp: ''
  });

  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [customType, setCustomType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [parametres, setParametres] = useState([]);

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
    else { setShowCustomType(false); set('type_cancer', val); set('sous_type', ''); set('localisation', ''); set('stade', ''); set('tnm_t',''); set('tnm_n',''); set('tnm_m',''); }
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

    if (field === 'type_cancer') {
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
      const payload = { ...form, type_cancer: showCustomType ? customType : form.type_cancer };
      const res = await createCase(payload);
      toast.success('Cas de cancer enregistré');
      navigate(`/cas-cancer/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const Section = ({ title, icon, children }) => (
    <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ fontWeight:700, fontSize:15, color:'#0f172a' }}>{title}</span>
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  );

  return (
    <Layout title="Nouveau Diagnostic">
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Nouveau Diagnostic</h1>
          <div style={{ fontSize:13, color:'#64748b' }}>Saisie complète avec descripteurs dynamiques</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button type="button" className={`btn ${voiceMode ? 'btn-danger' : 'btn-outline'}`} onClick={() => setVoiceMode(!voiceMode)}>
            🎤 {voiceMode ? 'Vocal ON' : 'Mode Vocal'}
          </button>
          {voiceMode && (
            <button type="button" className={`btn ${isListening ? 'btn-danger' : 'btn-outline'}`} onClick={() => isListening ? stopVoice() : startVoice()}>
              {isListening ? '⏹ Arrêter Dictée' : '▶ Démarrer Dictée Intelligente'}
            </button>
          )}
        </div>
      </div>

      {voiceMode && (
        <div style={{ background:'#f0f9ff', padding:'10px 24px', borderBottom:'1px solid #e2e8f0', fontSize:13, color:'#0369a1', marginBottom: 16 }}>
          💡 Dites le nom du champ pour l'activer, puis dictez sa valeur. <br/>
          <em>Exemple: "Type de cancer Sein" (pause) "Taille 2.5" (pause) "Organe Sein gauche" (pause) "Rapport anapath présence de..."</em>
        </div>
      )}

      {isListening && (
        <div style={{ background:'#fee2e2', border:'2px solid #e63946', borderRadius:12, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#e63946', animation:'pulse 1s infinite' }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:'#991b1b' }}>🎤 Écoute en mode continu...</div>
            {activeVoiceField && <div style={{ fontWeight:600, color:'#e63946', fontSize:14, marginTop:2 }}>↳ Champ courant: {activeVoiceField.toUpperCase()}</div>}
            <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>{voiceTranscript || 'Dites "Type de cancer", "Stade", "Rapport" suivi de la valeur...'}</div>
          </div>
          <button type="button" className="btn btn-sm" style={{ background:'#e63946', color:'white', border:'none' }} onClick={stopVoice}>⏹ Arrêter</button>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom:16 }}>{error}</div>}

      <Section title="Informations générales" icon="👤">
        <div className="form-row">
          <div className="form-group" style={{ flex:2 }}>
            <label className="form-label">Patient *</label>
            <input className="form-control" placeholder="🔍 Rechercher un patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} style={{ marginBottom:6 }} />
            <select className="form-control" value={form.patient_id} onChange={e => set('patient_id', e.target.value)} required>
              <option value="">Sélectionner un patient</option>
              {filteredPatients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom} — {p.num_carte_nationale || 'N/A'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date du diagnostic *</label>
            <input type="date" className="form-control" value={form.date_diagnostic} onChange={e => set('date_diagnostic', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Médecin responsable</label>
            <select className="form-control" value={form.medecin_traitant} onChange={e => set('medecin_traitant', e.target.value)}>
              <option value="">Ex: Dr. Khelifi</option>
              {medecins.map(m => <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Type de cancer" icon="🩺">
        <div className="form-row">
          <div className="form-group" style={{ flex:1 }}>
            <label className="form-label">Type de cancer *</label>
            {!showCustomType ? (
              <select className="form-control" value={form.type_cancer} onChange={e => handleTypeChange(e.target.value)} required style={activeVoiceField === 'type_cancer' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}}>
                <option value="">Sélectionner</option>
                {ALL_CANCER_TYPES.map(t => <option key={t}>{t}</option>)}
                <option value="Autre">Autre</option>
                <option value="__custom__">+ Saisie libre...</option>
              </select>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <input className="form-control" placeholder="Saisir le type de cancer..." value={customType} onChange={e => setCustomType(e.target.value)} autoFocus style={activeVoiceField === 'type_cancer' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setShowCustomType(false); set('type_cancer',''); }}>↩</button>
              </div>
            )}
          </div>
          <div className="form-group" style={{ flex:1 }}>
            <label className="form-label">Organe / Localisation</label>
            {ALL_LOCALISATIONS.length > 0 ? (
              <select className="form-control" value={form.localisation} onChange={e => set('localisation', e.target.value)} style={activeVoiceField === 'localisation' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}}>
                <option value="">Sélectionner l'organe</option>
                {ALL_LOCALISATIONS.map(l => <option key={l}>{l}</option>)}
                <option value="__other__">+ Autre localisation</option>
              </select>
            ) : (
              <input className="form-control" placeholder="Ex: Sein gauche, Lobe droit..." value={form.localisation} onChange={e => set('localisation', e.target.value)} style={activeVoiceField === 'localisation' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
            )}
            {form.localisation === '__other__' && (
              <input className="form-control" style={{ marginTop:6, ...(activeVoiceField === 'localisation' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}) }} placeholder="Préciser la localisation..." onChange={e => set('localisation', e.target.value)} autoFocus />
            )}
          </div>
        </div>
      </Section>

      <Section title="Classification TNM" icon="📊">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">T — Tumeur primitive</label>
            {cancerInfo ? (
              <select className="form-control" value={form.tnm_t} onChange={e => set('tnm_t', e.target.value)} style={activeVoiceField === 'tnm_t' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}}>
                <option value="">T</option>
                {cancerInfo.T.map(t => <option key={t}>{t}</option>)}
              </select>
            ) : (
              <input className="form-control" placeholder="T1, T2..." value={form.tnm_t} onChange={e => set('tnm_t', e.target.value)} style={activeVoiceField === 'tnm_t' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
            )}
          </div>
          <div className="form-group">
            <label className="form-label">N — Ganglions régionaux</label>
            {cancerInfo ? (
              <select className="form-control" value={form.tnm_n} onChange={e => set('tnm_n', e.target.value)} style={activeVoiceField === 'tnm_n' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}}>
                <option value="">N</option>
                {cancerInfo.N.map(n => <option key={n}>{n}</option>)}
              </select>
            ) : (
              <input className="form-control" placeholder="N0, N1..." value={form.tnm_n} onChange={e => set('tnm_n', e.target.value)} style={activeVoiceField === 'tnm_n' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
            )}
          </div>
          <div className="form-group">
            <label className="form-label">M — Métastases à distance</label>
            {cancerInfo ? (
              <select className="form-control" value={form.tnm_m} onChange={e => set('tnm_m', e.target.value)} style={activeVoiceField === 'tnm_m' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}}>
                <option value="">M</option>
                {cancerInfo.M.map(m => <option key={m}>{m}</option>)}
              </select>
            ) : (
              <input className="form-control" placeholder="M0, M1..." value={form.tnm_m} onChange={e => set('tnm_m', e.target.value)} style={activeVoiceField === 'tnm_m' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
            )}
          </div>
        </div>
        {(form.tnm_t || form.tnm_n || form.tnm_m) && (
          <div style={{ marginTop:8, padding:'8px 14px', background:'#f0f9ff', borderRadius:8, fontSize:13, fontWeight:700, color:'#0f4c81', display:'inline-block' }}>
            TNM: {form.tnm_t || 'T?'} {form.tnm_n || 'N?'} {form.tnm_m || 'M?'}
          </div>
        )}
      </Section>

      <Section title="Stade & Évolution" icon="📈">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Stade</label>
            {cancerInfo ? (
              <select className="form-control" value={form.stade} onChange={e => set('stade', e.target.value)} style={activeVoiceField === 'stade' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}}>
                <option value="">Sélectionner</option>
                {cancerInfo.stades.map(s => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <input className="form-control" placeholder="Stade I, II, III, IV" value={form.stade} onChange={e => set('stade', e.target.value)} style={activeVoiceField === 'stade' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
            )}
          </div>
          <div className="form-group">
            <label className="form-label">État</label>
            <select className="form-control" value={form.etat} onChange={e => set('etat', e.target.value)} style={activeVoiceField === 'etat' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}}>
              <option value="Localisé">Localisé</option>
              <option value="Métastase">Métastatique</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Taille tumeur (cm)</label>
            <input type="number" step="0.1" className="form-control" placeholder="Ex: 2.5" value={form.taille_cancer} onChange={e => set('taille_cancer', e.target.value)} style={activeVoiceField === 'taille_cancer' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
          </div>
          <div className="form-group">
            <label className="form-label">N° Lecteur</label>
            <input className="form-control" placeholder="Numéro dossier" value={form.numero_lecteur} onChange={e => set('numero_lecteur', e.target.value)} style={activeVoiceField === 'numero_lecteur' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
          </div>
        </div>
      </Section>

      <Section title="Informations complémentaires" icon="📋">
        <div className="form-group">
          <label className="form-label">Anomalies génétiques</label>
          <input className="form-control" placeholder="Ex: BRCA1, BRCA2, HER2 amplification..." value={form.anomalies_genetiques} onChange={e => set('anomalies_genetiques', e.target.value)} style={activeVoiceField === 'anomalies_genetiques' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
        </div>
        <div className="form-group">
          <label className="form-label">Rapport anatomopathologique</label>
          <textarea className="form-control" rows={3} placeholder="Résumé du rapport..." value={form.rapport_anatomopathologique} onChange={e => set('rapport_anatomopathologique', e.target.value)} style={activeVoiceField === 'rapport_anatomopathologique' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
        </div>
        <div className="form-group">
          <label className="form-label">Décision RCP</label>
          <textarea className="form-control" rows={2} placeholder="Décision de la Réunion de Concertation Pluridisciplinaire..." value={form.decision_rcp} onChange={e => set('decision_rcp', e.target.value)} style={activeVoiceField === 'decision_rcp' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
        </div>
      </Section>

      <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Annuler</button>
        <button type="submit" className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
          {loading ? '⏳ Enregistrement...' : '💾 Enregistrer le diagnostic'}
        </button>
      </div>
    </Layout>
  );
}
