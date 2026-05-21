import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { createPatient, updatePatient, getPatient } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';

const WILAYAS_ALGERIE = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna", "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou", "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine", "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arreridj", "35 - Boumerdès", "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma", "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - El M'Ghair", "50 - El Meniaa",
  "51 - Ouled Djellal", "52 - Bordj Badji Mokhtar", "53 - Beni Abbes", "54 - Timimoun", "55 - Touggourt", "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
];

const FIELD_MAP = {
  'nom': 'nom', 'prénom': 'prenom', 'prenom': 'prenom',
  'date de naissance': 'date_naissance', 'téléphone': 'telephone', 'telephone': 'telephone',
  'adresse': 'adresse', 'commune': 'commune',
};

const initialForm = {
  nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '',
  num_carte_nationale: '', num_carte_chifa: '', adresse: '', commune: '', wilaya: '',
  assurance: '', groupe_sanguin: '', email: '', profession: '',
  consommation_tabac: 'Inconnu', consommation_alcool: 'Inconnu',
  fumeur: false, alcool: false, activite_sportive: false,
  autres_medicaments: '', autres_facteurs_risque: '',
  antecedents_medicaux: '', antecedents_familiaux: ''
};

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('infos');
  const [champsDynamiques, setChampsDynamiques] = useState([]);
  const [valeursDynamiques, setValeursDynamiques] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const recognitionRef = useRef(null);
  const [parametres, setParametres] = useState([]);
  
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
            try { await createPatient(p); count++; } catch (err) {}
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
          nom: p.nom||'', prenom: p.prenom||'', date_naissance: p.date_naissance?.slice(0,10)||'',
          sexe: p.sexe||'M', telephone: p.telephone||'',
          num_carte_nationale: p.num_carte_nationale||'', num_carte_chifa: p.num_carte_chifa||'',
          adresse: p.adresse||'', commune: p.commune||'', wilaya: p.wilaya||'',
          assurance: p.assurance||'', groupe_sanguin: p.groupe_sanguin||'',
          consommation_tabac: p.consommation_tabac||'Inconnu', consommation_alcool: p.consommation_alcool||'Inconnu',
          activite_sportive: Boolean(p.activite_sportive),
          autres_medicaments: p.autres_medicaments||'', autres_facteurs_risque: p.autres_facteurs_risque||''
        });
        api.get(`/valeurs-dynamiques/${id}`).then(r => {
          const vals = {};
          r.data.forEach(v => { vals[v.champ_id] = v.valeur; });
          setValeursDynamiques(vals);
        }).catch(()=>{});
      });
    }
    api.get('/champs-dynamiques').then(r => setChampsDynamiques(r.data)).catch(()=>{});
    api.get('/parametres').then(r => setParametres(r.data)).catch(()=>{});
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
          'nom de famille': 'nom', 'nom': 'nom',
          'prénom': 'prenom', 'prenom': 'prenom',
          'adresse': 'adresse',
          'commune': 'commune',
          'téléphone': 'telephone', 'telephone': 'telephone', 'numéro de téléphone': 'telephone',
          'date de naissance': 'date_naissance', 'naissance': 'date_naissance',
          'wilaya': 'wilaya',
          'sexe': 'sexe', 'genre': 'sexe',
          'fumeur': 'fumeur',
          'carte nationale': 'num_carte_nationale', 'numéro de carte nationale': 'num_carte_nationale', 'numero de carte nationale': 'num_carte_nationale',
          'carte chifa': 'num_carte_chifa', 'numéro de carte chifa': 'num_carte_chifa', 'numero de carte chifa': 'num_carte_chifa'
        };

        const sortedKeywords = Object.keys(keywordToField).sort((a, b) => b.length - a.length);
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
            } else {
              if (['masculin', 'homme', 'garçon'].includes(lowerToken)) { set('sexe', 'M'); toast.success('✅ Sexe: Masculin'); }
              else if (['féminin', 'femme', 'fille'].includes(lowerToken)) { set('sexe', 'F'); toast.success('✅ Sexe: Féminin'); }
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
    let formattedText = text;

    if (field === 'nom' || field === 'prenom') {
      formattedText = text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      set(field, formattedText);
      toast.success(`✅ ${field.toUpperCase()}: ${formattedText}`);
    } else if (field === 'adresse' || field === 'commune') {
      formattedText = text.charAt(0).toUpperCase() + text.slice(1);
      set(field, formattedText);
      toast.success(`✅ ${field.toUpperCase()}: ${formattedText}`);
    } else if (field === 'telephone') {
      formattedText = text.replace(/\s/g, '');
      set(field, formattedText);
      toast.success(`✅ TÉLÉPHONE: ${formattedText}`);
    } else if (field === 'sexe') {
      if (['masculin', 'homme'].includes(text)) set('sexe', 'M');
      else if (['féminin', 'femme'].includes(text)) set('sexe', 'F');
      else return;
      toast.success(`✅ SEXE mis à jour`);
    } else if (field === 'fumeur') {
      if (['oui', 'positif', 'vrai'].includes(text)) set('fumeur', true);
      else if (['non', 'négatif', 'faux'].includes(text)) set('fumeur', false);
      toast.success('✅ Fumeur mis à jour');
    } else if (field === 'wilaya') {
      const match = WILAYAS_ALGERIE.find(w => w.toLowerCase().includes(text));
      if (match) { set('wilaya', match); toast.success(`✅ Wilaya: ${match}`); }
    } else if (field === 'date_naissance') {
      const nums = text.replace(/\//g, ' ').replace(/-/g, ' ').split(' ').filter(n => n.match(/^\d+$/));
      if (nums.length === 3) {
        const [d, m, y] = nums;
        const dateStr = `${y.padStart(4,'20')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        set('date_naissance', dateStr);
        toast.success(`✅ Date: ${d}/${m}/${y}`);
      } else {
        const moisMap = { janvier:1, février:2, mars:3, avril:4, mai:5, juin:6, juillet:7, août:8, septembre:9, octobre:10, novembre:11, décembre:12 };
        let found = false;
        for (const [moisNom, moisNum] of Object.entries(moisMap)) {
          if (text.includes(moisNom)) {
            const dayMatch = text.match(/(\d{1,2})/);
            const yearMatch = text.match(/(\d{4})/);
            if (dayMatch && yearMatch) {
              const dateStr = `${yearMatch[1]}-${String(moisNum).padStart(2,'0')}-${dayMatch[1].padStart(2,'0')}`;
              set('date_naissance', dateStr);
              toast.success(`✅ Date: ${dayMatch[1]} ${moisNom} ${yearMatch[1]}`);
              found = true; break;
            }
          }
        }
        if (!found) toast('🎤 Dites "15 03 1990"');
      }
    } else if (field === 'num_carte_nationale' || field === 'num_carte_chifa') {
      formattedText = text.replace(/\s/g, '');
      set(field, formattedText);
      const label = field === 'num_carte_nationale' ? 'CARTE NATIONALE' : 'CARTE CHIFA';
      toast.success(`✅ ${label}: ${formattedText}`);
    }
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false); };

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
    } catch(err) {
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
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>{isEdit ? 'Édition du Dossier' : 'Nouveau Dossier Patient'}</h1>
            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginTop: 4 }}>Enregistrement sécurisé & Identification unique</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <button type="button" onClick={() => fileInputRef.current.click()}
                style={{ 
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
                    background: '#f0f9ff', border: '1.5px solid #e0f2fe', color: '#0369a1',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer'
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                IMPORT EXCEL/CSV
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx,.xls,.csv,.txt" onChange={handleImport} />
             </button>
             <button type="button" 
                onClick={() => { setVoiceMode(!voiceMode); if(!voiceMode) toast.success('Agent Vocal Activé'); }}
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

        {error && <div className="alert alert-error" style={{ marginBottom: 24, borderRadius: 16 }}>{error}</div>}

        {isListening && (
           <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', padding: '16px 32px', borderRadius: 100, border: '2px solid #ef4444', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', minWidth: 400 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ef4444', animation: 'voice-pulse 1.2s infinite' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>Agent AI en écoute</div>
                    <div style={{ fontSize: 14, color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{voiceTranscript || 'Dites un champ (ex: "Nom", "Prénom")...'}</div>
                </div>
                <button type="button" onClick={stopVoice} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 50, fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>ARRÊTER</button>
           </div>
        )}

        <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* 1. Informations Civiles */}
            <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e69ff' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Identité Civile</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Nom de Famille *</label>
                  <input className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700, fontSize: 15 }} value={form.nom} onChange={e => set('nom', e.target.value)} required placeholder="Ex: BENALI" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Prénom(s) *</label>
                  <input className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700, fontSize: 15 }} value={form.prenom} onChange={e => set('prenom', e.target.value)} required placeholder="Ex: Mohamed" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Date de Naissance *</label>
                  <input type="date" className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700, fontSize: 15 }} value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Sexe *</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => set('sexe', 'M')} style={{ flex: 1, height: 50, borderRadius: 14, border: '1.5px solid', borderColor: form.sexe === 'M' ? '#3b82f6' : '#f1f5f9', background: form.sexe === 'M' ? '#eff6ff' : 'white', color: form.sexe === 'M' ? '#1e69ff' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>HOMME</button>
                    <button type="button" onClick={() => set('sexe', 'F')} style={{ flex: 1, height: 50, borderRadius: 14, border: '1.5px solid', borderColor: form.sexe === 'F' ? '#ec4899' : '#f1f5f9', background: form.sexe === 'F' ? '#fdf2f8' : 'white', color: form.sexe === 'F' ? '#db2777' : '#64748b', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>FEMME</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>N° Carte Nationale *</label>
                  <input className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 800, color: '#0f172a', fontFamily: 'JetBrains Mono' }} value={form.num_carte_nationale} onChange={e => set('num_carte_nationale', e.target.value)} placeholder="000000000" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>N° Carte Chifa *</label>
                  <input className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 800, color: '#0f172a', fontFamily: 'JetBrains Mono' }} value={form.num_carte_chifa} onChange={e => set('num_carte_chifa', e.target.value)} placeholder="000000000" />
                </div>
              </div>
            </div>

            {/* 2. Coordonnées & Résidence */}
            <div style={{ background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Contact & Résidence</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Téléphone</label>
                  <input className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700, fontSize: 15 }} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+213..." />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Wilaya</label>
                  <select className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.wilaya} onChange={e => set('wilaya', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {WILAYAS_ALGERIE.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Profession / Métier</label>
                  <input 
                    className="form-control" 
                    list="profession-list"
                    style={{ height: 50, borderRadius: 14, fontWeight: 700, fontSize: 15 }} 
                    value={form.profession} 
                    onChange={e => set('profession', e.target.value)} 
                    placeholder="Tapez pour rechercher..." 
                  />
                  <datalist id="profession-list">
                    <option value="Agriculteur / Ouvrier agricole" />
                    <option value="Ouvrier industriel / Usine" />
                    <option value="Mineur / Extraction" />
                    <option value="Pêcheur / Maritime" />
                    <option value="Enseignant / Éducation" />
                    <option value="Personnel de santé" />
                    <option value="Informatique / Bureautique" />
                    <option value="Commerce / Vente" />
                    <option value="Artisan / Menuisier / Forgeron" />
                    <option value="Chauffeur / Transport" />
                    <option value="Fonctionnaire / Administration" />
                    <option value="Militaire / Police" />
                    <option value="Retraité" />
                    <option value="Sans emploi / Chômeur" />
                    <option value="Autre" />
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Adresse Résidentielle</label>
                  <input className="form-control" style={{ height: 50, borderRadius: 14, fontWeight: 700 }} value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Rue, N°, Cité..." />
                </div>
              </div>
            </div>

            {/* 3. Données Dynamiques - Patient */}
            {champsDynamiques.filter(c => c.entite === 'patient').length > 0 && (
              <div style={{ background: '#f8fafc', borderRadius: 28, border: '1.5px dashed #cbd5e1', padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Informations Complémentaires</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {champsDynamiques.filter(c => c.entite === 'patient').map(c => (
                        <div className="form-group" key={c.id}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>{c.nom} {c.obligatoire ? '*' : ''}</label>
                            {c.type_champ === 'liste' ? (
                                <select className="form-control" style={{ height: 48, borderRadius: 12, background: 'white' }} value={valeursDynamiques[c.id] || ''} onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: e.target.value })}>
                                    <option value="">Sélectionner</option>
                                    {c.options_liste?.split(',').map(o => <option key={o.trim()} value={o.trim()}>{o.trim()}</option>)}
                                </select>
                            ) : c.type_champ === 'booleen' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48 }}>
                                    <input type="checkbox" checked={valeursDynamiques[c.id] === 'true'} onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: String(e.target.checked) })} style={{ width: 20, height: 20 }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Activer</span>
                                </div>
                            ) : (
                                <input className="form-control" style={{ height: 48, borderRadius: 12, background: 'white' }} value={valeursDynamiques[c.id] || ''} type={c.type_champ === 'nombre' ? 'number' : c.type_champ === 'date' ? 'date' : 'text'} onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: e.target.value })} />
                            )}
                        </div>
                    ))}
                </div>
              </div>
            )}

            {/* 4. Habitudes & Style de Vie - Dynamic Fields */}
            {champsDynamiques.filter(c => c.entite === 'habitudes_vie').length > 0 && (
              <div style={{ background: '#fdf2f8', borderRadius: 28, border: '1.5px dashed #f9a8d4', padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Habitudes & Style de Vie (Dynamique)</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {champsDynamiques.filter(c => c.entite === 'habitudes_vie').map(c => (
                        <div className="form-group" key={c.id}>
                            <label className="form-label" style={{ fontSize: 11, fontWeight: 900, color: '#db2777', textTransform: 'uppercase' }}>{c.nom} {c.obligatoire ? '*' : ''}</label>
                            {c.type_champ === 'liste' ? (
                                <select className="form-control" style={{ height: 48, borderRadius: 12, background: 'white' }} value={valeursDynamiques[c.id] || ''} onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: e.target.value })}>
                                    <option value="">Sélectionner</option>
                                    {c.options_liste?.split(',').map(o => <option key={o.trim()} value={o.trim()}>{o.trim()}</option>)}
                                </select>
                            ) : c.type_champ === 'booleen' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48 }}>
                                    <input type="checkbox" checked={valeursDynamiques[c.id] === 'true'} onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: String(e.target.checked) })} style={{ width: 20, height: 20 }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Oui / Non</span>
                                </div>
                            ) : (
                                <input className="form-control" style={{ height: 48, borderRadius: 12, background: 'white' }} value={valeursDynamiques[c.id] || ''} type={c.type_champ === 'nombre' ? 'number' : c.type_champ === 'date' ? 'date' : 'text'} onChange={e => setValeursDynamiques({ ...valeursDynamiques, [c.id]: e.target.value })} />
                            )}
                        </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* IMC & Anthropométrie Card */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 28, padding: 32, color: 'white', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: '0 0 24px 0' }}>Bilan Anthropométrique</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Poids (kg)</label>
                        <input type="number" value={poids} onChange={e => setPoids(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', height: 44, borderRadius: 12, color: 'white', padding: '0 12px', fontWeight: 800, fontSize: 16, marginTop: 4 }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Taille (cm)</label>
                        <input type="number" value={taille} onChange={e => setTaille(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', height: 44, borderRadius: 12, color: 'white', padding: '0 12px', fontWeight: 800, fontSize: 16, marginTop: 4 }} />
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, textAlign: 'center', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Indice de Masse Corporelle</div>
                    <div style={{ fontSize: 44, fontWeight: 900, margin: '8px 0', color: imcCategory.color }}>{imc}</div>
                    <div style={{ background: imcCategory.color, color: 'white', padding: '6px 16px', borderRadius: 50, fontSize: 12, fontWeight: 900, display: 'inline-block' }}>{imcCategory.label.toUpperCase()}</div>
                </div>
            </div>

            {/* QR Portal Mini Card */}
            {!isEdit && (
                <div style={{ background: '#f8fafc', borderRadius: 28, padding: 32, border: '1.5px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1.5px solid #e2e8f0', color: '#0f172a' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/></svg>
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>Portail Patient</h4>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>Le patient peut scanner ce code pour compléter ses antécédents médicaux.</p>
                    <div style={{ background: 'white', padding: 12, borderRadius: 16, display: 'inline-block', border: '1.5px solid #e2e8f0' }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://' + (window.location.host || 'localhost') + '/scan/new')}`} alt="QR" style={{ width: 120, height: 120 }} />
                    </div>
                </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', marginTop: 48, borderTop: '1.5px solid #f1f5f9', paddingTop: 40 }}>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: '0 32px', height: 52, borderRadius: 16, border: '1.5px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: '0 64px', height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: 'none', color: 'white', fontWeight: 900, fontSize: 16, cursor: 'pointer', boxShadow: '0 10px 25px rgba(15,23,42,0.2)' }}>
                {loading ? 'ENREGISTREMENT...' : isEdit ? 'METTRE À JOUR LE DOSSIER' : 'CRÉER LE DOSSIER CLINIQUE'}
            </button>
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
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>
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
                    MERGE_FIELDS.forEach(f => { if(mergeChoices[f.key] === 'old') merged[f.key] = duplicateInfo.existingData[f.key]; });
                    try {
                        setLoading(true);
                        await api.post(`/patients/merge/${duplicateInfo.targetId}`, merged);
                        toast.success('Fusion réussie');
                        navigate(`/patients/${duplicateInfo.targetId}`);
                    } catch(e){ toast.error('Erreur fusion'); }
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
  );
}




