import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCase } from '../utils/api';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const TABS = [
  { id: 'resume', label: 'Résumé' },
  { id: 'diagnostic', label: 'Diagnostic' },
  { id: 'anapath', label: 'Anapath' },
  { id: 'biologie', label: 'Biologie' },
  { id: 'imagerie', label: 'Imagerie' },
  { id: 'traitement', label: 'Traitement' },
  { id: 'consultations', label: 'Consultations' },
  { id: 'effets', label: 'Effets secondaires' },
  { id: 'documents', label: 'Documents' },
  { id: 'ia', label: '✨ Assistant IA' },
];

const GRADE_COLORS = { 'Grade 1': '#22c55e', 'Grade 2': '#f59e0b', 'Grade 3': '#e63946', 'Grade 4': '#7c3aed' };
const STATUS_COLORS = { 'Normal': '#22c55e', 'Bas': '#3b82f6', 'Haut': '#f59e0b', 'Critique': '#e63946' };
const MARQUEUR_COLORS = { 'Positif': '#e63946', 'Négatif': '#22c55e', 'Equivoque': '#f59e0b', 'Non testé': '#94a3b8' };

// ===== ANAPATH FORM COMPONENT =====
const TYPE_HISTO_OPTIONS = [
  'Carcinome canalaire infiltrant','Carcinome lobulaire infiltrant','Adénocarcinome',
  'Carcinome épidermoïde','Carcinome à petites cellules','Carcinome médullaire',
  'Carcinome papillaire','Carcinome folliculaire','Lymphome diffus à grandes cellules B',
  'Mélanome','Sarcome','Autre'
];
const TYPE_PRELEVEMENT_OPTIONS = ['Biopsie percutanée','Biopsie chirurgicale','Pièce opératoire','Cytologie','Autre'];

// Marges selon type histologique
const MARGES_BY_TYPE = {
  'Carcinome canalaire infiltrant':    ['Saines (R0)','Envahies (R1)','Résidu macroscopique (R2)','Non évaluable'],
  'Carcinome lobulaire infiltrant':    ['Saines (R0)','Envahies (R1)','Résidu macroscopique (R2)','Non évaluable'],
  'Adénocarcinome':                    ['Saines (R0)','Envahies (R1)','Résidu macroscopique (R2)','Non évaluable'],
  'Carcinome épidermoïde':             ['Saines (R0)','Envahies (R1 <1mm)','Envahies (R1 >1mm)','Résidu macroscopique (R2)','Non évaluable'],
  'Carcinome à petites cellules':      ['Non applicable (chimiothérapie 1ère ligne)','Saines (R0)','Envahies (R1)','Non évaluable'],
  'Carcinome médullaire':              ['Saines (R0)','Envahies (R1)','Non évaluable'],
  'Carcinome papillaire':              ['Saines (R0)','Envahies (R1)','Résidu macroscopique (R2)','Capsule intacte','Capsule rompue'],
  'Carcinome folliculaire':            ['Saines (R0)','Envahies (R1)','Résidu macroscopique (R2)','Capsule intacte','Capsule rompue'],
  'Lymphome diffus à grandes cellules B': ['Non applicable (traitement médical)','Évaluation post-traitement'],
  'Mélanome':                          ['Saines (R0 <1mm)','Saines (R0 >1mm)','Envahies (R1)','Résidu macroscopique (R2)','Non évaluable'],
  'Sarcome':                           ['Saines large (R0 >1cm)','Saines étroites (R0 <1cm)','Envahies (R1)','Résidu macroscopique (R2)','Non évaluable'],
  'Autre':                             ['Saines (R0)','Envahies (R1)','Résidu macroscopique (R2)','Non évaluable'],
};
const DEFAULT_MARGES = ['Saines (R0)','Envahies (R1)','Résidu macroscopique (R2)','Non évaluable'];

const GRADE_OPTIONS = ['Grade I (bien différencié)','Grade II (moyennement différencié)','Grade III (peu différencié)'];
const MARQUEUR_OPTS = ['Non testé','Positif','Négatif','Équivoque'];

// Catégories d'analyses pour les demandes au laboratoire
const ANALYSES_CATEGORIEES = {
  'Hématologie & Hémostase': ['NFS', 'Frottis sanguin', 'Groupage sanguin', 'Vitesse de sédimentation (VS)', 'TP / INR', 'TCA', 'Fibrinogène', 'D-Dimères'],
  'Biochimie & Ionogramme': ['Glycémie à jeun', 'Urée', 'Créatinine', 'Acide urique', 'Sodium (Na)', 'Potassium (K)', 'Chlore (Cl)', 'Calcium (Ca)'],
  'Bilan Hépatique & Lipidique': ['ASAT (TGO)', 'ALAT (TGP)', 'Gamma-GT', 'Phosphatases alcalines', 'Bilirubine totale', 'Cholestérol', 'Triglycérides'],
  'Marqueurs Tumoraux': ['ACE', 'CA 15-3', 'CA 125', 'CA 19-9', 'PSA', 'AFP', 'β-HCG'],
  'Hormonologie & Sérologie': ['TSH', 'FSH', 'LH', 'Prolactine', 'Œstradiol', 'Progestérone', 'CRP', 'Sérologie (VHB, VHC, VIH)']
};

