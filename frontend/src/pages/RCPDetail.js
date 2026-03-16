import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function RCPDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rcp, setRcp] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Show modal for adding a new case
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableCases, setAvailableCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  
  // Show modal for deciding a case
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [currentDossier, setCurrentDossier] = useState(null);
  const [decisionText, setDecisionText] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRCP();
  }, [id]);

  const fetchRCP = async () => {
    try {
      const res = await api.get(`/rcp/${id}`);
      setRcp(res.data);
    } catch (err) {
      toast.error('Erreur de chargement RCP');
      navigate('/rcp');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCases = async () => {
    try {
      // Just fetch recent cases for simplicity or allow search
      const res = await api.get('/cases?limit=50');
      // Filter out those already in the RCP
      const existingIds = rcp.dossiers.map(d => d.case_id);
      setAvailableCases(res.data.filter(c => !existingIds.includes(c.id)));
    } catch (err) {
      toast.error('Erreur chargement des cas');
    }
  };

  const handleOpenAddModal = () => {
    loadAvailableCases();
    setShowAddModal(true);
  };

  const handleAddCase = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await api.post(`/rcp/${id}/cases`, { case_id: selectedCase });
      toast.success('Dossier ajouté');
      setShowAddModal(false);
      setSelectedCase('');
      fetchRCP();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const openDecisionModal = (dossier) => {
    setCurrentDossier(dossier);
    setDecisionText(dossier.decision_retenue || '');
    setShowDecisionModal(true);
  };

  const handleUpdateDecision = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/rcp/${id}/cases/${currentDossier.id}`, { decision_retenue: decisionText });
      toast.success('Décision enregistrée');
      setShowDecisionModal(false);
      fetchRCP();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (newStatus) => {
    try {
      await api.put(`/rcp/${id}`, {
        titre: rcp.titre,
        date_reunion: rcp.date_reunion,
        statut: newStatus,
        notes_globales: rcp.notes_globales
      });
      toast.success('Statut mis à jour');
      fetchRCP();
    } catch (err) {
      toast.error('Erreur de mise à jour');
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

  if (loading) return <Layout title="Chargement..."><div className="loading-center"><div className="spinner"></div></div></Layout>;
  if (!rcp) return <Layout title="Erreur">RCP introuvable.</Layout>;

  return (
    <Layout title={`RCP : ${rcp.titre}`}>
      
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              Détails de la Réunion
              {getStatusBadge(rcp.statut)}
            </h2>
          </div>
          <div className="actions" style={{ display: 'flex', gap: 8 }}>
            {rcp.statut === 'Planifiée' && (
              <button className="btn btn-outline" onClick={() => toggleStatus('En cours')}>Démarrer</button>
            )}
            {rcp.statut === 'En cours' && (
              <button className="btn btn-success" onClick={() => toggleStatus('Terminée')}>Clôturer la RCP</button>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <label>Date de réunion</label>
              <span>{new Date(rcp.date_reunion).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Créateur</label>
              <span>{rcp.createur_nom} {rcp.createur_prenom}</span>
            </div>
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <label>Notes globales</label>
              <span style={{ fontWeight: 400, color: '#475569' }}>{rcp.notes_globales || 'Aucune note'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Dossiers Patient (Cas de Cancer)</h2>
          {rcp.statut !== 'Terminée' && (
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Ajouter un dossier
            </button>
          )}
        </div>
        <div className="card-body">
          {rcp.dossiers.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <p>Aucun dossier patient n'est encore associé à cette RCP.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Type Cancer</th>
                    <th>Stade</th>
                    <th>Présentateur</th>
                    <th>Décision Retenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rcp.dossiers.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.patient_nom} {d.patient_prenom}</td>
                      <td>{d.type_cancer}</td>
                      <td>{d.stade || '-'}</td>
                      <td>{d.medecin_nom} {d.medecin_prenom}</td>
                      <td>
                        {d.decision_retenue ? (
                          <span style={{ color: '#166534', fontWeight: 500 }}>{d.decision_retenue}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>En attente</span>
                        )}
                      </td>
                      <td>
                        {rcp.statut !== 'Terminée' && (
                          <button className="btn btn-outline btn-sm" onClick={() => openDecisionModal(d)}>
                            Saisir décision
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Ajouter un dossier à la RCP</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <form id="add-case-form" onSubmit={handleAddCase}>
                <div className="form-group">
                  <label className="form-label">Sélectionner un cas de cancer</label>
                  <select
                    className="form-control"
                    value={selectedCase}
                    onChange={e => setSelectedCase(e.target.value)}
                    required
                  >
                    <option value="">Sélectionnez un cas...</option>
                    {availableCases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.patient_nom} {c.patient_prenom} - {c.type_cancer} ({c.stade || 'Stade inconnu'})
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Annuler</button>
              <button type="submit" form="add-case-form" className="btn btn-primary" disabled={submitting || !selectedCase}>
                {submitting ? 'Ajout...' : 'Ajouter à la RCP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDecisionModal && currentDossier && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Décision RCP - {currentDossier.patient_nom} {currentDossier.patient_prenom}</h3>
              <button className="btn-icon" onClick={() => setShowDecisionModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <form id="decision-form" onSubmit={handleUpdateDecision}>
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  Type: <strong>{currentDossier.type_cancer}</strong> | Stade: <strong>{currentDossier.stade || '-'}</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">Décision retenue (Protocole, Avis, etc.)</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={decisionText}
                    onChange={e => setDecisionText(e.target.value)}
                    placeholder="Saisissez la décision pluridisciplinaire..."
                    required
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowDecisionModal(false)}>Annuler</button>
              <button type="submit" form="decision-form" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
