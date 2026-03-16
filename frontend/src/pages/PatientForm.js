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
  const [stylesVieTypes, setStylesVieTypes] = useState([]);
  const [stylesVieValeurs, setStylesVieValeurs] = useState({});
  const [newStyleNom, setNewStyleNom] = useState('');
  const [newStyleType, setNewStyleType] = useState('booleen');
  const [showAddStyle, setShowAddStyle] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const recognitionRef = useRef(null);
  const [parametres, setParametres] = useState([]);

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
        api.get(`/styles-vie/patient/${id}`).then(r => {
          const vals = {};
          r.data.forEach(v => { vals[v.style_vie_id] = v.valeur; });
          setStylesVieValeurs(vals);
        }).catch(()=>{});
      });
    }
    api.get('/styles-vie/types').then(r => setStylesVieTypes(r.data)).catch(()=>{});
    api.get('/parametres').then(r => setParametres(r.data)).catch(()=>{});
  }, [id, isEdit]);

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



  const addStyleVie = async () => {
    if (!newStyleNom.trim()) return;
    try {
      await api.post('/styles-vie/types', { nom: newStyleNom, type_champ: newStyleType });
      const r = await api.get('/styles-vie/types');
      setStylesVieTypes(r.data);
      setNewStyleNom(''); setShowAddStyle(false);
      toast.success('Facteur ajouté!');
    } catch(e) { toast.error('Erreur'); }
  };

  const deleteStyleVie = async (styleId) => {
    await api.delete(`/styles-vie/types/${styleId}`);
    setStylesVieTypes(prev => prev.filter(s => s.id !== styleId));
    toast.success('Supprimé');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nom || !form.prenom || !form.date_naissance) return setError('Champs obligatoires manquants');
    setLoading(true);
    try {
      let patientId = id;
      if (isEdit) {
        await updatePatient(id, form);
        toast.success('Patient modifié');
      } else {
        const res = await createPatient(form);
        patientId = res.data.id;
        // If similar patient found — redirect to doublons comparison
        if (res.data.code === 'SIMILAR_FOUND' && res.data.similar) {
          toast('⚠️ Doublon potentiel détecté!', { icon: '🔍', duration: 3000 });
          const valeurs = Object.entries(stylesVieValeurs).map(([style_vie_id, valeur]) => ({ style_vie_id, valeur }));
          if (valeurs.length) await api.post('/styles-vie/patient', { patient_id: patientId, valeurs });
          navigate(`/doublons?p1=${res.data.similar.id}&p2=${patientId}`);
          return;
        }
        toast.success('Patient créé');
      }
      const valeurs = Object.entries(stylesVieValeurs).map(([style_vie_id, valeur]) => ({ style_vie_id, valeur }));
      if (valeurs.length) await api.post('/styles-vie/patient', { patient_id: patientId, valeurs });
      navigate(`/patients/${patientId}`);
    } catch(err) {
      console.log('ERROR CODE:', err.response?.data?.code);
      console.log('ERROR DATA:', JSON.stringify(err.response?.data));
      const code = err.response?.data?.code;
      if (code === 'SIMILAR_FOUND') {
        const newId = err.response.data.id;
        const similarId = err.response.data.similar.id;
        toast('🔍 Doublon détecté! Redirection...', { duration: 2000 });
        setTimeout(() => navigate(`/doublons?p1=${similarId}&p2=${newId}`), 500);
        return;
      }
      if (code === 'DUPLICATE') {
        const dup = err.response.data.duplicate;
        toast('🔍 Doublon détecté! Redirection...', { duration: 2000 });
        // Need to create patient first then redirect — or just go to doublons list
        setTimeout(() => navigate(`/doublons`), 500);
        return;
      }
      setError(err.response?.data?.message || 'Erreur');
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
                    <label className="form-label">N° Carte Nationale</label>
                    <input className="form-control" value={form.num_carte_nationale} onChange={e => set('num_carte_nationale', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">N° Carte Chifa</label>
                    <input className="form-control" value={form.num_carte_chifa} onChange={e => set('num_carte_chifa', e.target.value)} />
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

                {stylesVieTypes.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#475569', marginBottom:10 }}>Facteurs dynamiques</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {stylesVieTypes.map(s => (
                        <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
                          <div style={{ flex:1, fontSize:13.5, fontWeight:600 }}>{s.nom}</div>
                          {s.type_champ === 'booleen' ? (
                            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                              <input type="checkbox"
                                checked={stylesVieValeurs[s.id] === 'true'}
                                onChange={e => setStylesVieValeurs(prev => ({ ...prev, [s.id]: String(e.target.checked) }))}
                              />
                              <span style={{ fontSize:13 }}>{stylesVieValeurs[s.id] === 'true' ? 'Oui' : 'Non'}</span>
                            </label>
                          ) : (
                            <input className="form-control" style={{ width:180 }}
                              value={stylesVieValeurs[s.id] || ''}
                              onChange={e => setStylesVieValeurs(prev => ({ ...prev, [s.id]: e.target.value }))}
                              placeholder="Valeur..."
                            />
                          )}
                          <button type="button" onClick={() => deleteStyleVie(s.id)} style={{ background:'none', border:'none', color:'#e63946', cursor:'pointer', fontSize:16 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showAddStyle ? (
                  <div style={{ padding:16, background:'#f0f9ff', borderRadius:10, border:'1px solid #bae6fd', marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>+ Nouveau facteur</div>
                    <div className="form-row">
                      <input className="form-control" value={newStyleNom} onChange={e => setNewStyleNom(e.target.value)} placeholder="Ex: Exposition aux pesticides, Stress chronique..." />
                      <select className="form-control" value={newStyleType} onChange={e => setNewStyleType(e.target.value)}>
                        <option value="booleen">Oui / Non</option>
                        <option value="texte">Texte</option>
                        <option value="nombre">Nombre</option>
                      </select>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={addStyleVie}>Ajouter</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddStyle(false)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddStyle(true)}>+ Ajouter facteur dynamique</button>
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
      </form>
    </Layout>
  );
}