function AnathForm({ caseId, anapath, onSaved, onDelete, MARQUEUR_COLORS }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [extraMarqueurs, setExtraMarqueurs] = useState([]); // [{nom, valeur}]
  const [newMarqueurNom, setNewMarqueurNom] = useState('');
  const [form, setForm] = useState({
    date_prelevement: '', type_prelevement: '', pathologiste: '',
    type_histologique: '', grade_tumoral: '', marges_chirurgicales: '',
    ki67: '', er: 'Non testé', pr: 'Non testé', her2: 'Non testé',
    pd_l1: 'Non testé', mmr_msi: 'Non testé',
    resultat_biopsie: '', compte_rendu: ''
  });

  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const autresCustom = extraMarqueurs.map(m => `${m.nom}: ${m.valeur}`).join(' | ');
      const typeHisto = showCustomType ? customTypeInput : form.type_histologique;
      await api.post('/anapath', { ...form, case_id: caseId, type_histologique: typeHisto, autres_marqueurs_custom: autresCustom });
      toast.success('Anapath enregistré!');
      setShowForm(false);
      setExtraMarqueurs([]);
      setCustomTypeInput('');
      setShowCustomType(false);
      setForm({ date_prelevement:'',type_prelevement:'',pathologiste:'',type_histologique:'',grade_tumoral:'',marges_chirurgicales:'',ki67:'',er:'Non testé',pr:'Non testé',her2:'Non testé',pd_l1:'Non testé',mmr_msi:'Non testé',resultat_biopsie:'',compte_rendu:'' });
      onSaved();
    } catch(e) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const addExtraMarqueur = () => {
    if (!newMarqueurNom.trim()) return;
    setExtraMarqueurs(p => [...p, { nom: newMarqueurNom.trim(), valeur: 'Non testé' }]);
    setNewMarqueurNom('');
  };

  const Section = ({ title, icon, children }) => (
    <div style={{ marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: '#f8fafc', padding: '10px 16px', fontWeight: 700, fontSize: 13, color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{icon} {title}</div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );

  const FG = ({ label, children }) => (
    <div className="form-group" style={{ minWidth: 180 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      <div className="card-header">
        <h2>🔬 Anatomopathologie ({anapath.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
      </div>

      {showForm && (
        <div style={{ padding: 24, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>

          <Section title="Informations générales" icon="👤">
            <div className="form-row">
              <FG label="Date de biopsie"><input type="date" className="form-control" value={form.date_prelevement} onChange={e => s('date_prelevement', e.target.value)} /></FG>
              <FG label="Type de prélèvement">
                <select className="form-control" value={form.type_prelevement} onChange={e => s('type_prelevement', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {TYPE_PRELEVEMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </FG>
              <FG label="Pathologiste"><input className="form-control" placeholder="Dr. ..." value={form.pathologiste} onChange={e => s('pathologiste', e.target.value)} /></FG>
            </div>
          </Section>

          <Section title="Histologie" icon="🔬">
            <div className="form-row">
              <FG label="Type histologique">
                {!showCustomType ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select className="form-control" value={form.type_histologique} onChange={e => {
                      if(e.target.value==='__custom__') { setShowCustomType(true); }
                      else { s('type_histologique', e.target.value); s('marges_chirurgicales', ''); }
                    }}>
                      <option value="">Sélectionner</option>
                      {TYPE_HISTO_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      <option value="__custom__">+ Autre (saisie libre)</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-control" placeholder="Saisir le type..." value={customTypeInput} onChange={e => setCustomTypeInput(e.target.value)} autoFocus />
                    <button className="btn btn-outline btn-sm" onClick={() => setShowCustomType(false)}>↩</button>
                  </div>
                )}
              </FG>
              <FG label="Grade tumoral">
                <select className="form-control" value={form.grade_tumoral} onChange={e => s('grade_tumoral', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {GRADE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </FG>
              <FG label="Marges chirurgicales">
                <select className="form-control" value={form.marges_chirurgicales} onChange={e => s('marges_chirurgicales', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {(MARGES_BY_TYPE[form.type_histologique] || DEFAULT_MARGES).map(o => <option key={o}>{o}</option>)}
                </select>
                {form.type_histologique && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Options pour: {showCustomType ? customTypeInput : form.type_histologique}
                  </div>
                )}
              </FG>
              <FG label="Ki-67 (%)"><input type="number" min="0" max="100" className="form-control" placeholder="0-100" value={form.ki67} onChange={e => s('ki67', e.target.value)} /></FG>
            </div>
          </Section>

          <Section title="Marqueurs immunohistochimiques" icon="🧫">
            <div className="form-row">
              {[['Récepteurs estrogènes (ER)','er'],['Récepteurs progestérone (PR)','pr'],['HER2','her2'],['PD-L1','pd_l1'],['MMR / MSI','mmr_msi']].map(([label, key]) => (
                <FG key={key} label={label}>
                  <select className="form-control" value={form[key]} onChange={e => s(key, e.target.value)}>
                    {MARQUEUR_OPTS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </FG>
              ))}
            </div>

            {/* Extra marqueurs */}
            {extraMarqueurs.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, marginBottom: 12 }}>
                {extraMarqueurs.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{m.nom}:</span>
                    <select style={{ border: 'none', fontSize: 12, color: '#475569', background: 'transparent' }} value={m.valeur}
                      onChange={e => { const a=[...extraMarqueurs]; a[i].valeur=e.target.value; setExtraMarqueurs(a); }}>
                      {MARQUEUR_OPTS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <button onClick={() => setExtraMarqueurs(p => p.filter((_,j)=>j!==i))} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <input className="form-control" style={{ maxWidth: 200, fontSize: 13 }} placeholder="+ Nouveau marqueur..." value={newMarqueurNom} onChange={e => setNewMarqueurNom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExtraMarqueur()} />
              <button className="btn btn-outline btn-sm" onClick={addExtraMarqueur}>+ Ajouter</button>
            </div>
          </Section>

          <Section title="Résultats" icon="📋">
            <div className="form-group"><label className="form-label">Résultat biopsie</label><textarea className="form-control" rows={3} value={form.resultat_biopsie} onChange={e => s('resultat_biopsie', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Compte rendu</label><textarea className="form-control" rows={4} value={form.compte_rendu} onChange={e => s('compte_rendu', e.target.value)} /></div>
          </Section>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳...' : '💾 Enregistrer'}</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="card-body">
        {anapath.length === 0 ? (
          <div className="empty-state"><div style={{fontSize:36}}>🔬</div><p>Aucun résultat anapath</p></div>
        ) : anapath.map(a => (
          <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{a.type_histologique || 'N/A'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {a.date_prelevement?.slice(0,10)} {a.type_prelevement && `· ${a.type_prelevement}`} {a.pathologiste && `· Dr. ${a.pathologiste}`}
                </div>
              </div>
              <button onClick={() => onDelete(a.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', fontSize: 16 }}>🗑</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {[['HER2',a.her2],['ER',a.er],['PR',a.pr],['PD-L1',a.pd_l1],['MMR',a.mmr_msi]].map(([label,val]) => val && val !== 'Non testé' ? (
                <span key={label} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:(MARQUEUR_COLORS[val]||'#94a3b8')+'22', color:(MARQUEUR_COLORS[val]||'#94a3b8') }}>{label}: {val}</span>
              ) : null)}
              {a.grade_tumoral && <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#f0f4f8', color:'#475569' }}>{a.grade_tumoral}</span>}
              {a.marges_chirurgicales && <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: a.marges_chirurgicales.includes('R0')?'#dcfce7':a.marges_chirurgicales.includes('R2')?'#fee2e2':'#fef3c7', color: a.marges_chirurgicales.includes('R0')?'#166534':a.marges_chirurgicales.includes('R2')?'#991b1b':'#92400e' }}>Marges: {a.marges_chirurgicales}</span>}
              {a.ki67 && <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#ede9fe', color:'#7c3aed' }}>Ki67: {a.ki67}%</span>}
            </div>
            {a.autres_marqueurs_custom && <div style={{ fontSize:12, color:'#64748b', marginBottom:8 }}>Autres: {a.autres_marqueurs_custom}</div>}
            {a.resultat_biopsie && <div style={{ fontSize:13, color:'#475569', background:'#f8fafc', padding:10, borderRadius:8, marginBottom:8 }}><strong>Biopsie:</strong> {a.resultat_biopsie}</div>}
            {a.compte_rendu && <div style={{ fontSize:13, color:'#475569', background:'#f0f9ff', padding:10, borderRadius:8 }}><strong>CR:</strong> {a.compte_rendu}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CasDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cas, setCas] = useState(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [loading, setLoading] = useState(true);

  // Data states
  const [anapath, setAnapath] = useState([]);
  const [biologie, setBiologie] = useState([]);
  const [imagerie, setImagerie] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [effets, setEffets] = useState([]);
  const [chimio, setChimio] = useState([]);
  const [parametres, setParametres] = useState([]);
  const [champsDynamiques, setChampsDynamiques] = useState([]);
  const [valeursDynamiques, setValeursDynamiques] = useState({});

  // AI states
  const [isAnalyzingPatient, setIsAnalyzingPatient] = useState(false);
  const [patientAiReport, setPatientAiReport] = useState(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [showChimioForm, setShowChimioForm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [casRes, aRes, bRes, iRes, cRes, eRes, chRes, pRes, lrRes, labosRes, champsRes, valeursRes] = await Promise.all([
        getCase(id),
        api.get(`/anapath/${id}`),
        api.get(`/biologie/${id}`),
        api.get(`/imagerie/${id}`),
        api.get(`/consultations/${id}`),
        api.get(`/effets-secondaires/${id}`),
        api.get(`/chimio-seances/${id}`),
        api.get('/parametres'),
        api.get('/champs-dynamiques?entite=cancer').catch(() => ({ data: [] })),
        api.get(`/valeurs-dynamiques/${id}`).catch(() => ({ data: [] }))
      ]);
      setCas(casRes.data);
      setAnapath(aRes.data);
      setBiologie(bRes.data);
      setImagerie(iRes.data);
      setConsultations(cRes.data);
      setEffets(eRes.data);
      setChimio(chRes.data);
      setParametres(pRes.data);
      setChampsDynamiques(champsRes.data || []);
      const vals = {};
      (valeursRes.data || []).forEach(v => { vals[v.champ_id] = v.valeur; });
      setValeursDynamiques(vals);
    } catch(e) { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    try {
      const data = { ...formData, case_id: id };
      if (activeTab === 'anapath') await api.post('/anapath', data);
      else if (activeTab === 'biologie') await api.post('/biologie', data);
      else if (activeTab === 'imagerie') await api.post('/imagerie', data);
      else if (activeTab === 'traitement') await api.post('/traitements', data);
      else if (activeTab === 'consultations') await api.post('/consultations', data);
      else if (activeTab === 'effets') await api.post('/effets-secondaires', data);
      else if (activeTab === 'documents') {
         // Placeholder pour document backend si nécessaire.
         toast.success('Fonctionnalité document en cours.');
         setShowForm(false);
         return;
      }
      toast.success('Ajouté!');
      setShowForm(false);
      setShowChimioForm(false);
      setFormData({});
      loadAll();
    } catch(e) { toast.error('Erreur: ' + (e.response?.data?.message || e.message)); }
  };

  const handleDelete = async (endpoint, itemId) => {
    if (!window.confirm('Supprimer?')) return;
    await api.delete(`/${endpoint}/${itemId}`);
    toast.success('Supprimé');
    loadAll();
  };

  const handleResolveEffet = async (efId) => {
    await api.put(`/effets-secondaires/${efId}/resoudre`, { date_resolution: new Date().toISOString().slice(0,10) });
    toast.success('Marqué comme résolu');
    loadAll();
  };

  const handleAnalyzePatientIA = async () => {
    setIsAnalyzingPatient(true);
    setPatientAiReport(null);
    try {
      const payload = {
        cas,
        anapath,
        biologie,
        imagerie,
        traitements: cas.traitements || [],
        consultations,
        effets
      };
      const res = await api.post('/stats/analyze-patient', payload);
      setPatientAiReport(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de connexion à l'IA");
    } finally {
      setIsAnalyzingPatient(false);
    }
  };

  if (loading) return <Layout title="Dossier"><div className="loading-center"><div className="spinner"/></div></Layout>;
  if (!cas) return <Layout title="Dossier"><div className="alert alert-error">Cas introuvable</div></Layout>;

  const age = cas.patient_date_naissance ? Math.floor((new Date() - new Date(cas.patient_date_naissance)) / (365.25 * 24 * 3600 * 1000)) : '?';

  // Bio chart data
  const bioChartData = () => {
    const params = [...new Set(biologie.map(b => b.parametre))].slice(0, 3);
    const colors = ['#0f4c81', '#e63946', '#22c55e'];
    return {
      labels: [...new Set(biologie.map(b => b.date_examen?.slice(0,10)))].sort(),
      datasets: params.map((p, i) => ({
        label: p,
        data: biologie.filter(b => b.parametre === p).map(b => parseFloat(b.valeur)).filter(v => !isNaN(v)),
        borderColor: colors[i], backgroundColor: colors[i] + '22', tension: 0.4, fill: false
      }))
    };
  };

  return (
    <Layout title="Dossier Patient">
      {/* Header */}
      <div style={{ background: 'white', borderRadius: 14, padding: '20px 24px', marginBottom: 20, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{cas.patient_prenom} {cas.patient_nom}</h1>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{cas.numero_dossier}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '8px 24px', fontSize: 13 }}>
          {[
            ['Sexe / Âge', `${cas.patient_sexe === 'M' ? 'Homme' : 'Femme'} · ${age} ans`],
            ['Type Cancer', `${cas.sous_type || cas.type_cancer} — ${cas.stade || 'N/A'}`],
            ['Téléphone', cas.patient_telephone || '—'],
            ['Admission', cas.date_diagnostic?.slice(0,10) || '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>
        <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: cas.statut_patient === 'Guéri' ? '#dcfce7' : cas.statut_patient === 'Décédé' ? '#fee2e2' : '#dbeafe', color: cas.statut_patient === 'Guéri' ? '#166534' : cas.statut_patient === 'Décédé' ? '#991b1b' : '#1e40af' }}>
          {cas.statut_patient}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', padding: 6, borderRadius: 12, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setShowForm(false); setShowChimioForm(false); setFormData({}); }} style={{
            padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: activeTab === t.id ? '#0f4c81' : 'transparent',
            color: activeTab === t.id ? 'white' : '#64748b',
            fontFamily: 'Sora, sans-serif', transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card">
        {/* ===== RESUME ===== */}
        {activeTab === 'resume' && (
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { title: '🔬 Anapath', count: anapath.length, color: '#7c3aed', items: anapath.slice(0,2).map(a => `${a.type_histologique || 'N/A'} — ${a.date_prelevement?.slice(0,10) || ''}`) },
                { title: '🧪 Biologie', count: biologie.length, color: '#0f4c81', items: biologie.slice(0,2).map(b => `${b.parametre}: ${b.valeur} ${b.unite||''}`) },
                { title: '🏥 Imagerie', count: imagerie.length, color: '#d97706', items: imagerie.slice(0,2).map(i => `${i.type_examen} — ${i.date_examen?.slice(0,10)||''}`) },
                { title: '💊 Chimio', count: chimio.length, color: '#e63946', items: chimio.slice(0,2).map(c => `Cycle ${c.numero_cycle||'?'}: ${c.protocole||'N/A'}`) },
                { title: '🩺 Consultations', count: consultations.length, color: '#22c55e', items: consultations.slice(0,2).map(c => `${c.date_consultation?.slice(0,10)||''}: ${c.decision_medicale?.slice(0,40)||''}`) },
                { title: '⚠️ Effets 2nd', count: effets.filter(e => !e.resolu).length, color: '#f59e0b', items: effets.filter(e=>!e.resolu).slice(0,2).map(e => `${e.type_effet} — ${e.grade}`) },
              ].map(card => (
                <div key={card.title} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, borderLeft: `4px solid ${card.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{card.title}</div>
                    <span style={{ background: card.color + '22', color: card.color, fontWeight: 800, fontSize: 18, padding: '0 10px', borderRadius: 8 }}>{card.count}</span>
                  </div>
                  {card.items.length > 0 ? card.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#64748b', padding: '4px 0', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>{item}</div>
                  )) : <div style={{ fontSize: 12, color: '#cbd5e1', fontStyle: 'italic' }}>Aucune donnée</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== DIAGNOSTIC ===== */}
        {activeTab === 'diagnostic' && (
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                ['Date diagnostic', cas.date_diagnostic?.slice(0,10)],
                ['Date 1ers symptômes', cas.date_premiers_symptomes?.slice(0,10)],
                ['Base diagnostic', cas.base_diagnostic],
                ['Établissement diag.', cas.etablissement_diagnostiqueur],
                ['Médecin diag.', cas.medecin_diagnostiqueur],
                ['Type de cancer', cas.type_cancer],
                ['Organe / Localisation', cas.localisation],
                ['Latéralité', cas.lateralite],
                ['Code CIM-10', cas.code_cim10],
                ['Type histologique', cas.type_histologique],
                ['Grade histo.', cas.grade_histologique],
                ['N° Bloc', cas.numero_bloc],
                ['Stade global', cas.stade],
                ['TNM', cas.tnm_t || cas.tnm_n || cas.tnm_m ? `T${cas.tnm_t||'X'} N${cas.tnm_n||'X'} M${cas.tnm_m||'X'}` : '—'],
                ['État', cas.etat],
                ['Taille tumeur', cas.taille_cancer ? `${cas.taille_cancer} cm` : '—'],
                ['Ganglions envahis', cas.nb_ganglions_envahis],
                ['Sites métastatiques', cas.sites_metastatiques],
                ['Récepteur ER', cas.recepteur_er !== 'Inconnu' && !!cas.recepteur_er ? cas.recepteur_er : null],
                ['Récepteur PR', cas.recepteur_pr !== 'Inconnu' && !!cas.recepteur_pr ? cas.recepteur_pr : null],
                ['HER2', cas.her2 !== 'Inconnu' && !!cas.her2 ? cas.her2 : null],
                ['Anomalies gén.', cas.anomalies_genetiques],
                ['Décision RCP', cas.decision_rcp],
                ['Médecin traitant', cas.medecin_nom ? `Dr. ${cas.medecin_nom}` : '—'],
                ['Statut', cas.statut_patient]
              ].map(([label, val]) => val ? (
                <div key={label} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{val}</div>
                </div>
              ) : null)}
            </div>

            {champsDynamiques.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>⚡ Paramètres Spécifiques (Dynamiques)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {champsDynamiques.map(s => {
                    const val = valeursDynamiques[s.id];
                    if (!val) return null;
                    return (
                      <div key={s.id} style={{ padding: '12px 16px', background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', marginBottom: 4 }}>{s.nom}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#4c1d95' }}>{s.type_champ === 'booleen' ? (val === 'true' ? 'Oui' : 'Non') : val}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {cas.rapport_anatomopathologique && (
              <div style={{ marginTop: 16, padding: 16, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 8 }}>RAPPORT ANATOMOPATHOLOGIQUE</div>
                <div style={{ fontSize: 13, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{cas.rapport_anatomopathologique}</div>
              </div>
            )}
          </div>
        )}

        {/* ===== ANAPATH ===== */}
        {activeTab === 'anapath' && (
          <AnathForm
            caseId={id}
            anapath={anapath}
            onSaved={loadAll}
            onDelete={(aid) => handleDelete('anapath', aid)}
            MARQUEUR_COLORS={MARQUEUR_COLORS}
          />
        )}

        {/* ===== BIOLOGIE ===== */}
        {activeTab === 'biologie' && (
          <div>
            <div className="card-header">
              <h2>🧪 Analyses Biologiques ({biologie.length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
            </div>
            {showForm && (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" onChange={e => set('date_examen', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Type examen</label>
                    <select className="form-control" onChange={e => set('type_examen', e.target.value)}>
                      {['NFS','Biochimie','Marqueurs tumoraux','Coagulation','Ionogramme','Autre'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Paramètre</label><input className="form-control" placeholder="Ex: Hémoglobine, CA15-3" onChange={e => set('parametre', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Valeur</label><input className="form-control" placeholder="Ex: 12.5" onChange={e => set('valeur', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Unité</label><input className="form-control" placeholder="g/dL, U/mL..." onChange={e => set('unite', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Valeur normale</label><input className="form-control" placeholder="12-16 g/dL" onChange={e => set('valeur_normale', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Interprétation</label>
                    <select className="form-control" onChange={e => set('interpretation', e.target.value)}>
                      {['Normal','Bas','Haut','Critique'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAdd}>Enregistrer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
                </div>
              </div>
            )}
            <div className="card-body">
              {biologie.length >= 2 && (
                <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📈 Évolution des paramètres</div>
                  <Line data={bioChartData()} options={{ 
                    responsive: true, 
                    plugins: { 
                      legend: { position: 'bottom' },
                      zoom: {
                        pan: { enabled: true, mode: 'x' },
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
                      }
                    }, 
                    scales: { x: { grid: { display: false } }, y: { beginAtZero: false } } 
                  }} />
                </div>
              )}
              {biologie.length === 0 ? <div className="empty-state"><div style={{fontSize:36}}>🧪</div><p>Aucun résultat biologique</p></div> :
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#f8fafc' }}>
                    {['Date','Type','Paramètre','Valeur','Unité','Référence','Interp.',''].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {biologie.map((b, i) => (
                      <tr key={b.id} style={{ background: i%2===0?'white':'#fafbfc' }}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>{b.date_examen?.slice(0,10)}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>{b.type_examen}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{b.parametre}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{b.valeur}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{b.unite}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontSize: 12 }}>{b.valeur_normale}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: STATUS_COLORS[b.interpretation]+'22', color: STATUS_COLORS[b.interpretation] }}>{b.interpretation}</span>
                        </td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                          <button onClick={() => handleDelete('biologie', b.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer' }}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </div>
        )}

        {/* ===== IMAGERIE ===== */}
        {activeTab === 'imagerie' && (
          <div>
            <div className="card-header">
              <h2>🏥 Imagerie ({imagerie.length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
            </div>
            {showForm && (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" onChange={e => set('date_examen', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-control" onChange={e => set('type_examen', e.target.value)}>
                      {['Scanner','IRM','Radiographie','PET Scan','Échographie','Mammographie','Autre'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Région</label><input className="form-control" placeholder="Ex: Thorax, Abdomen..." onChange={e => set('region', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Résultat résumé</label><textarea className="form-control" rows={2} onChange={e => set('resultat_resume', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Conclusion</label><textarea className="form-control" rows={2} onChange={e => set('conclusion', e.target.value)} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAdd}>Enregistrer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
                </div>
              </div>
            )}
            <div className="card-body">
              {imagerie.length === 0 ? <div className="empty-state"><div style={{fontSize:36}}>🏥</div><p>Aucune imagerie</p></div> : imagerie.map(img => (
                <div key={img.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ padding: '4px 12px', background: '#dbeafe', color: '#0f4c81', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{img.type_examen}</span>
                      {img.region && <span style={{ fontSize: 13, color: '#64748b' }}>{img.region}</span>}
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{img.date_examen?.slice(0,10)}</span>
                    </div>
                    <button onClick={() => handleDelete('imagerie', img.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer' }}>🗑</button>
                  </div>
                  {img.resultat_resume && <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 8 }}><strong>Résultat:</strong> {img.resultat_resume}</div>}
                  {img.conclusion && <div style={{ fontSize: 13, color: '#0f4c81', background: '#f0f9ff', padding: 10, borderRadius: 8 }}><strong>Conclusion:</strong> {img.conclusion}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TRAITEMENT ===== */}
        {activeTab === 'traitement' && (
          <div>
            <div className="card-header">
              <h2>💊 Traitements ({(cas.traitements||[]).length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
            </div>
            {showForm && (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex:1.5 }}>
                    <label className="form-label">Type de traitement *</label>
                    <select className="form-control" onChange={e => set('type_traitement', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {['Chimiothérapie','Radiothérapie','Chirurgie','Hormonothérapie','Immunothérapie','Thérapie ciblée','Autre'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex:1.5 }}>
                    <label className="form-label">Intention</label>
                    <select className="form-control" onChange={e => set('intention', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {['Curatif','Adjuvant','Néo-adjuvant','Palliatif','Prophylactique'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex:1 }}>
                    <label className="form-label">Statut</label>
                    <select className="form-control" onChange={e => set('statut', e.target.value)}>
                      <option value="Planifié">Planifié</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                      <option value="En pause">En pause</option>
                      <option value="Suspendu">Suspendu</option>
                      <option value="Abandonné">Abandonné</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group"><label className="form-label">Protocole</label><input className="form-control" placeholder="Ex: FEC, FOLFIRINOX..." onChange={e => set('protocole', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Ligne</label><input type="number" className="form-control" placeholder="Ex: 1" onChange={e => set('ligne_traitement', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Voie admin.</label><input className="form-control" placeholder="IV, Per os..." onChange={e => set('voie_administration', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Jours d'admin.</label><input className="form-control" placeholder="Ex: J1, J8, J15..." onChange={e => set('jours_administration', e.target.value)} /></div>
                </div>

                <div className="form-row">
                  <div className="form-group"><label className="form-label">Cycles prévus</label><input type="number" className="form-control" onChange={e => set('nb_cycles_prevus', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Cycles réalisés</label><input type="number" className="form-control" value={formData.cycles_realises===undefined ? '' : formData.cycles_realises} onChange={e => set('cycles_realises', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Date début</label><input type="date" className="form-control" onChange={e => set('date_debut', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Date fin</label><input type="date" className="form-control" onChange={e => set('date_fin', e.target.value)} /></div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}><label className="form-label">Description / Notes</label><textarea className="form-control" rows={2} onChange={e => set('description', e.target.value)} /></div>
                  <div className="form-group" style={{ flex: 1 }}><label className="form-label">Toxicité observée</label><textarea className="form-control" rows={2} onChange={e => set('toxicite_observee', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Résultat</label><textarea className="form-control" rows={2} placeholder="Réponse complète, partielle..." onChange={e => set('resultat', e.target.value)} /></div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    try {
                      const n = v => (v === undefined || v === '' ? null : v);
                      await api.post('/traitements', { 
                        case_id: id, 
                        type_traitement: formData.type_traitement, 
                        intention: n(formData.intention),
                        statut: formData.statut || 'Planifié',
                        protocole: n(formData.protocole),
                        ligne_traitement: n(formData.ligne_traitement),
                        nb_cycles_prevus: n(formData.nb_cycles_prevus),
                        cycles_realises: n(formData.cycles_realises),
                        jours_administration: n(formData.jours_administration),
                        voie_administration: n(formData.voie_administration),
                        date_debut: n(formData.date_debut), 
                        date_fin: n(formData.date_fin), 
                        description: n(formData.description), 
                        toxicite_observee: n(formData.toxicite_observee),
                        resultat: n(formData.resultat) 
                      });
                      toast.success('Traitement ajouté!');
                      setShowForm(false); setFormData({});
                      loadAll();
                    } catch(e) { toast.error('Erreur: ' + (e.response?.data?.message || e.message)); }
                  }}>Enregistrer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
                </div>
              </div>
            )}
            <div className="card-body">
              {(!cas.traitements || cas.traitements.length === 0) ? (
                <div className="empty-state"><div style={{fontSize:36}}>💊</div><p>Aucun traitement</p></div>
              ) : cas.traitements.map(t => (
                <div key={t.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{t.type_traitement}</span>
                      {t.protocole && <span style={{ fontWeight: 700, fontSize: 13, color: '#0f4c81', background: '#e0f2fe', padding: '2px 8px', borderRadius: 4 }}>{t.protocole}</span>}
                      {t.statut && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: t.statut === 'Terminé' ? '#dcfce7' : t.statut === 'En cours' ? '#fef08a' : '#e2e8f0', color: t.statut === 'Terminé' ? '#166534' : t.statut === 'En cours' ? '#854d0e' : '#475569', fontWeight: 700 }}>{t.statut}</span>}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{t.date_debut?.slice(0,10) || '?'} → {t.date_fin?.slice(0,10) || '...'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#475569', marginBottom: 10 }}>
                    {t.intention && <div><strong>Intention:</strong> {t.intention}</div>}
                    {t.ligne_traitement && <div><strong>Ligne:</strong> {t.ligne_traitement}</div>}
                    {t.voie_administration && <div><strong>Voie:</strong> {t.voie_administration}</div>}
                    {t.jours_administration && <div><strong>Jours:</strong> {t.jours_administration}</div>}
                    {(t.nb_cycles_prevus || t.cycles_realises) && <div><strong>Cycles:</strong> {t.cycles_realises || 0} / {t.nb_cycles_prevus || '?'}</div>}
                  </div>

                  {t.description && <div style={{ fontSize: 13, color: '#475569', marginBottom: 8, paddingLeft: 10, borderLeft: '2px solid #cbd5e1' }}>{t.description}</div>}
                  
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {t.toxicite_observee && <div style={{ flex: 1, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#991b1b' }}><strong>Toxicité:</strong> {t.toxicite_observee}</div>}
                    {t.resultat && <div style={{ flex: 1, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#166534' }}><strong>Réponse:</strong> {t.resultat}</div>}
                  </div>
                </div>
              ))}
            </div>

            <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

            <div className="card-header">
              <h2>💉 Tracker Séances de Chimiothérapie ({chimio.length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowChimioForm(!showChimioForm)}>+ Séance</button>
            </div>
            {showChimioForm && (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date séance</label><input type="date" className="form-control" onChange={e => set('date_seance', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Protocole</label><input className="form-control" placeholder="Ex: FEC, AC-T, FOLFOX..." onChange={e => set('protocole', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">N° Cycle</label><input type="number" className="form-control" placeholder="1,2,3..." onChange={e => set('numero_cycle', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Dose</label><input className="form-control" placeholder="Ex: 600mg/m²" onChange={e => set('dose_administree', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Tolérance</label>
                    <select className="form-control" onChange={e => set('tolerance', e.target.value)}>
                      {['Bonne','Moyenne','Mauvaise'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Effets observés</label><textarea className="form-control" rows={2} onChange={e => set('effets_observes', e.target.value)} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    try {
                      await api.post('/chimio-seances', { ...formData, case_id: id });
                      toast.success('Séance ajoutée!');
                      setShowChimioForm(false); setFormData({});
                      loadAll();
                    } catch(e) { toast.error('Erreur'); }
                  }}>Enregistrer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowChimioForm(false)}>Annuler</button>
                </div>
              </div>
            )}
            <div className="card-body">
              {chimio.length === 0 ? <div className="empty-state"><div style={{fontSize:36}}>💉</div><p>Aucune séance</p></div> : chimio.map(c => (
                <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#0f4c81', flexShrink: 0 }}>C{c.numero_cycle||'?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700 }}>{c.protocole || 'Protocole N/A'} <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>— {c.date_seance?.slice(0,10)}</span></div>
                      <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.tolerance==='Bonne'?'#dcfce7':c.tolerance==='Mauvaise'?'#fee2e2':'#fef3c7', color: c.tolerance==='Bonne'?'#166534':c.tolerance==='Mauvaise'?'#991b1b':'#92400e' }}>{c.tolerance}</span>
                    </div>
                    {c.dose_administree && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Dose: {c.dose_administree}</div>}
                    {c.effets_observes && <div style={{ fontSize: 13, color: '#475569', marginTop: 6, padding: '6px 10px', background: '#f8fafc', borderRadius: 6 }}>{c.effets_observes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== CONSULTATIONS ===== */}
        {activeTab === 'consultations' && (
          <div>
            <div className="card-header">
              <h2>🩺 Historique des Consultations ({consultations.length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Consultation</button>
            </div>
            {showForm && (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date *</label><input type="date" className="form-control" onChange={e => set('date_consultation', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Poids (kg)</label><input type="number" className="form-control" placeholder="Ex: 68" onChange={e => set('poids', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Taille (cm)</label><input type="number" className="form-control" placeholder="Ex: 165" onChange={e => set('taille', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Tension artérielle</label><input className="form-control" placeholder="Ex: 120/80" onChange={e => set('tension_arterielle', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Température</label><input type="number" step="0.1" className="form-control" placeholder="Ex: 37.2" onChange={e => set('temperature', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Symptômes</label><textarea className="form-control" rows={2} onChange={e => set('symptomes', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Examen clinique</label><textarea className="form-control" rows={2} onChange={e => set('examen_clinique', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Décision médicale</label><textarea className="form-control" rows={2} onChange={e => set('decision_medicale', e.target.value)} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAdd}>Enregistrer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
                </div>
              </div>
            )}
            <div className="card-body">
              {consultations.length === 0 ? <div className="empty-state"><div style={{fontSize:36}}>🩺</div><p>Aucune consultation</p></div> : consultations.map(c => (
                <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#0f4c81', fontSize: 14 }}>{c.date_consultation?.slice(0,10)}</span>
                      {c.poids && <span style={{ fontSize: 13, color: '#64748b' }}>⚖️ {c.poids} kg</span>}
                      {c.tension_arterielle && <span style={{ fontSize: 13, color: '#64748b' }}>💓 {c.tension_arterielle}</span>}
                      {c.temperature && <span style={{ fontSize: 13, color: '#64748b' }}>🌡️ {c.temperature}°C</span>}
                      {c.medecin_nom && <span style={{ fontSize: 12, color: '#94a3b8' }}>Dr. {c.medecin_nom}</span>}
                    </div>
                    <button onClick={() => handleDelete('consultations', c.id)} style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer' }}>🗑</button>
                  </div>
                  {c.symptomes && <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Symptômes:</strong> {c.symptomes}</div>}
                  {c.examen_clinique && <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Examen:</strong> {c.examen_clinique}</div>}
                  {c.decision_medicale && <div style={{ fontSize: 13, padding: '8px 12px', background: '#f0f9ff', borderRadius: 8 }}><strong>Décision:</strong> {c.decision_medicale}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== EFFETS SECONDAIRES ===== */}
        {activeTab === 'effets' && (
          <div>
            <div className="card-header">
              <h2>⚠️ Effets Secondaires ({effets.length})</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
            </div>
            {showForm && (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Date apparition</label><input type="date" className="form-control" onChange={e => set('date_apparition', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Type d'effet</label>
                    <select className="form-control" onChange={e => set('type_effet', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {Array.from(new Set([...['Nausées','Vomissements','Fatigue','Chute de cheveux','Neutropénie','Anémie','Toxicité cardiaque','Infection','Mucite','Neuropathie','Autre'], ...parametres.filter(p => p.categorie === 'effet_indesirable').map(p => p.valeur)])).map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Grade</label>
                    <select className="form-control" onChange={e => set('grade', e.target.value)}>
                      {['Grade 1','Grade 2','Grade 3','Grade 4'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={2} onChange={e => set('description', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Traitement pris</label><input className="form-control" onChange={e => set('traitement_pris', e.target.value)} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleAdd}>Enregistrer</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
                </div>
              </div>
            )}
            <div className="card-body">
              {effets.length === 0 ? <div className="empty-state"><div style={{fontSize:36}}>⚠️</div><p>Aucun effet secondaire</p></div> : effets.map(e => (
                <div key={e.id} style={{ border: `1px solid ${e.resolu ? '#e2e8f0' : GRADE_COLORS[e.grade]+'44'}`, borderRadius: 10, padding: 16, marginBottom: 10, opacity: e.resolu ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{e.type_effet}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: GRADE_COLORS[e.grade]+'22', color: GRADE_COLORS[e.grade] }}>{e.grade}</span>
                        {e.resolu && <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>✓ Résolu</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Apparu le: {e.date_apparition?.slice(0,10)}</div>
                      {e.description && <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>{e.description}</div>}
                      {e.traitement_pris && <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 4 }}>💊 {e.traitement_pris}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!e.resolu && <button className="btn btn-sm" style={{ background: '#dcfce7', color: '#166534', border: 'none', cursor: 'pointer' }} onClick={() => handleResolveEffet(e.id)}>✓ Résolu</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== DOCUMENTS ===== */}
        {activeTab === 'documents' && (
          <div className="card-body">
            <div className="empty-state">
              <div style={{fontSize:36}}>📁</div>
              <h3>Module Documents</h3>
              <p>Hébergement des fichiers PDF liés au patient (à venir).</p>
            </div>
          </div>
        )}

        {/* ===== ASSISTANT IA ===== */}
        {activeTab === 'ia' && (
          <div className="card-body">
            {!patientAiReport && !isAnalyzingPatient && (
              <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'slideIn 0.3s ease' }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>🤖</div>
                <h3 style={{ color: '#0f4c81', marginBottom: 10 }}>Assistant Médical IA</h3>
                <p style={{ color: '#64748b', maxWidth: 600, margin: '0 auto 30px', lineHeight: 1.6 }}>
                  L'intelligence artificielle va scanner instantanément l'ensemble du profil de ce patient (Traitements, Biologie, Anapath, Actes chirurgicaux) pour synthétiser son parcours, détecter d'éventuels risques systémiques et formuler des propositions diagnostiques basées sur les derniers guidelines oncologiques.
                </p>
                <button 
                  onClick={handleAnalyzePatientIA} 
                  className="btn btn-primary" 
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', padding: '12px 24px', fontSize: 16 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, verticalAlign: 'middle' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  Générer le rapport IA complet
                </button>
              </div>
            )}

            {isAnalyzingPatient && (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div className="spinner" style={{ borderColor: '#7c3aed', borderRightColor: 'transparent', margin: '0 auto 20px', width: 40, height: 40, borderWidth: 4 }}></div>
                <h4 style={{ color: '#4f46e5', margin: 0 }}>Analyse croisée du dossier en cours...</h4>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>Veuillez patienter pendant l'extraction des signaux cliniques et biologiques.</div>
              </div>
            )}

            {patientAiReport && (
              <div style={{ animation: 'slideIn 0.4s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 'bold' }}>IA ACTIF</div>
                    <h2 style={{ margin: 0, color: '#0f172a', fontSize: 20 }}>Synthèse Intelligente de Dossier</h2>
                  </div>
                  <button onClick={() => setPatientAiReport(null)} className="btn btn-outline btn-sm">Réanalyser</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                  <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: '4px solid #6366f1' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#4338ca', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Résumé Clinique
                    </h4>
                    <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: 14 }}>{patientAiReport.synthese}</p>
                  </div>

                  {patientAiReport.alertes.length > 0 && (
                    <div style={{ background: '#fef2f2', padding: 24, borderRadius: 12, border: '1px solid #fecaca', borderLeft: '4px solid #ef4444' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Points d'Alerte & Risques Médicaux
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#7f1d1d', lineHeight: 1.6, fontSize: 14 }}>
                        {patientAiReport.alertes.map((al, idx) => <li key={idx} style={{ marginBottom: 6 }}>{al}</li>)}
                      </ul>
                    </div>
                  )}

                  <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 12, border: '1px solid #bbf7d0', borderLeft: '4px solid #10b981' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#047857', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      Propositions Thérapeutiques
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: 20, color: '#064e3b', lineHeight: 1.6, fontSize: 14 }}>
                      {patientAiReport.recommandations.map((rec, idx) => <li key={idx} style={{ marginBottom: 6 }}>{rec}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
