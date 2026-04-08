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
  assurance: '', groupe_sanguin: '', email: '',
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
          fumeur: Boolean(p.fumeur), alcool: Boolean(p.alcool), activite_sportive: Boolean(p.activite_sportive),
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
    <Layout title={isEdit ? 'Modifier Patient' : 'Nouveau Patient'}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        {isListening && (
          <div style={{ background:'#fee2e2', border:'2px solid #e63946', borderRadius:12, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:'#e63946', animation:'pulse 1s infinite' }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#991b1b' }}>🎤 Écoute en mode continu...</div>
              {activeVoiceField && <div style={{ fontWeight:600, color:'#e63946', fontSize:14, marginTop:2 }}>↳ Champ courant: {activeVoiceField.toUpperCase()}</div>}
              <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>{voiceTranscript || 'Dites "Nom", "Prénom", "Adresse" suivi de la valeur...'}</div>
            </div>
            <button type="button" className="btn btn-sm" style={{ background:'#e63946', color:'white', border:'none' }} onClick={stopVoice}>⏹ Arrêter</button>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>{isEdit ? 'Modifier le dossier' : 'Nouveau dossier patient'}</h2>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button type="button" className={`btn ${voiceMode ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => { setVoiceMode(!voiceMode); if(!voiceMode) toast('🎤 Mode vocal activé!', { duration:3000 }); }}>
                🎤 {voiceMode ? 'Vocal ON' : 'Mode Vocal'}
              </button>
              {voiceMode && (
                <button type="button" className={`btn ${isListening ? 'btn-danger' : 'btn-outline'}`} onClick={() => isListening ? stopVoice() : startVoice()}>
                  {isListening ? '⏹ Arrêter Dictée' : '▶ Démarrer Dictée Intelligente'}
                </button>
              )}
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : isEdit ? 'Sauvegarder' : 'Créer'}</button>
            </div>
          </div>

          <div className="card-body" style={{ padding: '40px' }}>
                <div style={{ marginBottom: 40 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 24, borderLeft: '4px solid #0ea5e9', paddingLeft: 16 }}>1. Informations Civiles & Anthropométrie</div>
                    
                    <div className="form-row">
                      {['nom','prenom'].map(f => (
                        <div className="form-group" key={f}>
                          <label className="form-label">{f === 'nom' ? 'Nom *' : 'Prénom *'}</label>
                          <input className="form-control" value={form[f]} onChange={e => set(f, e.target.value)} required placeholder={f === 'nom' ? 'Nom de famille' : 'Prénom'} />
                        </div>
                      ))}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Date de naissance *</label>
                        <input type="date" className="form-control" value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sexe *</label>
                        <select className="form-control" value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Téléphone</label>
                        <input className="form-control" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+213 ..." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Wilaya de résidence</label>
                        <select className="form-control" value={form.wilaya} onChange={e => set('wilaya', e.target.value)}>
                          <option value="">Sélectionner une Wilaya...</option>
                          {WILAYAS_ALGERIE.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Groupe sanguin</label>
                        <select className="form-control" value={form.groupe_sanguin} onChange={e => set('groupe_sanguin', e.target.value)}>
                          <option value="">Sélectionner</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 10 }}>
                      <label className="form-label">Adresse Complète (N°, Rue, Ville)</label>
                      <input className="form-control" value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Ex: 12 Rue des jardins, Alger Centre..." />
                    </div>

                    <div style={{ marginTop: 30, padding: 30, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Données Anthropométriques</div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Poids (kg)</label>
                            <input type="number" className="form-control" value={poids} onChange={e => setPoids(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Taille (cm)</label>
                            <input type="number" className="form-control" value={taille} onChange={e => setTaille(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Tour de taille (cm)</label>
                            <input type="number" className="form-control" value={tourTaille} onChange={e => setTourTaille(e.target.value)} />
                          </div>
                        </div>
                        <div className="form-row" style={{ marginTop: 10 }}>
                          <div className="form-group">
                            <label className="form-label">IMC</label>
                            <div style={{ padding: '12px 16px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0', fontWeight: 800, fontSize: 18 }}>{imc}</div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Statut</label>
                            <div style={{ padding: '14px', background: imcCategory.color, color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 800, textAlign: 'center' }}>{imcCategory.label}</div>
                          </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 30 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Maladies Chroniques</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                          {[
                            'Diabète type 1', 'Diabète type 2', 'Hypertension artérielle', 
                            'Insuffisance rénale', 'Insuffisance cardiaque', 'BPCO / Asthme', 
                            'Hépatite B / C', 'Cirrhose', 'VIH / SIDA'
                          ].map(m => (
                            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', background: maladiesChroniques.includes(m) ? '#f0f9ff' : 'white' }}>
                              <input type="checkbox" checked={maladiesChroniques.includes(m)} 
                                onChange={e => {
                                  if (e.target.checked) setMaladiesChroniques([...maladiesChroniques, m]);
                                  else setMaladiesChroniques(maladiesChroniques.filter(x => x !== m));
                                }} 
                              />
                              <span style={{ fontSize: 14, fontWeight: 600 }}>{m}</span>
                            </label>
                          ))}
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '40px 0' }}></div>

                {/* SECTION 2 : STYLES DE VIE & ANTÉCÉDENTS (PORTAIL PATIENT VIA QR CODE) */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 24, borderLeft: '4px solid #0ea5e9', paddingLeft: 16 }}>2. Questionnaire Patient (Styles de Vie)</div>
                    
                    <div style={{ 
                        padding: '40px', 
                        background: '#f8fafc', 
                        borderRadius: 24, 
                        border: '2px dashed #cbd5e1', 
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{ maxWidth: 500, marginBottom: 30 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Portail de Saisie Patient Sécurisé</div>
                            <p style={{ fontSize: 14, color: '#64748b', lineHeight: '1.6' }}>
                                Pour garantir la confidentialité et l'exactitude des données, les antécédents et habitudes de vie sont désormais saisis directement par le patient via ce **QR Code à usage unique**.
                            </p>
                        </div>

                        {/* QR CODE DYNAMIQUE */}
                        <div style={{ 
                            background: 'white', 
                            padding: '24px', 
                            borderRadius: 24, 
                            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                            border: '1px solid #e2e8f0',
                            marginBottom: 24
                        }}>
                             <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://' + (window.location.host || 'localhost') + '/scan/' + (id || 'new-patient'))}`} 
                                alt="QR Code" 
                                style={{ width: 200, height: 200, display: 'block' }}
                             />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', background: '#ffffff', borderRadius: 100, border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0ea5e9', animation: 'pulse 1.5s infinite' }}></div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Dossier prêt pour le scan patient</span>
                        </div>

                        <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, textAlign: 'left', width: '100%' }}>
                            <div style={{ padding: 16, background: '#ffffff', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Usage unique</div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>Le lien expire automatiquement après validation.</div>
                            </div>
                            <div style={{ padding: 16, background: '#ffffff', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Sync en direct</div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>Les données apparaîtront dès la validation patient.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.4); opacity: 0.5; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>

                {/* SAUVEGARDE FINALE */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, borderTop: '2px solid #f1f5f9', paddingTop: 40 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '16px 80px', fontSize: 16, fontWeight: 800, borderRadius: 16, boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>
                        Valider l'Identité & Finaliser
                    </button>
                </div>

          </div>
        </div>
        {/* ========== MODAL DE FUSION DE DOUBLONS ========== */}
        {duplicateInfo && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', width: '100%', maxWidth: 920, maxHeight: '92vh', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>

              {/* En-tête */}
              <div style={{ padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Doublon détecté — Choisissez les valeurs à conserver</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Patient similaire : <strong style={{ color: '#3b82f6' }}>{duplicateInfo.existingRef}</strong> — {duplicateInfo.existingPatient}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Similarité</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: duplicateInfo.global >= 90 ? '#ef4444' : duplicateInfo.global >= 75 ? '#f97316' : '#eab308' }}>{duplicateInfo.global}%</div>
                </div>
              </div>

              {/* En-têtes des colonnes */}
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 0, padding: '10px 28px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Champ</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 14 }}>◉ Nouvelle valeur (saisie)</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 14 }}>◉ Valeur existante (base)</div>
              </div>

              {/* Corps : champs sélectionnables */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '14px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {MERGE_FIELDS.map(({ key, label, type }) => {
                  const rawNew = form[key];
                  const rawOld = (duplicateInfo.existingData || {})[key];

                  const fmt = (v) => {
                    if (!v) return '';
                    if (type === 'date') return String(v).substring(0, 10);
                    if (type === 'sexe') return v === 'M' ? 'Masculin' : (v === 'F' ? 'Féminin' : v);
                    return v;
                  };

                  const dNew = fmt(rawNew);
                  const dOld = fmt(rawOld);
                  const isIdentical = (dNew.toLowerCase().trim() === dOld.toLowerCase().trim());
                  const choice = mergeChoices[key] || 'new';

                  if (!dNew && !dOld) return null;

                  const cardBtn = (side, val, color, bg) => (
                    <div
                      onClick={() => setMergeChoices(prev => ({ ...prev, [key]: side }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
                        background: choice === side ? bg : 'white',
                        border: `2px solid ${choice === side ? color : '#e2e8f0'}`,
                        borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', minHeight: 48
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${choice === side ? color : '#cbd5e1'}`,
                        background: choice === side ? color : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}>
                        {choice === side && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <span style={{
                        fontSize: 14, wordBreak: 'break-word',
                        fontWeight: choice === side ? 700 : 400,
                        color: choice === side ? color : '#374151'
                      }}>
                        {val || <em style={{ opacity: 0.35, fontSize: 12 }}>Vide</em>}
                      </span>
                    </div>
                  );

                  return (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 10, alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, minHeight: 48 }}>
                        {label}
                      </div>
                      {isIdentical ? (
                        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10 }}>
                          <span>✅</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#15803d' }}>{dNew || <em style={{ opacity: 0.5 }}>Vide</em>}</span>
                          <span style={{ fontSize: 11, color: '#4ade80', marginLeft: 6 }}>Identique</span>
                        </div>
                      ) : (
                        <>
                          {cardBtn('new', dNew, '#2563eb', '#eff6ff')}
                          {cardBtn('old', dOld, '#7c3aed', '#faf5ff')}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 28px', display: 'flex', gap: 12, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setDuplicateInfo(null)} style={{ flex: 1, padding: '14px 20px', borderRadius: 12, border: '1.5px solid #cbd5e1', background: 'white', color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="button" onClick={async () => {
                  // Construire le payload final selon les choix (sans jamais modifier form)
                  const oldData = duplicateInfo.existingData || {};
                  const mergedPayload = { ...form };
                  MERGE_FIELDS.forEach(({ key }) => {
                    mergedPayload[key] = (mergeChoices[key] === 'old') ? oldData[key] : form[key];
                  });
                  mergedPayload.forceSave = true;

                  setDuplicateInfo(null);
                  setLoading(true);
                  try {
                    await api.put(`/patients/${oldData.id}`, mergedPayload);
                    toast.success('Patient fusionné avec succès !', { icon: '🤝' });
                    navigate(`/patients/${oldData.id}`);
                  } catch(err2) {
                    setError('Erreur fusion : ' + (err2.response?.data?.message || err2.message));
                  } finally { setLoading(false); }
                }} style={{ flex: 2, padding: '14px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🤝</span> Fusionner avec les valeurs sélectionnées
                </button>
              </div>

            </div>
          </div>
        )}

      </form>
    </Layout>
  );
}


