import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { createPatient, updatePatient, getPatient } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Upload, Mic, MicOff, Square, User, Phone, ShieldPlus, Activity, ClipboardList, Smartphone } from 'lucide-react';

const FormContext = React.createContext();

const VoiceInput = ({ label, field, value, type = "text", required = false, list = null, placeholder = "" }) => {
  const { set, startFieldVoice, activeVoiceField } = React.useContext(FormContext);
  const isListening = activeVoiceField === field;
  return (
    <div className="form-group">
      <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label} {required && '*'}</span>
        <button type="button" onClick={() => startFieldVoice(field)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isListening ? '#ef4444' : '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Mic size={14} />
          {isListening && <span style={{fontSize: 10, color: '#ef4444'}}>Écoute...</span>}
        </button>
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className="form-control"
          style={{ height: 50, borderRadius: 14, fontWeight: 700, fontSize: 15, border: isListening ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0', background: 'white', width: '100%', paddingRight: 40 }}
          type={type}
          value={value}
          onChange={e => set(field, e.target.value)}
          required={required}
          list={list}
          placeholder={isListening ? "Parlez..." : placeholder}
        />
        {isListening && (
           <div style={{ position: 'absolute', right: 12, top: 18, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', animation: 'voice-pulse 1.2s infinite' }} />
        )}
      </div>
    </div>
  );
};

const WILAYAS_ALGERIE = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna", "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou", "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine", "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arreridj", "35 - Boumerdès", "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma", "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - El M'Ghair", "50 - El Meniaa",
  "51 - Ouled Djellal", "52 - Bordj Badji Mokhtar", "53 - Beni Abbes", "54 - Timimoun", "55 - Touggourt", "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
];

const PROFESSIONS = [
  'Agriculteur / Ouvrier agricole',
  'Ouvrier industriel / Usine',
  'Mineur / Extraction',
  'Pêcheur / Maritime',
  'Enseignant / Éducation',
  'Personnel de santé',
  'Informatique / Bureautique',
  'Commerce / Vente',
  'Artisan / Menuisier / Forgeron',
  'Chauffeur / Transport',
  'Fonctionnaire / Administration',
  'Militaire / Police',
  'Retraité',
  'Sans emploi / Chômeur',
  'Autre'
];

const FIELD_MAP = {
  'nom': 'nom', 'prénom': 'prenom', 'prenom': 'prenom',
  'date de naissance': 'date_naissance', 'téléphone': 'telephone', 'telephone': 'telephone',
  'adresse': 'adresse', 'commune': 'commune',
};

const initialForm = {
  // Identité Civile
  nom: '', prenom: '', nom_jeune_fille: '', date_naissance: '', sexe: 'M',
  lieu_naissance: '', commune_naissance: '', nationalite: 'Algérienne',
  situation_matrimoniale: '', niveau_instruction: '',
  langues_parlees: [],
  groupe_sanguin: '', num_carte_nationale: '', num_carte_chifa: '',
  // Contact & Résidence
  telephone: '', telephone2: '', email: '',
  wilaya: '', commune: '', code_postal: '', adresse: '',
  profession: '',
  nom_proche: '', lien_parente: '', telephone_proche: '',
  // Couverture Sociale
  type_couverture: '', num_affiliation: '',
  medecin_traitant_nom: '', medecin_traitant_tel: '',
  mutuelle: false, mutuelle_nom: '', prise_en_charge_ald: false,
  // Habitudes de Vie
  fumeur: false, nb_cigarettes_jour: '', annees_tabac: '', type_tabac: '',
  alcool: false, drogues: false,
  activite_physique: '', alimentation: '',
  exposition_pro: false, exposition_pro_detail: '',
  // Antécédents
  antecedents_medicaux: '', antecedents_chirurgicaux: '',
  antecedents_familiaux_cancer: false, antecedents_familiaux_qui: '', antecedents_familiaux_type: '',
  autres_medicaments: '', allergies: '',
  diabete: false, hypertension: false, autres_maladies_chroniques: '',
  // Statut & Suivi
  statut_patient: 'Nouveau', date_deces: '', cause_deces: '',
  etablissement_suivi: '', medecin_responsable: '', notes_observations: '',
  // legacy
  consommation_tabac: 'Inconnu', consommation_alcool: 'Inconnu',
  activite_sportive: false, autres_facteurs_risque: '', antecedents_familiaux: ''
};

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [champsDynamiques, setChampsDynamiques] = useState([]);
  const [valeursDynamiques, setValeursDynamiques] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const recognitionRef = useRef(null);
  const [parametres, setParametres] = useState([]);
  const [networkInfo, setNetworkInfo] = useState({ ip: 'localhost', port: 5000, frontendPort: 3000 });
  const [interimTranscript, setInterimTranscript] = useState('');

  // NOUVEAUX ÉTATS ANTHROPOMÉTRIE & ÉTAPES
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [imc, setImc] = useState('-');
  const [imcCategory, setImcCategory] = useState({ label: 'En attente', color: '#94a3b8' });
  const [tourTaille, setTourTaille] = useState('');
  const [maladiesChroniques, setMaladiesChroniques] = useState([]);
  const [maladieAutre, setMaladieAutre] = useState('');

  // État pour la gestion des doublons
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [mergeChoices, setMergeChoices] = useState({});
  const fileInputRef = useRef(null);

  // Sections repliables
  const [collapsed, setCollapsed] = useState({ couverture: false, habitudes: false, antecedents: false, suivi: false });
  const toggleSection = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  // Numéro de dossier auto-généré
  const [numDossier] = useState(() => `PAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`);

  // Auto-save toutes les 30 secondes
  useEffect(() => {
    if (!isEdit) {
      const t = setInterval(() => {
        localStorage.setItem('patient_form_draft', JSON.stringify({ form, poids, taille }));
        toast('Brouillon sauvegardé', { icon: '💾', duration: 1500, id: 'autosave' });
      }, 30000);
      return () => clearInterval(t);
    }
  }, [form, poids, taille, isEdit]);


  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    toast.loading('Importation en cours...', { id: 'import' });
    try {
      let data = [];
      if (extension === 'xlsx' || extension === 'xls') {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      } else {
        const text = await file.text();
        const delimiter = extension === 'csv' ? (text.includes(';') ? ';' : ',') : (text.includes('\t') ? '\t' : ',');
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        data = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim());
          const obj = {};
          headers.forEach((h, i) => obj[h] = values[i]);
          return obj;
        });
      }

      if (data.length === 1) {
        // Pre-fill form if single patient
        const row = data[0];
        const newForm = { ...form };
        Object.entries(row).forEach(([k, v]) => {
          const key = String(k).toLowerCase();
          if (key.includes('nom')) newForm.nom = v;
          if (key.includes('prenom') || key.includes('prénom')) newForm.prenom = v;
          if (key.includes('sexe')) newForm.sexe = String(v).toUpperCase()[0] === 'F' ? 'F' : 'M';
          if (key.includes('nais') || key.includes('dob')) newForm.date_naissance = String(v).slice(0, 10);
          if (key.includes('tel')) newForm.telephone = v;
          if (key.includes('carte')) newForm.num_carte_nationale = v;
        });
        setForm(newForm);
        toast.success('Formulaire rempli depuis le fichier', { id: 'import' });
      } else if (data.length > 1) {
        // Bulk import
        let count = 0;
        for (const row of data) {
          const p = {};
          Object.entries(row).forEach(([k, v]) => {
            const key = String(k).toLowerCase();
            if (key.includes('nom')) p.nom = v;
            if (key.includes('prenom') || key.includes('prénom')) p.prenom = v;
            if (key.includes('sexe')) p.sexe = String(v).toUpperCase()[0] === 'F' ? 'F' : 'M';
            if (key.includes('nais') || key.includes('dob')) p.date_naissance = String(v).slice(0, 10);
            if (key.includes('tel')) p.telephone = v;
            if (key.includes('carte')) p.num_carte_nationale = v;
          });
          if (p.nom && p.prenom) {
            try { await createPatient(p); count++; } catch (err) { }
          }
        }
        toast.success(`${count} patients importés.`, { id: 'import' });
        navigate('/patients');
      }
    } catch (err) { toast.error('Erreur import', { id: 'import' }); }
    e.target.value = '';
  };

  const MERGE_FIELDS = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'date_naissance', label: 'Date de naissance', type: 'date' },
    { key: 'sexe', label: 'Sexe', type: 'sexe' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'num_carte_nationale', label: 'N° Carte Nationale' },
    { key: 'num_carte_chifa', label: 'N° Carte Chifa' },
    { key: 'wilaya', label: 'Wilaya' },
    { key: 'commune', label: 'Commune' },
    { key: 'assurance', label: 'Assurance' },
    { key: 'groupe_sanguin', label: 'Groupe Sanguin' },
    { key: 'adresse', label: 'Adresse' },
  ];

  useEffect(() => {
    if (isEdit) {
      getPatient(id).then(r => {
        const p = r.data;
        setForm({
          nom: p.nom || '', prenom: p.prenom || '', date_naissance: p.date_naissance?.slice(0, 10) || '',
          sexe: p.sexe || 'M', telephone: p.telephone || '',
          num_carte_nationale: p.num_carte_nationale || '', num_carte_chifa: p.num_carte_chifa || '',
          adresse: p.adresse || '', commune: p.commune || '', wilaya: p.wilaya || '',
          assurance: p.assurance || '', groupe_sanguin: p.groupe_sanguin || '',
          consommation_tabac: p.consommation_tabac || 'Inconnu', consommation_alcool: p.consommation_alcool || 'Inconnu',
          activite_sportive: Boolean(p.activite_sportive),
          autres_medicaments: p.autres_medicaments || '', autres_facteurs_risque: p.autres_facteurs_risque || ''
        });
        api.get(`/valeurs-dynamiques/${id}`).then(r => {
          const vals = {};
          r.data.forEach(v => { vals[v.champ_id] = v.valeur; });
          setValeursDynamiques(vals);
        }).catch(() => { });
      });
    }
    api.get('/champs-dynamiques').then(r => setChampsDynamiques(r.data)).catch(() => { });
    api.get('/parametres').then(r => setParametres(r.data)).catch(() => { });

    // Récupérer l'IP du serveur pour le QR Code
    api.get('/network-info').then(r => setNetworkInfo(r.data)).catch(() => { });
  }, [id, isEdit]);

  // CALCUL IMC TEMPS RÉEL
  useEffect(() => {
    if (poids && taille) {
      const h = parseFloat(taille) / 100;
      const w = parseFloat(poids);
      if (h > 0) {
        const val = (w / (h * h)).toFixed(1);
        setImc(val);
        if (val < 18.5) setImcCategory({ label: 'Insuffisance pondérale', color: '#0ea5e9' });
        else if (val < 25) setImcCategory({ label: 'Poids normal', color: '#10b981' });
        else if (val < 30) setImcCategory({ label: 'Surpoids', color: '#f59e0b' });
        else if (val < 35) setImcCategory({ label: 'Obésité modérée', color: '#f97316' });
        else setImcCategory({ label: 'Obésité sévère', color: '#ef4444' });
      }
    } else {
      setImc('-');
      setImcCategory({ label: 'En attente', color: '#94a3b8' });
    }
  }, [poids, taille]);

  // Real-time duplicate check
  useEffect(() => {
    if (isEdit) return; // Only check during patient creation

    const { nom, prenom, date_naissance, num_carte_nationale, num_carte_chifa } = form;
    const canCheck =
      (num_carte_nationale && num_carte_nationale.trim().length >= 4) ||
      (num_carte_chifa && num_carte_chifa.trim().length >= 4) ||
      (nom && nom.trim().length >= 2 && prenom && prenom.trim().length >= 2 && date_naissance);

    if (!canCheck) return;

    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/patients/check-duplicate', { nom, prenom, date_naissance, num_carte_nationale, num_carte_chifa });
        if (res.data.duplicate) {
          toast('⚠️ Patient déjà existant détecté!', { icon: '🔍', duration: 4000 });
          const draftToPass = { ...form };
          navigate('/doublons', { state: { draftPatient: draftToPass, existingId: res.data.duplicate.id } });
        }
      } catch (err) {
        console.error('Erreur vérification doublon:', err);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [form.nom, form.prenom, form.date_naissance, form.num_carte_nationale, form.num_carte_chifa, isEdit, navigate]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const startGlobalAssistant = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Reconnaissance vocale non supportée. Utilisez Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => {
      setIsListening(true);
      setVoiceMode(true);
      toast.success("Assistant Global Actif - Dites par ex: 'Nom Boucham, Prénom Yasmine'", { icon: '🤖' });
    };

    rec.onresult = (e) => {
      const fullTranscript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join('');

      setVoiceTranscript(fullTranscript);
      
      const latestResult = e.results[e.results.length - 1];
      if (latestResult.isFinal) {
         const transcript = latestResult[0].transcript;
         const keywords = [
           { kw: 'nom', f: 'nom' },
           { kw: 'prénom', f: 'prenom' },
           { kw: 'prenom', f: 'prenom' },
           { kw: 'téléphone', f: 'telephone' },
           { kw: 'telephone', f: 'telephone' },
           { kw: 'adresse', f: 'adresse' },
           { kw: 'wilaya', f: 'wilaya' },
           { kw: 'sexe', f: 'sexe' },
           { kw: 'groupe sanguin', f: 'groupe_sanguin' },
           { kw: 'profession', f: 'profession' }
         ];
         
         const kwPattern = keywords.map(k => k.kw).join('|');
         
         keywords.forEach(({kw, f}) => {
             const regex = new RegExp(`\\b${kw}\\b\\s*(?:est|s'appelle|:|-)?\\s+([\\s\\S]+?)(?=\\b(?:${kwPattern})\\b|$)`, 'i');
             const match = transcript.match(regex);
             if (match && match[1].trim()) {
                 let val = match[1].trim().replace(/[.,;?!]+$/, '');
                 val = cleanVoiceInput(val, f);
                 if (val) {
                     setForm(prev => ({...prev, [f]: val}));
                     toast.success(`✓ ${kw.toUpperCase()} détecté`, { id: `voice-${f}` });
                 }
             }
         });
      }
    };

    rec.onerror = (e) => {
      console.error(e.error);
      setIsListening(false);
    };

    rec.onend = () => { setIsListening(false); };
    rec.start();
    recognitionRef.current = rec;
  };

  const startFieldVoice = (field) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    rec.continuous = false; // Important: stay on this field only

    setActiveVoiceField(field);
    setIsListening(true);
    setInterimTranscript('');

    rec.onresult = (e) => {
      let transcript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join('');

      // Look for keywords of other fields and cut the text there to avoid overflow
      // EXCLUDE the current field from the stoppers
      const stoppers = [
        { regex: /prénom/i, f: 'prenom' },
        { regex: /nom/i, f: 'nom' },
        { regex: /date/i, f: 'date_naissance' },
        { regex: /téléphone/i, f: 'telephone' },
        { regex: /adresse/i, f: 'adresse' },
        { regex: /wilaya/i, f: 'wilaya' },
        { regex: /sexe/i, f: 'sexe' }
      ].filter(s => s.f !== field);

      stoppers.forEach(s => {
        const index = transcript.toLowerCase().indexOf(s.f === 'prenom' ? 'prénom' : s.f);
        if (index > -1 && index > 3) transcript = transcript.substring(0, index).trim();
      });

      setInterimTranscript(transcript);

      if (e.results[e.results.length - 1].isFinal) {
        const cleaned = cleanVoiceInput(transcript, field);
        if (cleaned) {
          set(field, cleaned);
          toast.success(`✓ ${field.toUpperCase()}: ${cleaned}`, { id: 'voice-toast' });
        }
      }
    };

    rec.onend = () => {
      setActiveVoiceField(null);
      setIsListening(false);
      setInterimTranscript('');
    };

    rec.start();
  };

  const cleanVoiceInput = (text, field) => {
    let cleaned = text.trim();
    // Universal noise reduction
    cleaned = cleaned.replace(/^(le|la|mon|ma|mes|un|une|c'est|il s'appelle|elle s'appelle|son|le nom de famille est|le prénom est|son nom est|son prénom est)\s+/i, '');
    cleaned = cleaned.replace(/^(nom|prénom|téléphone|adresse|wilaya|sexe|groupe sanguin)\s*[:\-]\s*/i, '');

    if (field === 'nom' || field === 'prenom') {
      cleaned = cleaned.replace(/^(est|s'appelle)\s*/i, '');
      // Format as Name (First letter uppercase)
      cleaned = cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    } else if (field === 'telephone') {
      cleaned = cleaned.replace(/\D/g, '');
      if (cleaned.length > 10) cleaned = cleaned.slice(-10);
    } else if (field === 'sexe') {
      if (/homme|masculin|garçon|mâle/i.test(cleaned)) return 'M';
      if (/femme|féminin|fille/i.test(cleaned)) return 'F';
    } else if (field === 'wilaya') {
      const match = WILAYAS_ALGERIE.find(w => w.toLowerCase() === cleaned.toLowerCase() || cleaned.toLowerCase().includes(w.toLowerCase()));
      if (match) return match;
    }
    return cleaned;
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceMode(false);
  };



  // Helper: en-tête de section repliable
  const SH = ({ icon, title, skey, color = '#2563eb', bg = '#eff6ff' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: collapsed[skey] ? 0 : 28, cursor: skey ? 'pointer' : 'default' }}
      onClick={() => skey && toggleSection(skey)}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, flex: 1 }}>{title}</h3>
      {skey && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ transform: collapsed[skey] ? 'rotate(-90deg)' : 'rotate(0)', transition: '0.2s' }}><polyline points="6 9 12 15 18 9" /></svg>}
    </div>
  );

  // Helper: toggle (oui/non)
  const Toggle = ({ label, field }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', borderRadius: 14, border: '1.5px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{label}</span>
      <div onClick={() => set(field, !form[field])} style={{ width: 52, height: 28, borderRadius: 50, background: form[field] ? '#2563eb' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
        <div style={{ position: 'absolute', top: 3, left: form[field] ? 26 : 3, width: 22, height: 22, borderRadius: '50%', background: 'white', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const missingFields = [];
    if (!form.nom) missingFields.push('Nom');
    if (!form.prenom) missingFields.push('Prénom');
    if (!form.date_naissance) missingFields.push('Date de naissance');
    if (!form.num_carte_nationale) missingFields.push('N° Carte Nationale');
    if (!form.num_carte_chifa) missingFields.push('N° Carte Chifa');
    if (missingFields.length > 0) {
      return setError(`Champs obligatoires manquants : ${missingFields.join(', ')}`);
    }
    setLoading(true);
    try {
      let patientId = id;
      if (isEdit) {
        await updatePatient(id, form);
        toast.success('Patient modifié');
      } else {
        const res = await createPatient(form);
        patientId = res.data.id;
        toast.success('Patient créé');
      }
      const valeurs = Object.entries(valeursDynamiques).map(([champ_id, valeur]) => ({ champ_id, valeur }));
      if (valeurs.length) await api.post('/valeurs-dynamiques', { record_id: patientId, valeurs });
      navigate(`/patients/${patientId}`);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'DUPLICATE_SUSPECTED') {
        const info = err.response.data.similarityInfo;
        const initialChoices = {};
        MERGE_FIELDS.forEach(f => { initialChoices[f.key] = 'new'; });
        setMergeChoices(initialChoices);
        setDuplicateInfo(info);
        return;
      }
      setError(err.response?.data?.message || 'Erreur inconnue');
    } finally { setLoading(false); }
  };

  return (
    <FormContext.Provider value={{ set, startFieldVoice, activeVoiceField }}>
    <Layout title="">
      <div style={{ padding: '0 12px 40px' }}>
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            style={{
              background: 'white', border: '1.5px solid #e2e8f0', cursor: 'pointer',
              width: 44, height: 44, color: '#64748b',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEdit ? 'Édition du Dossier' : 'Nouveau Dossier Patient'}</h1>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 2 }}>Étape {step + 1} sur 6</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => fileInputRef.current.click()}
              style={{ padding: '0 16px', height: 44, borderRadius: 12, background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={16} /> Import
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx,.xls,.csv,.txt" onChange={handleImport} />
            </button>
            <button type="button"
              onClick={() => {
                if (voiceMode) { stopVoice(); toast('Micro désactivé', { icon: '🔇' }); }
                else { startGlobalAssistant(); }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', height: 44, borderRadius: 12,
                background: voiceMode ? '#fef2f2' : 'white',
                border: `1.5px solid ${voiceMode ? '#ef4444' : '#e2e8f0'}`,
                color: voiceMode ? '#ef4444' : '#64748b',
                fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}>
              <Mic size={18} />
              {voiceMode ? 'ARRÊTER' : 'MICRO'}
            </button>
          </div>
        </div>

        {/* ── STEPPER BAR ── */}
        {(() => {
          const STEPS = [
            { label: 'Identité', icon: <User size={22} strokeWidth={2.5} /> },
            { label: 'Contact', icon: <Phone size={22} strokeWidth={2.5} /> },
            { label: 'Social', icon: <ShieldPlus size={22} strokeWidth={2.5} /> },
            { label: 'Antécédents', icon: <Activity size={22} strokeWidth={2.5} /> },
            { label: 'Statut', icon: <ClipboardList size={22} strokeWidth={2.5} /> },
            { label: 'Habitudes (QR)', icon: <Smartphone size={22} strokeWidth={2.5} /> },
          ];
          return (
            <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: 'white', borderRadius: 16, padding: 6, border: '1px solid #e2e8f0' }}>
              {STEPS.map((s, i) => (
                <button key={i} type="button" onClick={() => setStep(i)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: step === i ? '#3b82f6' : i < step ? '#f0f9ff' : 'transparent',
                    color: step === i ? 'white' : i < step ? '#3b82f6' : '#94a3b8',
                    fontWeight: 700, fontSize: 12, transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>{s.icon}</div>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          );
        })()}

        {error && <div className="alert alert-error" style={{ marginBottom: 24, borderRadius: 16 }}>{error}</div>}

        {isListening && (
          <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', padding: '16px 32px', borderRadius: 100, border: '2px solid #ef4444', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', minWidth: 400 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ef4444', animation: 'voice-pulse 1.2s infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>🎤 Micro actif</div>
              <div style={{ fontSize: 14, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{voiceTranscript || 'Parlez maintenant...'}</div>
            </div>
            <button type="button" onClick={stopVoice} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 50, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>STOP</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ═══ STEP 0: IDENTITÉ CIVILE ═══ */}
          {step === 0 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
              <SH title="Identité Civile" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <VoiceInput label="Nom de Famille" field="nom" value={form.nom} required placeholder="Ex: BENALI" />
                <VoiceInput label="Prénom(s)" field="prenom" value={form.prenom} required placeholder="Ex: Mohamed" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <VoiceInput label="Date de Naissance" field="date_naissance" type="date" value={form.date_naissance} required />
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Sexe *</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => set('sexe', 'M')} style={{ flex: 1, height: 50, borderRadius: 14, border: '1.5px solid', borderColor: form.sexe === 'M' ? '#3b82f6' : '#f1f5f9', background: form.sexe === 'M' ? '#eff6ff' : 'white', color: form.sexe === 'M' ? '#1e69ff' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>HOMME</button>
                    <button type="button" onClick={() => { set('sexe', 'F'); set('nom_jeune_fille', ''); }} style={{ flex: 1, height: 50, borderRadius: 14, border: '1.5px solid', borderColor: form.sexe === 'F' ? '#ec4899' : '#f1f5f9', background: form.sexe === 'F' ? '#fdf2f8' : 'white', color: form.sexe === 'F' ? '#db2777' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>FEMME</button>
                  </div>
                </div>
              </div>

              {form.sexe === 'F' && (
                <div style={{ marginBottom: 24, animation: 'fadeIn 0.3s' }}>
                  <VoiceInput label="Nom de jeune fille" field="nom_jeune_fille" value={form.nom_jeune_fille} placeholder="Si différente" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Lieu de Naissance (Wilaya)</label>
                  <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.lieu_naissance} onChange={e => set('lieu_naissance', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {WILAYAS_ALGERIE.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <VoiceInput label="Commune de naissance" field="commune_naissance" value={form.commune_naissance} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Nationalité</label>
                  <input className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.nationalite} onChange={e => set('nationalite', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Situation Matrimoniale</label>
                  <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.situation_matrimoniale} onChange={e => set('situation_matrimoniale', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)', 'Autre'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Niveau d'instruction</label>
                  <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.niveau_instruction} onChange={e => set('niveau_instruction', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {['Sans instruction', 'Primaire', 'Moyen', 'Secondaire', 'Universitaire'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Langue(s) parlée(s)</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {['Arabe', 'Tamazight', 'Français'].map(lang => (
                      <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', border: '1.5px solid', borderColor: form.langues_parlees.includes(lang) ? '#3b82f6' : '#e2e8f0' }}>
                        <input type="checkbox" checked={form.langues_parlees.includes(lang)} onChange={e => {
                          const newLangs = e.target.checked ? [...form.langues_parlees, lang] : form.langues_parlees.filter(l => l !== lang);
                          set('langues_parlees', newLangs);
                        }} style={{ width: 16, height: 16 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: form.langues_parlees.includes(lang) ? '#1d4ed8' : '#475569' }}>{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: 24, background: '#f8fafc', borderRadius: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Groupe Sanguin</label>
                    <select className="form-control" style={{ height: 44, borderRadius: 12, fontWeight: 700, fontSize: 14 }} value={form.groupe_sanguin} onChange={e => set('groupe_sanguin', e.target.value)}>
                      <option value="">-</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>N° CNI</label>
                    <input type="text" className="form-control" style={{ height: 44, borderRadius: 12 }} value={form.num_carte_nationale} onChange={e => set('num_carte_nationale', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>N° CHIFA</label>
                    <input type="text" className="form-control" style={{ height: 44, borderRadius: 12 }} value={form.num_carte_chifa} onChange={e => set('num_carte_chifa', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 1: CONTACT & RÉSIDENCE ═══ */}
          {step === 1 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
              <SH title="Contact & Résidence" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>} color="#10b981" bg="#f0fdf4" />

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr)', gap: 16, marginBottom: 24 }}>
                <VoiceInput label="Téléphone Principal" field="telephone" value={form.telephone} placeholder="Ex: 055..." />
                <VoiceInput label="Téléphone 2" field="telephone2" value={form.telephone2} />
                <VoiceInput label="Email" field="email" value={form.email} type="email" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1.5fr) minmax(0, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Wilaya</label>
                  <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.wilaya} onChange={e => set('wilaya', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {WILAYAS_ALGERIE.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <VoiceInput label="Commune" field="commune" value={form.commune} />
                <VoiceInput label="Code Postal" field="code_postal" value={form.code_postal} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <VoiceInput label="Adresse Complète" field="adresse" value={form.adresse} />
              </div>

              <div style={{ marginBottom: 32 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Profession / Métier</label>
                  <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.profession} onChange={e => set('profession', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#475569', margin: '0 0 16px 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  Proche / Tuteur Légal
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
                  <VoiceInput label="Nom et Prénom" field="nom_proche" value={form.nom_proche} />
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Lien de parenté</label>
                    <select className="form-control" style={{ height: 44, borderRadius: 12 }} value={form.lien_parente} onChange={e => set('lien_parente', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {['Époux/Épouse', 'Fils/Fille', 'Frère/Sœur', 'Parent', 'Tuteur légal', 'Autre'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <VoiceInput label="Téléphone" field="telephone_proche" value={form.telephone_proche} />
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: COUVERTURE SOCIALE ═══ */}
          {step === 2 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
              <SH title="Couverture Sociale" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M10 10h4" /></svg>} color="#8b5cf6" bg="#f5f3ff" />

              {(
                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Type de Couverture</label>
                      <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.type_couverture} onChange={e => set('type_couverture', e.target.value)}>
                        <option value="">Aucune</option>
                        <option value="CNAS">CNAS (Assurance maladie)</option>
                        <option value="CASNOS">CASNOS (Non-salariés)</option>
                        <option value="Autre">Autre caisse</option>
                      </select>
                    </div>
                    <VoiceInput label="Numéro d'affiliation" field="num_affiliation" value={form.num_affiliation} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 24, marginBottom: 24 }}>
                    <Toggle label="Adhérent Mutuelle" field="mutuelle" />
                    {form.mutuelle && <VoiceInput label="Nom de la mutuelle" field="mutuelle_nom" value={form.mutuelle_nom} />}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <VoiceInput label="Médecin Traitant (Nom)" field="medecin_traitant_nom" value={form.medecin_traitant_nom} />
                    <VoiceInput label="Téléphone Médecin" field="medecin_traitant_tel" value={form.medecin_traitant_tel} />
                  </div>

                  <Toggle label="Bénéficie d'une Prise en Charge ALD (Affection Longue Durée)" field="prise_en_charge_ald" />
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 3: ANTÉCÉDENTS MÉDICAUX ═══ */}
          {step === 3 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
              <SH title="Antécédents Médicaux" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>} color="#ef4444" bg="#fef2f2" />

              <div style={{ display: 'grid', gap: 24, animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Toggle label="Diabète connu" field="diabete" />
                  <Toggle label="Hypertension Artérielle (HTA)" field="hypertension" />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Antécédents Médicaux / Autres maladies chroniques</label>
                  <textarea className="form-control" rows={3} style={{ borderRadius: 14, resize: 'vertical' }} value={form.antecedents_medicaux} onChange={e => set('antecedents_medicaux', e.target.value)} placeholder="Précisez..." />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Antécédents Chirurgicaux</label>
                  <textarea className="form-control" rows={2} style={{ borderRadius: 14, resize: 'vertical' }} value={form.antecedents_chirurgicaux} onChange={e => set('antecedents_chirurgicaux', e.target.value)} placeholder="Opérations passées..." />
                </div>

                <div style={{ padding: 20, background: form.antecedents_familiaux_cancer ? '#fef2f2' : '#f8fafc', borderRadius: 16, border: `1.5px solid ${form.antecedents_familiaux_cancer ? '#fca5a5' : '#f1f5f9'}`, transition: '0.3s' }}>
                  <Toggle label="Antécédents familiaux de CANCER" field="antecedents_familiaux_cancer" />
                  {form.antecedents_familiaux_cancer && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: 16, marginTop: 16, animation: 'fadeIn 0.3s' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Lien familial</label>
                        <select className="form-control" style={{ height: 44, borderRadius: 12 }} value={form.antecedents_familiaux_qui} onChange={e => set('antecedents_familiaux_qui', e.target.value)}>
                          <option value="">Préciser...</option>
                          {['Père', 'Mère', 'Frère', 'Sœur', 'Fils', 'Fille', 'Grand-père', 'Grand-mère', 'Oncle/Tante', 'Autre'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <VoiceInput label="Type(s) de cancer" field="antecedents_familiaux_type" value={form.antecedents_familiaux_type} placeholder="Ex: Sein, Poumon..." />
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Traitement / Médicaments en cours</label>
                    <textarea className="form-control" rows={3} style={{ borderRadius: 14 }} value={form.autres_medicaments} onChange={e => set('autres_medicaments', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Allergies connues</label>
                    <textarea className="form-control" rows={3} style={{ border: '2px solid #fecaca', background: '#fef2f2', borderRadius: 14 }} value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="Médicaments, aliments..." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: STATUT & SUIVI (+ ANTHROPOMÉTRIE) ═══ */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
                <SH title="Statut & Suivi" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} color="#0ea5e9" bg="#e0f2fe" />

                <div style={{ animation: 'fadeIn 0.3s' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Statut du Patient *</label>
                      <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 800, background: form.statut_patient === 'Décédé' ? '#fee2e2' : 'white', color: form.statut_patient === 'Décédé' ? '#dc2626' : 'inherit' }} value={form.statut_patient} onChange={e => set('statut_patient', e.target.value)}>
                        {['Nouveau', 'En cours de suivi', 'En rémission', 'Perdu de vue', 'Transféré', 'Décédé'].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Établissement Principal de Suivi</label>
                      <input type="text" className="form-control" style={{ height: 50, borderRadius: 14 }} value={form.etablissement_suivi} onChange={e => set('etablissement_suivi', e.target.value)} placeholder="CAC, EPH, Clinique..." />
                    </div>
                  </div>

                  {form.statut_patient === 'Décédé' && (
                    <div style={{ padding: 20, background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 16, marginBottom: 24, animation: 'fadeIn 0.3s', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                      <VoiceInput label="Date du décès" field="date_deces" type="date" value={form.date_deces} required />
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#dc2626', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Cause du Décès</label>
                        <select className="form-control" style={{ height: 50, borderRadius: 14, borderColor: '#fca5a5' }} value={form.cause_deces} onChange={e => set('cause_deces', e.target.value)}>
                          <option value="">Sélectionner...</option>
                          <option value="Liée au cancer">Liée au cancer principal</option>
                          <option value="Complication traitement">Complication de traitement</option>
                          <option value="Autre maladie">Autre maladie / comorbidité</option>
                          <option value="Inconnue">Inconnue</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Notes et Observations administratives</label>
                    <textarea className="form-control" rows={4} style={{ borderRadius: 14, resize: 'vertical' }} value={form.notes_observations} onChange={e => set('notes_observations', e.target.value)} placeholder="Détails du dossier, particularités sociales..." />
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32 }}>
                <SH title="Bilan Anthropométrique" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} color="#6366f1" bg="#eef2ff" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, alignItems: 'end' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Poids (kg)</label>
                    <input type="number" className="form-control" value={poids} onChange={e => setPoids(e.target.value)} style={{ height: 50, borderRadius: 14, fontWeight: 700 }} placeholder="Ex: 72" />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Taille (cm)</label>
                    <input type="number" className="form-control" value={taille} onChange={e => setTaille(e.target.value)} style={{ height: 50, borderRadius: 14, fontWeight: 700 }} placeholder="Ex: 175" />
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>IMC</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: imcCategory.color }}>{imc}</div>
                    <div style={{ background: imcCategory.color, color: 'white', padding: '3px 12px', borderRadius: 50, fontSize: 11, fontWeight: 800, display: 'inline-block' }}>{imcCategory.label}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 5: HABITUDES DE VIE (QR CODE) ═══ */}
          {step === 5 && (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 48, textAlign: 'center', animation: 'fadeIn 0.3s' }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#3b82f6' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /></svg>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 16px' }}>Habitudes de Vie du Patient</h2>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 32px' }}>
                Les informations concernant le tabagisme, l'alcool, l'alimentation et l'activité physique sont remplies directement par le patient via son smartphone.
              </p>

              {isEdit ? (
                <div style={{ background: 'white', padding: 24, borderRadius: 24, display: 'inline-block', border: '2px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`http://${networkInfo.ip}:${networkInfo.frontendPort}/patient-forms/${id}`)}`} alt="QR Code Portail Patient" style={{ width: 200, height: 200, display: 'block' }} />
                  <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>SCANNEZ LE CODE</div>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '32px 48px', borderRadius: 20, display: 'inline-block', border: '2px dashed #cbd5e1' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: 16 }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>Dossier non enregistré</h4>
                  <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 300 }}>
                    Veuillez enregistrer le dossier clinique complet pour générer le code QR unique du patient.
                  </p>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, justifyContent: 'space-between', marginTop: 48, borderTop: '1px solid #e2e8f0', paddingTop: 32 }}>
            <button type="button" onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} style={{ padding: '0 32px', height: 52, borderRadius: 16, border: '1.5px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}>
              {step > 0 ? '← ÉTAPE PRÉCÉDENTE' : 'ANNULER'}
            </button>
            
            {step < 5 ? (
              <button type="button" onClick={() => {
                // Validation before next step
                if (step === 0) {
                  if (!form.nom || !form.prenom || !form.date_naissance) {
                    return toast.error("Veuillez remplir le Nom, Prénom et la Date de Naissance");
                  }
                }
                if (step === 1) {
                  if (!form.telephone) {
                    return toast.error("Veuillez remplir le Téléphone");
                  }
                }
                if (step === 4) {
                  if (!form.statut_patient) {
                    return toast.error("Veuillez remplir le Statut du Patient");
                  }
                  if (form.statut_patient === 'Décédé' && !form.date_deces) {
                    return toast.error("Veuillez indiquer la Date du Décès");
                  }
                }
                setStep(step + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} style={{ padding: '0 48px', height: 52, borderRadius: 16, background: '#3b82f6', border: 'none', color: 'white', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 10px 25px rgba(59,130,246,0.3)', transition: '0.2s' }}>
                ÉTAPE SUIVANTE →
              </button>
            ) : (
              <button type="submit" disabled={loading} style={{ padding: '0 48px', height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: 'none', color: 'white', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '0 10px 25px rgba(15,23,42,0.2)' }}>
                {loading ? 'ENREGISTREMENT...' : isEdit ? 'ENREGISTRER LES MODIFICATIONS' : 'ENREGISTRER LE DOSSIER'}
              </button>
            )}
          </div>
        </form>
      </div>
      {/* ========== MODAL DE FUSION DE DOUBLONS ========== */}
      {duplicateInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: 960, maxHeight: '90vh', borderRadius: 32, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>

            {/* En-tête */}
            <div style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚠️</div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Doublon Potentiel Détecté</h2>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Conflit d'identité avec le patient <strong style={{ color: '#2563eb' }}>{duplicateInfo.existingRef}</strong></div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Score Similarité</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: duplicateInfo.global >= 90 ? '#ef4444' : '#f59e0b' }}>{duplicateInfo.global}%</div>
              </div>
            </div>

            {/* Barre de colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 0, padding: '12px 32px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Donnée</div>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', paddingLeft: 12 }}>◉ Nouvelle Saisie</div>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', paddingLeft: 12 }}>◉ Existant en Base</div>
            </div>

            {/* Corps */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MERGE_FIELDS.map(({ key, label, type }) => {
                const rawNew = form[key];
                const rawOld = (duplicateInfo.existingData || {})[key];
                const fmt = (v) => {
                  if (!v) return '—';
                  if (type === 'date') return String(v).substring(0, 10);
                  if (type === 'sexe') return v === 'M' ? 'MASCULIN' : 'FÉMININ';
                  return v;
                };
                const dNew = fmt(rawNew);
                const dOld = fmt(rawOld);
                const isMatch = (dNew.toString().toLowerCase().trim() === dOld.toString().toLowerCase().trim());
                const choice = mergeChoices[key] || 'new';

                return (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}</div>
                    {isMatch ? (
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>{dNew} (Identique)</span>
                      </div>
                    ) : (
                      <>
                        <div onClick={() => setMergeChoices(p => ({ ...p, [key]: 'new' }))}
                          style={{ padding: '12px 16px', borderRadius: 14, cursor: 'pointer', border: '2px solid', borderColor: choice === 'new' ? '#2563eb' : '#f1f5f9', background: choice === 'new' ? '#eff6ff' : 'white', transition: '0.2s' }}>
                          <div style={{ fontSize: 14, fontWeight: choice === 'new' ? 800 : 500, color: choice === 'new' ? '#1d4ed8' : '#334155' }}>{dNew}</div>
                        </div>
                        <div onClick={() => setMergeChoices(p => ({ ...p, [key]: 'old' }))}
                          style={{ padding: '12px 16px', borderRadius: 14, cursor: 'pointer', border: '2px solid', borderColor: choice === 'old' ? '#7c3aed' : '#f1f5f9', background: choice === 'old' ? '#faf5ff' : 'white', transition: '0.2s' }}>
                          <div style={{ fontSize: 14, fontWeight: choice === 'old' ? 800 : 500, color: choice === 'old' ? '#6d28d9' : '#334155' }}>{dOld}</div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
              <button onClick={() => setDuplicateInfo(null)} style={{ flex: 1, height: 50, borderRadius: 16, border: '1.5px solid #cbd5e1', background: 'white', fontWeight: 800, cursor: 'pointer' }}>ANNULER</button>
              <button onClick={async () => {
                const merged = { ...form };
                MERGE_FIELDS.forEach(f => { if (mergeChoices[f.key] === 'old') merged[f.key] = duplicateInfo.existingData[f.key]; });
                try {
                  setLoading(true);
                  await api.post(`/patients/merge/${duplicateInfo.targetId}`, merged);
                  toast.success('Fusion réussie');
                  navigate(`/patients/${duplicateInfo.targetId}`);
                } catch (e) { toast.error('Erreur fusion'); }
                finally { setLoading(false); setDuplicateInfo(null); }
              }} style={{ flex: 2, height: 50, borderRadius: 16, background: '#0f172a', border: 'none', color: 'white', fontWeight: 900, cursor: 'pointer' }}>FUSIONNER & SAUVEGARDER</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes voice-pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </Layout>
    </FormContext.Provider>
  );
}




