import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listes');
  const [loading, setLoading] = useState(true);

  // States for Listes (Paramètres)
  const [parametres, setParametres] = useState([]);
  const [formDataList, setFormDataList] = useState({ categorie: 'cancer', valeur: '', code: '', obligatoire: false });
  const [showFormList, setShowFormList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);

  // States for Champs Dynamiques
  const [champs, setChamps] = useState([]);
  const [formDataChamp, setFormDataChamp] = useState({ entite: 'patient', nom: '', type_champ: 'texte', options_liste: '', obligatoire: false });
  const [showFormChamp, setShowFormChamp] = useState(false);
  const [editingChampId, setEditingChampId] = useState(null);

  const categories = [
    { value: 'cancer', label: 'Types de Cancer' },
    { value: 'localite', label: 'Localités' },
    { value: 'antecedent', label: 'Antécédents' },
    { value: 'comorbidite', label: 'Comorbidités' },
    { value: 'effet_indesirable', label: 'Effets Indésirables' }
  ];

  const entites = [
    { value: 'patient', label: 'Infos Patient' },
    { value: 'habitudes_vie', label: 'Habitudes de Vie' },
    { value: 'cancer', label: 'Dossier Cancer' }
  ];

  const typesChamp = [
    { value: 'texte', label: 'Texte Libre' },
    { value: 'nombre', label: 'Nombre' },
    { value: 'date', label: 'Date' },
    { value: 'booleen', label: 'Oui/Non (Case à cocher)' },
    { value: 'liste', label: 'Liste Déroulante' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resParams, resChamps] = await Promise.all([
        axios.get('/api/parametres', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get('/api/champs-dynamiques', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setParametres(resParams.data);
      setChamps(resChamps.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers for Listes ---
  const handleSubmitList = async (e) => {
    e.preventDefault();
    try {
      if (editingListId) {
        await axios.put(`/api/parametres/${editingListId}`, formDataList, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
        toast.success('Paramètre mis à jour');
      } else {
        await axios.post('/api/parametres', formDataList, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
        toast.success('Paramètre ajouté');
      }
      setFormDataList({ categorie: 'cancer', valeur: '', code: '', obligatoire: false });
      setShowFormList(false);
      setEditingListId(null);
      fetchData();
    } catch (err) { toast.error('Erreur lors de la sauvegarde'); }
  };
  const handleDeleteList = async (id) => {
    if (window.confirm('Supprimer ce paramètre ?')) {
      try {
        await axios.delete(`/api/parametres/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
        toast.success('Paramètre supprimé');
        fetchData();
      } catch (err) { toast.error('Erreur lors de la suppression'); }
    }
  };

  // --- Handlers for Champs Dynamiques ---
  const handleSubmitChamp = async (e) => {
    e.preventDefault();
    try {
      if (editingChampId) {
        await axios.put(`/api/champs-dynamiques/${editingChampId}`, formDataChamp, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
        toast.success('Champ mis à jour');
      } else {
        await axios.post('/api/champs-dynamiques', formDataChamp, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
        toast.success('Champ dynamique créé');
      }
      setFormDataChamp({ entite: 'patient', nom: '', type_champ: 'texte', options_liste: '', obligatoire: false });
      setShowFormChamp(false);
      setEditingChampId(null);
      fetchData();
    } catch (err) { toast.error('Erreur lors de la sauvegarde du champ'); }
  };
  const handleDeleteChamp = async (id) => {
    if (window.confirm('Voulez-vous désactiver ce champ dynamique ?')) {
      try {
        await axios.delete(`/api/champs-dynamiques/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
        toast.success('Champ supprimé');
        fetchData();
      } catch (err) { toast.error('Erreur de suppression'); }
    }
  };

  const getCategoryLabel = (cat) => categories.find(c => c.value === cat)?.label || cat;
  const getEntiteLabel = (ent) => entites.find(e => e.value === ent)?.label || ent;
  const getTypeChampLabel = (tc) => typesChamp.find(t => t.value === tc)?.label || tc;

  return (
    <Layout title="Paramètres & Formulaires">
      <div className="card" style={{ padding: '0' }}>
        <div className="tabs" style={{ padding: '24px 28px 0', marginBottom: 0, borderBottom: '1px solid var(--border)' }}>
          <button 
            className={`tab ${activeTab === 'listes' ? 'active' : ''}`}
            onClick={() => setActiveTab('listes')}
          >
            Liste de Choix (Paramètres)
          </button>
          <button 
            className={`tab ${activeTab === 'champs' ? 'active' : ''}`}
            onClick={() => setActiveTab('champs')}
          >
            Générateur (Champs Dynamiques)
          </button>
        </div>

        <div className="card-body">
          {loading ? <div className="loading-center"><div className="spinner"></div></div> : (
            <>
              {activeTab === 'listes' && (
                <div>
                  <div className="section-header">
                    <h3 className="section-title" style={{ fontSize: 18 }}>Gestion des listes fixes (Paramètres)</h3>
                    <button className={showFormList ? "btn btn-outline" : "btn btn-primary"} onClick={() => { setFormDataList({ categorie: 'cancer', valeur: '', code: '', obligatoire: false }); setEditingListId(null); setShowFormList(!showFormList); }}>
                      {showFormList ? 'Annuler' : '+ Nouveau Paramètre'}
                    </button>
                  </div>
                  
                  {showFormList && (
                    <form onSubmit={handleSubmitList} style={{ background: 'var(--surface2)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Catégorie</label>
                          <select className="form-control" value={formDataList.categorie} onChange={e => setFormDataList({...formDataList, categorie: e.target.value})} disabled={!!editingListId}>
                            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Valeur / Nom</label>
                          <input type="text" className="form-control" value={formDataList.valeur} onChange={e => setFormDataList({...formDataList, valeur: e.target.value})} required placeholder="Ex: Diabète..." />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Code (Optionnel)</label>
                          <input type="text" className="form-control" value={formDataList.code} onChange={e => setFormDataList({...formDataList, code: e.target.value})} placeholder="E11..." />
                        </div>
                        
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Saisie Obligatoire ?</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '44px' }}>
                            <input type="checkbox" id="param-obligatoire" checked={formDataList.obligatoire} onChange={e => setFormDataList({...formDataList, obligatoire: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                            <label htmlFor="param-obligatoire" style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>Oui</label>
                          </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ padding: '14px 20px', gridColumn: '1 / -1', justifySelf: 'end' }}>Enregistrer le Paramètre</button>
                      </div>
                    </form>
                  )}
                  
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Catégorie</th><th>Nom / Valeur</th><th>Code</th><th>Obligatoire</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                      <tbody>
                        {parametres.map(p => (
                          <tr key={p.id}>
                            <td><span className="badge badge-blue">{getCategoryLabel(p.categorie)}</span></td>
                            <td style={{ fontWeight: 600 }}>{p.valeur}</td>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{p.code || '-'}</td>
                            <td>{p.obligatoire ? <span className="badge badge-red">OUI</span> : <span className="badge badge-gray">Non</span>}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn-icon" style={{ fontSize: 9, fontWeight: 700 }} onClick={() => { setFormDataList({ categorie: p.categorie, valeur: p.valeur, code: p.code||'', obligatoire: p.obligatoire||false }); setEditingListId(p.id); setShowFormList(true); }}>[MODIF]</button>
                                <button className="btn-icon" style={{ fontSize: 9, fontWeight: 700, color: '#ef4444' }} onClick={() => handleDeleteList(p.id)}>[SUPP]</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'champs' && (
                <div>
                  <div className="section-header">
                    <h3 className="section-title" style={{ fontSize: 18 }}>Champs Dynamiques Personnalisés</h3>
                    <button className={showFormChamp ? "btn btn-outline" : "btn btn-success"} onClick={() => { setFormDataChamp({ entite: 'patient', nom: '', type_champ: 'texte', options_liste: '', obligatoire: false }); setEditingChampId(null); setShowFormChamp(!showFormChamp); }}>
                      {showFormChamp ? 'Annuler' : 'Créer un Champ'}
                    </button>
                  </div>
                  
                  {showFormChamp && (
                    <form onSubmit={handleSubmitChamp} style={{ background: 'var(--success-light)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #6EE7B7' }}>
                      <div className="form-row-3">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Cible d'affichage</label>
                          <select className="form-control" value={formDataChamp.entite} onChange={e => setFormDataChamp({...formDataChamp, entite: e.target.value})}>
                            {entites.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Nom du Champ</label>
                          <input type="text" className="form-control" value={formDataChamp.nom} onChange={e => setFormDataChamp({...formDataChamp, nom: e.target.value})} required placeholder="Ex: Groupe Sanguin, Profession..." />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Type de Donnée</label>
                          <select className="form-control" value={formDataChamp.type_champ} onChange={e => setFormDataChamp({...formDataChamp, type_champ: e.target.value})}>
                            {typesChamp.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      {formDataChamp.type_champ === 'liste' && (
                        <div className="form-group" style={{ marginTop: '20px', marginBottom: 0 }}>
                          <label className="form-label" style={{ color: '#047857' }}>📌 Liste des Choix (Séparez chaque choix par une virgule)</label>
                          <input type="text" className="form-control" style={{ border: '2px solid #34D399', background: 'white' }} value={formDataChamp.options_liste || ''} onChange={e => setFormDataChamp({...formDataChamp, options_liste: e.target.value})} placeholder="Ex: Option A, Option B, Autre..." required />
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed #A7F3D0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input type="checkbox" id="obligatoire" checked={formDataChamp.obligatoire} onChange={e => setFormDataChamp({...formDataChamp, obligatoire: e.target.checked})} style={{ width: '22px', height: '22px', accentColor: 'var(--success)' }} />
                          <label htmlFor="obligatoire" style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#065F46', cursor: 'pointer' }}>Ce champ est REQUIS (Saisie Obligatoire)</label>
                        </div>
                        <button type="submit" className="btn btn-success" style={{ padding: '12px 24px', fontSize: '15px' }}>Enregistrer le Champ</button>
                      </div>
                    </form>
                  )}
                  
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Localisation (Cible)</th><th>Nom du Champ</th><th>Type (Format)</th><th>Choix (Options)</th><th>Saisie Libre / Requise</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                      <tbody>
                        {champs.map(c => (
                          <tr key={c.id}>
                            <td>
                              <span className={`badge ${c.entite === 'patient' ? 'badge-purple' : c.entite === 'cancer' ? 'badge-red' : 'badge-green'}`}>
                                {getEntiteLabel(c.entite)}
                              </span>
                            </td>
                            <td><strong style={{ fontSize: '15px' }}>{c.nom}</strong></td>
                            <td><span style={{ fontSize: '13px', background: 'var(--surface2)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>{getTypeChampLabel(c.type_champ)}</span></td>
                            <td>
                              {c.type_champ === 'liste' ? (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {c.options_liste?.split(',').map((opt, i) => <span key={i} className="badge badge-gray" style={{ fontSize: '10px' }}>{opt.trim()}</span>)}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— N/A —</span>
                              )}
                            </td>
                            <td>
                              {c.obligatoire ? <span className="badge badge-red">OBLIGATOIRE</span> : <span className="badge badge-gray">Optionnel</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn-icon" style={{ fontSize: 9, fontWeight: 700 }} onClick={() => { setFormDataChamp({ entite: c.entite, nom: c.nom, type_champ: c.type_champ, options_liste: c.options_liste||'', obligatoire: c.obligatoire||false }); setEditingChampId(c.id); setShowFormChamp(true); setActiveTab('champs'); }}>[MODIF]</button>
                                <button className="btn-icon" style={{ fontSize: 9, fontWeight: 700, color: '#ef4444' }} onClick={() => handleDeleteChamp(c.id)}>[SUPP]</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {champs.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}><div className="empty-state"><h3>Aucun champ dynamique</h3><p>Les champs que vous créez ici apparaîtront automatiquement dans les dossiers ciblés.</p></div></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
