import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function RCPList() {
  const [rcps, setRcps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: '', date_reunion: '', statut: 'Planifiée', notes_globales: '' });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRCPs();
  }, []);

  const fetchRCPs = async () => {
    try {
      const res = await api.get('/rcp');
      setRcps(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des RCP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/rcp', form);
      toast.success('RCP créée avec succès');
      setShowModal(false);
      setForm({ titre: '', date_reunion: '', statut: 'Planifiée', notes_globales: '' });
      fetchRCPs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Planifiée': return <span className="badge badge-blue">Planifiée</span>;
      case 'En cours': return <span className="badge badge-orange">En cours</span>;
      case 'Terminée': return <span className="badge badge-green">Terminée</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <Layout title="Réunions de Concertation Pluridisciplinaire (RCP)">
      <div className="card">
        <div className="card-header">
          <h2>Liste des RCP</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nouvelle RCP
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-center"><div className="spinner"></div></div>
          ) : rcps.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <h3>Aucune RCP programmée</h3>
              <p>Commencez par créer une nouvelle Réunion de Concertation Pluridisciplinaire.</p>
              <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Créer une RCP</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Dossiers</th>
                    <th>Créé par</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rcps.map(rcp => (
                    <tr key={rcp.id}>
                      <td style={{ fontWeight: 600 }}>{rcp.titre}</td>
                      <td>{new Date(rcp.date_reunion).toLocaleDateString()}</td>
                      <td>{getStatusBadge(rcp.statut)}</td>
                      <td>{rcp.nb_dossiers} cas</td>
                      <td>{rcp.createur_nom} {rcp.createur_prenom}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/rcp/${rcp.id}`)}>
                          Consulter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Créer une nouvelle RCP</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <form id="rcp-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Titre de la RCP</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.titre}
                    onChange={e => setForm({ ...form, titre: e.target.value })}
                    placeholder="Ex: RCP Gynécologie Semaine 4"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date prévue</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date_reunion}
                      onChange={e => setForm({ ...form, date_reunion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Statut initial</label>
                    <select
                      className="form-control"
                      value={form.statut}
                      onChange={e => setForm({ ...form, statut: e.target.value })}
                    >
                      <option value="Planifiée">Planifiée</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminée">Terminée</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes globales (Optionnel)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={form.notes_globales}
                    onChange={e => setForm({ ...form, notes_globales: e.target.value })}
                    placeholder="Objectifs de la réunion, participants invités..."
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
              <button type="submit" form="rcp-form" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Création...' : 'Créer la RCP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
