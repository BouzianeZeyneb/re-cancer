import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUsers, createUser, updateUser, deleteUser } from '../utils/api';
import toast from 'react-hot-toast';

const ROLES = { admin: '🔑 Administrateur', medecin: '👨‍⚕️ Médecin', laboratoire: '🔬 Laboratoire', anapath: '🔬 Anapath' };
const roleClass = { admin: 'badge badge-red', medecin: 'badge badge-blue', laboratoire: 'badge badge-purple', anapath: 'badge badge-orange' };

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '', role: 'medecin', actif: true });

  const load = () => {
    getUsers().then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ nom: '', prenom: '', email: '', password: '', role: 'medecin', actif: true });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, password: '', role: u.role, actif: u.actif });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await updateUser(editUser.id, form);
        toast.success('Utilisateur modifié');
      } else {
        await createUser(form);
        toast.success('Utilisateur créé');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Désactiver cet utilisateur ?')) return;
    try {
      await deleteUser(id);
      toast.success('Utilisateur désactivé');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <Layout title="Gestion des Utilisateurs">
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={openCreate}>+ Nouvel Utilisateur</button>
      </div>

      <div className="card">
        <div className="card-header"><h2>Utilisateurs ({users.length})</h2></div>
        {loading ? <div className="loading-center"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f4c81', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                          {u.nom[0]}{u.prenom[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{u.email}</td>
                    <td><span className={roleClass[u.role] || 'badge badge-gray'}>{ROLES[u.role] || u.role}</span></td>
                    <td><span className={u.actif ? 'badge badge-green' : 'badge badge-red'}>{u.actif ? '✓ Actif' : '✗ Inactif'}</span></td>
                    <td style={{ fontSize: 12.5, color: '#94a3b8' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-DZ') : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(u)} title="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(u.id)} title="Désactiver" style={{ color: '#e63946' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nom *</label>
                    <input className="form-control" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prénom *</label>
                    <input className="form-control" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{editUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
                  <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rôle *</label>
                    <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  {editUser && (
                    <div className="form-group">
                      <label className="form-label">Statut</label>
                      <select className="form-control" value={form.actif} onChange={e => setForm({ ...form, actif: e.target.value === 'true' })}>
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">{editUser ? 'Sauvegarder' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
