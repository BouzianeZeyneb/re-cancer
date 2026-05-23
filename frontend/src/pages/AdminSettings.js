import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

/* ─── Premium Modal Overlay Component ─── */
function Modal({ show, onClose, title, subtitle, icon, accentColor = '#3b82f6', children }) {
  if (!show) return null;

  const gradientFrom = accentColor;
  const gradientTo = accentColor === '#3b82f6' ? '#6366f1' : '#0ea5e9';

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 99999,
        padding: '24px 20px',
        overflowY: 'auto',
        animation: 'adminModalOverlayIn 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          margin: 'auto 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)',
          animation: 'adminModalContentIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden',
        }}
      >
        {/* ── Gradient Header ── */}
        <div style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          padding: '22px 24px 18px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 60, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {icon && (
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {icon}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>{title}</h3>
                {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                color: 'white',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes adminModalOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes adminModalContentIn {
          from { opacity: 0; transform: scale(0.92) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('listes');
  const [loading, setLoading] = useState(true);

  // Password change state (for all roles)
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirm) return toast.error('Les mots de passe ne correspondent pas');
    if (pwData.newPassword.length < 6) return toast.error('Le mot de passe doit faire au moins 6 caractères');
    setPwLoading(true);
    try {
      await api.put('/auth/password', { currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
      toast.success('Mot de passe modifié avec succès');
      setPwData({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally { setPwLoading(false); }
  };

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

  const closeListModal = () => {
    setShowFormList(false);
    setEditingListId(null);
    setFormDataList({ categorie: 'cancer', valeur: '', code: '', obligatoire: false });
  };

  const closeChampModal = () => {
    setShowFormChamp(false);
    setEditingChampId(null);
    setFormDataChamp({ entite: 'patient', nom: '', type_champ: 'texte', options_liste: '', obligatoire: false });
  };

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
      closeListModal();
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
      closeChampModal();
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

  /* ───── Shared input styles ───── */
  const fieldGroupStyle = { marginBottom: 14, padding: '12px 14px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', transition: 'border-color 0.2s' };
  const inputStyle = { height: 42, borderRadius: 10, fontWeight: 600, width: '100%', border: '1.5px solid #e2e8f0', background: 'white', fontSize: 14, padding: '0 14px', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 6, display: 'block', letterSpacing: '0.5px' };
  const btnFooterStyle = { padding: '16px 0 4px', borderTop: '1px solid #f1f5f9', marginTop: 8, display: 'flex', gap: 12, justifyContent: 'flex-end' };

  // Non-admin: show only account settings
  if (!isAdmin) {
    return (
      <Layout title="Mon Compte">
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 12px' }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Mon Compte</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: 500 }}>Gérez vos informations personnelles</p>
          </div>

          {/* Profile Card */}
          <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid #f1f5f9', padding: 32, marginBottom: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900 }}>
                {user?.nom?.[0]}{user?.prenom?.[0]}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{user?.prenom} {user?.nom}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{user?.email}</div>
                <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 6 }}>{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Password change */}
          <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 0, marginBottom: 24 }}>Changer le mot de passe</h3>
            <form onSubmit={handlePasswordChange}>
              {[['currentPassword', 'Mot de passe actuel'], ['newPassword', 'Nouveau mot de passe'], ['confirm', 'Confirmer le nouveau mot de passe']].map(([k, l]) => (
                <div key={k} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>{l}</label>
                  <input
                    type="password" required
                    value={pwData[k]}
                    onChange={e => setPwData(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              ))}
              <button type="submit" disabled={pwLoading} style={{ marginTop: 8, padding: '12px 28px', borderRadius: 12, background: '#0f172a', color: 'white', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', width: '100%' }}>
                {pwLoading ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

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
                    <button className="btn btn-primary" onClick={() => { setFormDataList({ categorie: 'cancer', valeur: '', code: '', obligatoire: false }); setEditingListId(null); setShowFormList(true); }}>
                      + Ajouter un Paramètre
                    </button>
                  </div>

                  {/* ── Modal pour Paramètre ── */}
                  <Modal
                    show={showFormList}
                    onClose={closeListModal}
                    title={editingListId ? 'Modifier le Paramètre' : 'Nouveau Paramètre'}
                    subtitle="Définir un élément de liste clinique"
                    accentColor="#3b82f6"
                    icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
                  >
                    <form onSubmit={handleSubmitList}>
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>Catégorie</label>
                        <select value={formDataList.categorie} onChange={e => setFormDataList({ ...formDataList, categorie: e.target.value })} disabled={!!editingListId} style={{ ...inputStyle, cursor: editingListId ? 'not-allowed' : 'pointer', opacity: editingListId ? 0.6 : 1 }}>
                          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>Valeur / Libellé</label>
                        <input type="text" style={inputStyle} value={formDataList.valeur} onChange={e => setFormDataList({ ...formDataList, valeur: e.target.value })} required placeholder="Ex: Diabète Type 2" onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                      </div>
                      <div style={{ ...fieldGroupStyle, marginBottom: 8 }}>
                        <label style={labelStyle}>Code (CIM-10)</label>
                        <input type="text" style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '1px' }} value={formDataList.code} onChange={e => setFormDataList({ ...formDataList, code: e.target.value })} placeholder="Ex: E11" onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                      </div>
                      <div style={btnFooterStyle}>
                        <button type="button" onClick={closeListModal} style={{ padding: '0 22px', height: 44, borderRadius: 11, fontWeight: 700, fontSize: 14, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}>Annuler</button>
                        <button type="submit" style={{ padding: '0 26px', height: 44, borderRadius: 11, fontWeight: 800, fontSize: 14, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)'; }}>
                          {editingListId ? 'Mettre à jour' : 'Enregistrer'}
                        </button>
                      </div>
                    </form>
                  </Modal>

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
                                <button className="btn-icon-subtle" onClick={() => { setFormDataList({ categorie: p.categorie, valeur: p.valeur, code: p.code || '', obligatoire: p.obligatoire || false }); setEditingListId(p.id); setShowFormList(true); }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 13.5-13.5z" /></svg>
                                </button>
                                <button className="btn-icon-subtle" style={{ color: '#ef4444' }} onClick={() => handleDeleteList(p.id)}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
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
                    <button className="btn btn-primary" onClick={() => { setFormDataChamp({ entite: 'patient', nom: '', type_champ: 'texte', options_liste: '', obligatoire: false }); setEditingChampId(null); setShowFormChamp(true); }}>
                      + Créer un Nouveau Champ
                    </button>
                  </div>

                  {/* ── Modal pour Champ Dynamique ── */}
                  <Modal
                    show={showFormChamp}
                    onClose={closeChampModal}
                    title={editingChampId ? 'Modifier le Champ' : 'Nouveau Champ Dynamique'}
                    subtitle="Ajouter un attribut personnalisé au formulaire"
                    accentColor="#8b5cf6"
                    icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>}
                  >
                    <form onSubmit={handleSubmitChamp}>
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>Entité Cible</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={formDataChamp.entite} onChange={e => setFormDataChamp({ ...formDataChamp, entite: e.target.value })}>
                          {entites.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                      </div>
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>Nom de l'attribut</label>
                        <input type="text" style={inputStyle} value={formDataChamp.nom} onChange={e => setFormDataChamp({ ...formDataChamp, nom: e.target.value })} required placeholder="Ex: Profession, Antécédent..." onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'; }} onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                      </div>
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>Format de Saisie</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={formDataChamp.type_champ} onChange={e => setFormDataChamp({ ...formDataChamp, type_champ: e.target.value })}>
                          {typesChamp.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>

                      {formDataChamp.type_champ === 'liste' && (
                        <div style={{ ...fieldGroupStyle, background: '#f0f4ff', borderColor: '#c7d2fe' }}>
                          <label style={{ ...labelStyle, color: '#6366f1' }}>Options de la Liste (séparées par virgules)</label>
                          <input type="text" style={{ ...inputStyle, borderColor: '#a5b4fc' }} value={formDataChamp.options_liste || ''} onChange={e => setFormDataChamp({ ...formDataChamp, options_liste: e.target.value })} placeholder="Ex: Type A, Type B, Type C..." required onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }} onBlur={e => { e.target.style.borderColor = '#a5b4fc'; e.target.style.boxShadow = 'none'; }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '14px 18px', background: '#faf5ff', borderRadius: 12, border: '1px solid #ede9fe', cursor: 'pointer' }} onClick={() => setFormDataChamp({ ...formDataChamp, obligatoire: !formDataChamp.obligatoire })}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: formDataChamp.obligatoire ? 'none' : '2px solid #d1d5db', background: formDataChamp.obligatoire ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                          {formDataChamp.obligatoire && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', userSelect: 'none' }}>Ce champ est REQUIS pour la validation</span>
                      </div>

                      <div style={btnFooterStyle}>
                        <button type="button" onClick={closeChampModal} style={{ padding: '0 22px', height: 44, borderRadius: 11, fontWeight: 700, fontSize: 14, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}>Annuler</button>
                        <button type="submit" style={{ padding: '0 26px', height: 44, borderRadius: 11, fontWeight: 800, fontSize: 14, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,92,246,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.3)'; }}>
                          {editingChampId ? 'Mettre à jour' : 'Créer et Activer'}
                        </button>
                      </div>
                    </form>
                  </Modal>

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
                                <button className="btn-icon-subtle" onClick={() => { setFormDataChamp({ entite: c.entite, nom: c.nom, type_champ: c.type_champ, options_liste: c.options_liste || '', obligatoire: c.obligatoire || false }); setEditingChampId(c.id); setShowFormChamp(true); }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 13.5-13.5z" /></svg>
                                </button>
                                <button className="btn-icon-subtle" style={{ color: '#ef4444' }} onClick={() => handleDeleteChamp(c.id)}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
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
