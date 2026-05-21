import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
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
        api.get('/parametres'),
        api.get('/champs-dynamiques')
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

  const handleSubmitList = async (e) => {
    e.preventDefault();
    try {
      if (editingListId) {
        await api.put(`/parametres/${editingListId}`, formDataList);
        toast.success('Paramètre mis à jour');
      } else {
        await api.post('/parametres', formDataList);
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
        await api.delete(`/parametres/${id}`);
        toast.success('Paramètre supprimé');
        fetchData();
      } catch (err) { toast.error('Erreur lors de la suppression'); }
    }
  };

  const handleSubmitChamp = async (e) => {
    e.preventDefault();
    try {
      if (editingChampId) {
        await api.put(`/champs-dynamiques/${editingChampId}`, formDataChamp);
        toast.success('Champ mis à jour');
      } else {
        await api.post('/champs-dynamiques', formDataChamp);
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
        await api.delete(`/champs-dynamiques/${id}`);
        toast.success('Champ supprimé');
        fetchData();
      } catch (err) { toast.error('Erreur de suppression'); }
    }
  };

  const getCategoryLabel = (cat) => categories.find(c => c.value === cat)?.label || cat;
  const getEntiteLabel = (ent) => entites.find(e => e.value === ent)?.label || ent;
  const getTypeChampLabel = (tc) => typesChamp.find(t => t.value === tc)?.label || tc;

  return (
    <Layout title="">
      <div style={{ padding: '0 12px 40px' }}>
        <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Administration Système</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: 500 }}>Configuration des paramètres cliniques et du générateur de formulaires</p>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '6px', background: '#f1f5f9', borderRadius: 16, marginBottom: 32, width: 'fit-content' }}>
          <button 
            className={`tab ${activeTab === 'listes' ? 'active' : ''}`}
            onClick={() => setActiveTab('listes')}
            style={{ 
                padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: activeTab === 'listes' ? 'white' : 'transparent',
                color: activeTab === 'listes' ? '#0f172a' : '#64748b',
                fontWeight: 700, fontSize: 14, boxShadow: activeTab === 'listes' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
            }}
          >
            Listes de Choix
          </button>
          <button 
            className={`tab ${activeTab === 'champs' ? 'active' : ''}`}
            onClick={() => setActiveTab('champs')}
            style={{ 
                padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: activeTab === 'champs' ? 'white' : 'transparent',
                color: activeTab === 'champs' ? '#0f172a' : '#64748b',
                fontWeight: 700, fontSize: 14, boxShadow: activeTab === 'champs' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
            }}
          >
            Générateur de Champs
          </button>
        </div>

        <div className="card" style={{ padding: '40px', borderRadius: 32, border: '1.5px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', minHeight: 400 }}>
          {loading ? (
             <div style={{ padding: 100, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <>
              {activeTab === 'listes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Gestion des Paramètres Cliniques</h3>
                    <button className={showFormList ? "btn btn-outline" : "btn btn-primary"} onClick={() => { setFormDataList({ categorie: 'cancer', valeur: '', code: '', obligatoire: false }); setEditingListId(null); setShowFormList(!showFormList); }}>
                      {showFormList ? 'Annuler' : '+ Ajouter un Paramètre'}
                    </button>
                  </div>
                  
                  {showFormList && (
                    <form onSubmit={handleSubmitList} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '32px', borderRadius: 24, marginBottom: 40, border: '1.5px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr auto', gap: '24px', alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Catégorie</label>
                          <select className="form-control" value={formDataList.categorie} onChange={e => setFormDataList({...formDataList, categorie: e.target.value})} disabled={!!editingListId} style={{ height: 48, borderRadius: 12, fontWeight: 600 }}>
                            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Valeur / Libellé</label>
                          <input type="text" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 600 }} value={formDataList.valeur} onChange={e => setFormDataList({...formDataList, valeur: e.target.value})} required placeholder="Ex: Diabète Type 2" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Code (CIM-10)</label>
                          <input type="text" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 600, fontFamily: 'JetBrains Mono' }} value={formDataList.code} onChange={e => setFormDataList({...formDataList, code: e.target.value})} placeholder="Ex: E11" />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', height: 48, borderRadius: 12, fontWeight: 800 }}>Enregistrer</button>
                      </div>
                    </form>
                  )}
                  
                  <div className="table-wrap">
                    <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Catégorie</th>
                          <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Libellé Clinique</th>
                          <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Code</th>
                          <th style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {parametres.map(p => (
                          <tr key={p.id}>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc' }}>
                                <span style={{ fontSize: 11, fontWeight: 900, background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 8 }}>{getCategoryLabel(p.categorie)}</span>
                            </td>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', fontWeight: 700, color: '#0f172a' }}>{p.valeur}</td>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc' }}>
                                <code style={{ fontSize: 13, background: '#f8fafc', color: '#6366f1', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>{p.code || '—'}</code>
                            </td>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn-icon-subtle" onClick={() => { setFormDataList({ categorie: p.categorie, valeur: p.valeur, code: p.code||'', obligatoire: p.obligatoire||false }); setEditingListId(p.id); setShowFormList(true); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 13.5-13.5z"/></svg>
                                </button>
                                <button className="btn-icon-subtle" style={{ color: '#ef4444' }} onClick={() => handleDeleteList(p.id)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Générateur de Formulaires Dynamiques</h3>
                    <button className={showFormChamp ? "btn btn-outline" : "btn btn-primary"} onClick={() => { setFormDataChamp({ entite: 'patient', nom: '', type_champ: 'texte', options_liste: '', obligatoire: false }); setEditingChampId(null); setShowFormChamp(!showFormChamp); }}>
                      {showFormChamp ? 'Annuler' : '+ Créer un Nouveau Champ'}
                    </button>
                  </div>
                  
                  {showFormChamp && (
                    <form onSubmit={handleSubmitChamp} style={{ background: '#f8fafc', padding: '32px', borderRadius: 24, marginBottom: 32, border: '1.5px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: 24 }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Entité Cible</label>
                          <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 600 }} value={formDataChamp.entite} onChange={e => setFormDataChamp({...formDataChamp, entite: e.target.value})}>
                            {entites.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Nom de l'attribut</label>
                          <input type="text" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 600 }} value={formDataChamp.nom} onChange={e => setFormDataChamp({...formDataChamp, nom: e.target.value})} required placeholder="Ex: Profession, Antécédent..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Format de Saisie</label>
                          <select className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 600 }} value={formDataChamp.type_champ} onChange={e => setFormDataChamp({...formDataChamp, type_champ: e.target.value})}>
                            {typesChamp.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      {formDataChamp.type_champ === 'liste' && (
                        <div className="form-group" style={{ marginBottom: 24 }}>
                          <label className="form-label" style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#3b82f6' }}>📌 Options de la Liste (Séparez par des virgules)</label>
                          <input type="text" className="form-control" style={{ height: 48, borderRadius: 12, fontWeight: 600, border: '1.5px solid #3b82f6' }} value={formDataChamp.options_liste || ''} onChange={e => setFormDataChamp({...formDataChamp, options_liste: e.target.value})} placeholder="Ex: Type A, Type B, Type C..." required />
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTops: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <input type="checkbox" id="obligatoire" checked={formDataChamp.obligatoire} onChange={e => setFormDataChamp({...formDataChamp, obligatoire: e.target.checked})} style={{ width: 22, height: 22, cursor: 'pointer' }} />
                          <label htmlFor="obligatoire" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Ce champ est REQUIS pour la validation</label>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0 32px', height: 50, borderRadius: 14, fontWeight: 800 }}>Créer et Activer</button>
                      </div>
                    </form>
                  )}
                  
                  <div className="table-wrap">
                    <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Cible</th>
                          <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Nom du Champ</th>
                          <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Type</th>
                          <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Options</th>
                          <th style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {champs.map(c => (
                          <tr key={c.id}>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc' }}>
                                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', background: c.entite === 'patient' ? '#f0f9ff' : '#fef2f2', color: c.entite === 'patient' ? '#0ea5e9' : '#e11d48', padding: '6px 12px', borderRadius: 8 }}>
                                  {getEntiteLabel(c.entite)}
                                </span>
                            </td>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', fontWeight: 700, color: '#0f172a' }}>{c.nom}</td>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc' }}>
                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{getTypeChampLabel(c.type_champ)}</span>
                            </td>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc' }}>
                              {c.type_champ === 'liste' ? (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {c.options_liste?.split(',').map((opt, i) => <span key={i} style={{ fontSize: 10, fontWeight: 700, background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: 6 }}>{opt.trim()}</span>)}
                                </div>
                              ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                            </td>
                            <td style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn-icon-subtle" onClick={() => { setFormDataChamp({ entite: c.entite, nom: c.nom, type_champ: c.type_champ, options_liste: c.options_liste||'', obligatoire: c.obligatoire||false }); setEditingChampId(c.id); setShowFormChamp(true); }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 13.5-13.5z"/></svg>
                                </button>
                                <button className="btn-icon-subtle" style={{ color: '#ef4444' }} onClick={() => handleDeleteChamp(c.id)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
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
