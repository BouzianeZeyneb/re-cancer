import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { createPatient, updatePatient, getPatient } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';

const WILAYAS = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','MSila','Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane'];

const FIELD_MAP = {
  'nom': 'nom', 'prénom': 'prenom', 'prenom': 'prenom',
  'date de naissance': 'date_naissance', 'téléphone': 'telephone', 'telephone': 'telephone',
  'adresse': 'adresse', 'commune': 'commune',
};

const initialForm = {
  nom: '', prenom: '', date_naissance: '', sexe: 'M', telephone: '',
  num_carte_nationale: '', num_carte_chifa: '', adresse: '', commune: '', wilaya: '',
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
  
  // États pour la gestion des doublons
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
          // Temporarily save styles too in case we need them
          const draftToPass = { ...form, stylesVieValeurs };
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
      if (e.error === 'no-speech') return; // ignore idle timeouts if any
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
      else return; // unparsed
      toast.success(`✅ SEXE mis à jour`);
    } else if (field === 'fumeur') {
      if (['oui', 'positif', 'vrai'].includes(text)) set('fumeur', true);
      else if (['non', 'négatif', 'faux'].includes(text)) set('fumeur', false);
      toast.success('✅ Fumeur mis à jour');
    } else if (field === 'wilaya') {
      const match = WILAYAS.find(w => w.toLowerCase().includes(text));
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



  // Dynamic Styles Add Logic removed from here since it is now managed centrally via AdminSettings

  const handleForceSubmit = async () => {
    setDuplicateInfo(null);
    setLoading(true);
    try {
      const payload = { ...form, forceSave: true };
      let patientId = id;
      if (isEdit) {
        await updatePatient(id, payload);
        toast.success('Patient modifié (Doublon forcé)', { icon: '✅' });
      } else {
        const res = await createPatient(payload);
        patientId = res.data.id;
        toast.success('Patient créé (Doublon forcé)', { icon: '✅' });
      }
      const valeurs = Object.entries(valeursDynamiques).map(([c_id, v]) => ({ champ_id: c_id, valeur: v }));
      if (valeurs.length) await api.post('/valeurs-dynamiques', { record_id: patientId, valeurs });
      navigate(`/patients/${patientId}`);
    } catch(err) {
      setError(err.response?.data?.message || 'Erreur lors du forçage');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Champs obligatoires
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
        // Initialiser tous les choix sur 'new' par défaut
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

          {voiceMode && (
            <div style={{ background:'#f0f9ff', padding:'10px 24px', borderBottom:'1px solid #e2e8f0', fontSize:13, color:'#0369a1' }}>
              💡 Dites le nom du champ pour l'activer, puis dictez sa valeur. <br/>
              <em>Exemple: "Nom Dupont" (pause) "Prénom Jean" (pause) "Sexe masculin" (pause) "Téléphone 0770..."</em>
            </div>
          )}

          <div className="card-body">
            <div className="tabs" style={{ marginBottom:20 }}>
              {['infos','habitudes'].map(tab => (
                <button key={tab} type="button" className={`tab ${activeTab===tab?'active':''}`} onClick={() => setActiveTab(tab)}>
                  {tab === 'infos' ? '👤 Informations' : '🏃 Styles de Vie'}
                </button>
              ))}
            </div>

            {activeTab === 'infos' && (
              <div>
                <div className="form-row">
                  {['nom','prenom'].map(f => (
                    <div className="form-group" key={f}>
                      <label className="form-label">{f === 'nom' ? 'Nom *' : 'Prénom *'}</label>
                      <div style={{ display:'flex', gap:8 }}>
                        <input className="form-control" value={form[f]} onChange={e => set(f, e.target.value)} required style={activeVoiceField === f ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
                        {voiceMode && <button type="button" style={{ padding:'0 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'white', cursor:'pointer', fontSize:14 }} onClick={() => startVoice(f)}>🎤</button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date de Naissance *</label>
                    <input type="date" className="form-control" value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sexe</label>
                    <select className="form-control" value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                      <option value="M">♂ Masculin</option>
                      <option value="F">♀ Féminin</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      N° Carte Nationale <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      value={form.num_carte_nationale}
                      onChange={e => set('num_carte_nationale', e.target.value)}
                      required
                      style={!form.num_carte_nationale ? { borderColor: '#fca5a5' } : {}}
                      placeholder="Numéro obligatoire"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      N° Carte Chifa <span style={{ color: '#ef4444', fontWeight: 800 }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      value={form.num_carte_chifa}
                      onChange={e => set('num_carte_chifa', e.target.value)}
                      required
                      style={!form.num_carte_chifa ? { borderColor: '#fca5a5' } : {}}
                      placeholder="Numéro obligatoire"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Téléphone</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <input className="form-control" value={form.telephone} onChange={e => set('telephone', e.target.value)} style={activeVoiceField === 'telephone' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Wilaya</label>
                    <select className="form-control" value={form.wilaya} onChange={e => set('wilaya', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Commune</label>
                    <input className="form-control" value={form.commune} onChange={e => set('commune', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Adresse</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <textarea className="form-control" rows={2} value={form.adresse} onChange={e => set('adresse', e.target.value)} style={activeVoiceField === 'adresse' ? { border:'2px solid #e63946', background:'#fef2f2' } : {}} />
                  </div>
                </div>

                {champsDynamiques.filter(c => c.entite === 'patient').length > 0 && (
                  <div style={{ marginTop:20, paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#475569', marginBottom:10 }}>Informations Supplémentaires (Dynamiques)</div>
                    <div className="form-row">
                      {champsDynamiques.filter(c => c.entite === 'patient').map(s => (
                        <div className="form-group" key={s.id}>
                          <label className="form-label">{s.nom} {s.obligatoire && '*'}</label>
                          {s.type_champ === 'booleen' ? (
                            <select className="form-control" value={valeursDynamiques[s.id] || ''} onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: e.target.value }))} required={s.obligatoire}>
                              <option value="">Choisir...</option>
                              <option value="true">Oui</option>
                              <option value="false">Non</option>
                            </select>
                          ) : s.type_champ === 'liste' ? (
                             <select className="form-control" value={valeursDynamiques[s.id] || ''} onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: e.target.value }))} required={s.obligatoire}>
                                <option value="">Choisir...</option>
                                {s.options_liste.split(',').map(opt => <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>)}
                             </select>
                          ) : s.type_champ === 'date' ? (
                             <input type="date" className="form-control" value={valeursDynamiques[s.id] || ''} onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: e.target.value }))} required={s.obligatoire} />
                          ) : (
                            <input type={s.type_champ === 'nombre' ? 'number' : 'text'} className="form-control" value={valeursDynamiques[s.id] || ''} onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: e.target.value }))} required={s.obligatoire} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'habitudes' && (
              <div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#475569', marginBottom:10 }}>Habitudes de base</div>
                  <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                    {[['fumeur','🚬 Fumeur'],['alcool','🍷 Alcool'],['activite_sportive','🏃 Sport']].map(([f,l]) => (
                      <label key={f} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'10px 16px', border:'1px solid #e2e8f0', borderRadius:8, background: form[f] ? '#dbeafe' : 'white' }}>
                        <input type="checkbox" checked={form[f]} onChange={e => set(f, e.target.checked)} />
                        <span style={{ fontSize:13.5, fontWeight:600 }}>{l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {champsDynamiques.filter(c => c.entite === 'habitudes_vie').length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#475569', marginBottom:10 }}>Méta-données (via Générateur)</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {champsDynamiques.filter(c => c.entite === 'habitudes_vie').map(s => (
                        <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
                          <div style={{ flex:1, fontSize:13.5, fontWeight:600 }}>{s.nom} {s.obligatoire && <span style={{color:'red'}}>*</span>}</div>
                          {s.type_champ === 'booleen' ? (
                            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                              <input type="checkbox"
                                checked={valeursDynamiques[s.id] === 'true'}
                                onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: String(e.target.checked) }))}
                              />
                              <span style={{ fontSize:13 }}>{valeursDynamiques[s.id] === 'true' ? 'Oui' : 'Non'}</span>
                            </label>
                          ) : s.type_champ === 'liste' ? (
                             <select className="form-control" style={{ width:180 }}
                               value={valeursDynamiques[s.id] || ''}
                               onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: e.target.value }))}
                               required={s.obligatoire}
                             >
                                <option value="">Choisir...</option>
                                {s.options_liste.split(',').map(opt => <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>)}
                             </select>
                          ) : s.type_champ === 'date' ? (
                             <input type="date" className="form-control" style={{ width:180 }}
                               value={valeursDynamiques[s.id] || ''}
                               onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: e.target.value }))}
                               required={s.obligatoire}
                             />
                          ) : (
                            <input type={s.type_champ === 'nombre' ? 'number' : 'text'} className="form-control" style={{ width:180 }}
                              value={valeursDynamiques[s.id] || ''}
                              onChange={e => setValeursDynamiques(prev => ({ ...prev, [s.id]: e.target.value }))}
                              placeholder="Valeur..."
                              required={s.obligatoire}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop:30, marginBottom: 20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#475569', marginBottom:8 }}>Antécédents & Comorbidités (Définis par l'Admin)</div>
                  
                  {parametres.filter(p => p.categorie === 'antecedent').length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ fontSize:12, color:'#64748b' }}>Antécédents:</strong>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop: 6 }}>
                        {parametres.filter(p => p.categorie === 'antecedent').map(p => {
                          const isChecked = form.antecedents_medicaux.includes(p.valeur);
                          return (
                            <label key={p.id} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'6px 10px', background:'#f8fafc', borderRadius:6, border:'1px solid #e2e8f0', fontSize:13 }}>
                              <input type="checkbox" checked={isChecked} onChange={e => {
                                let newAnt = form.antecedents_medicaux.split(',').map(s=>s.trim()).filter(Boolean);
                                if (e.target.checked) newAnt.push(p.valeur);
                                else newAnt = newAnt.filter(a => a !== p.valeur);
                                set('antecedents_medicaux', newAnt.join(', '));
                              }} />
                              {p.valeur}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {parametres.filter(p => p.categorie === 'comorbidite').length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ fontSize:12, color:'#64748b' }}>Comorbidités:</strong>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop: 6 }}>
                        {parametres.filter(p => p.categorie === 'comorbidite').map(p => {
                          const isChecked = form.antecedents_medicaux.includes(p.valeur);
                          return (
                            <label key={p.id} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'6px 10px', background:'#f8fafc', borderRadius:6, border:'1px solid #e2e8f0', fontSize:13 }}>
                              <input type="checkbox" checked={isChecked} onChange={e => {
                                let newAnt = form.antecedents_medicaux.split(',').map(s=>s.trim()).filter(Boolean);
                                if (e.target.checked) newAnt.push(p.valeur);
                                else newAnt = newAnt.filter(a => a !== p.valeur);
                                set('antecedents_medicaux', newAnt.join(', '));
                              }} />
                              {p.valeur}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label className="form-label">Notes Antécédents / Comorbidités</label>
                    <textarea className="form-control" rows={2} value={form.antecedents_medicaux} onChange={e => set('antecedents_medicaux', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop:20 }}>
                  <div className="form-group">
                    <label className="form-label">Antécédents familiaux</label>
                    <textarea className="form-control" rows={2} value={form.antecedents_familiaux} onChange={e => set('antecedents_familiaux', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Autres médicaments</label>
                    <textarea className="form-control" rows={2} value={form.autres_medicaments} onChange={e => set('autres_medicaments', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Autres facteurs de risque</label>
                    <textarea className="form-control" rows={2} value={form.autres_facteurs_risque} onChange={e => set('autres_facteurs_risque', e.target.value)} />
                  </div>
                </div>
              </div>
            )}
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


