import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function RCPDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rcp, setRcp] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  
  // Show modal for adding a new case
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableCases, setAvailableCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  
  // Show modal for deciding a case
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [currentDossier, setCurrentDossier] = useState(null);
  const [decisionText, setDecisionText] = useState('');

  // Show modal for Inviting participant
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [medecins, setMedecins] = useState([]);
  const [selectedMedecin, setSelectedMedecin] = useState('');

  // Show modal for RCP Final Decision
  const [showFinalDecisionModal, setShowFinalDecisionModal] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRCP();
  }, [id]);

  useEffect(() => {
    if (id && user) {
      fetchMessages();
      const socket = io('http://localhost:5000');
      socket.emit('join_rcp', id);
      socket.on('new_rcp_message', (msg) => {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => {
          if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 100);
      });
      return () => socket.disconnect();
    }
  }, [id, user]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/rcp/${id}/messages`);
      setMessages(res.data);
      setTimeout(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post(`/rcp/${id}/messages`, { content: newMessage });
      setNewMessage('');
    } catch (err) {
      toast.error('Message non envoyé');
    }
  };

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

  const extractMedecinsList = async () => {
    try {
      const res = await api.get('/users/role/medecins'); // Requires proper backend endpoint for medecins list
      // Filter out those already participants
      const existingIds = rcp.participants?.map(p => p.user_id) || [];
      setMedecins(res.data.filter(m => !existingIds.includes(m.id)));
    } catch (err) {
      toast.error('Erreur chargement des médecins');
    }
  };

  const handleOpenInviteModal = () => {
    extractMedecinsList();
    setShowInviteModal(true);
  };

  const handleInviteDoctor = async (e) => {
    e.preventDefault();
    if (!selectedMedecin) return;
    setSubmitting(true);
    try {
      await api.post(`/rcp/${id}/invite`, { medecinId: selectedMedecin });
      toast.success('Médecin invité avec succès');
      setShowInviteModal(false);
      setSelectedMedecin('');
      fetchRCP(); // refresh participants
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'invitation");
    } finally {
      setSubmitting(false);
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

  const handleFinalizeRCP = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/rcp/${id}/decision`, { decision_finale: decisionText, statut: 'Terminée' });
      toast.success('RCP Clôturée avec décision finale');
      setShowFinalDecisionModal(false);
      fetchRCP();
    } catch (err) {
      toast.error('Erreur lors de la clôture');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (newStatus) => {
    if (newStatus === 'Terminée') {
      setDecisionText(rcp.decision_finale || '');
      setShowFinalDecisionModal(true);
      return;
    }
    
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

  // Check if user is a participant or creator
  const isParticipant = rcp.participants?.some(p => p.user_id === user?.id);

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
            {rcp.statut === 'Planifiée' && user?.id === rcp.created_by && (
              <button className="btn btn-outline" onClick={() => toggleStatus('En cours')}>Démarrer</button>
            )}
            {rcp.statut === 'En cours' && user?.id === rcp.created_by && (
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
            
            {rcp.invite_code && isParticipant && (
              <div className="info-item" style={{ gridColumn: '1 / -1', background: '#eef2ff', padding: 12, borderRadius: 8, border: '1px dashed #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label style={{ color: '#4338ca' }}>Code d'invitation RCP</label>
                  <span style={{ fontWeight: 700, fontSize: '18px', color: '#3730a3', letterSpacing: '2px' }}>{rcp.invite_code}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#4f46e5' }}>Partagez ce code pour inviter un confrère</div>
              </div>
            )}

            {rcp.decision_finale && (
              <div className="info-item" style={{ gridColumn: '1 / -1', background: '#ecfdf5', padding: 16, borderRadius: 8, border: '1px solid #a7f3d0' }}>
                <label style={{ color: '#065f46' }}>Décision Finale</label>
                <span style={{ fontWeight: 500, color: '#064e3b', display: 'block', marginTop: 4 }}>{rcp.decision_finale}</span>
              </div>
            )}
            <div className="info-item" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label>Participants</label>
                {rcp.statut !== 'Terminée' && isParticipant && (
                  <button className="btn btn-outline btn-sm" onClick={handleOpenInviteModal}>
                     Inviter
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {rcp.participants?.map(p => (
                  <span key={p.id} className="badge badge-gray">{p.nom} {p.prenom}</span>
                ))}
              </div>
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

      {isParticipant && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="rcp-chat-panel">
            <div className="rcp-chat-header">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>
              Chat de la RCP
            </div>
            <div className="rcp-chat-messages" ref={chatRef}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucun message pour le moment.</div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`chat-msg ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="chat-msg-header">
                        <span style={{ fontWeight: 600 }}>{isMine ? 'Vous' : `Dr. ${msg.nom}`}</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="chat-msg-bubble">{msg.content}</div>
                    </div>
                  );
                })
              )}
            </div>
            <form className="rcp-chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Écrivez un message..." 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                disabled={rcp.statut === 'Terminée'}
              />
              <button type="submit" className="btn btn-primary" disabled={!newMessage.trim() || rcp.statut === 'Terminée'}>
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}

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

      {showFinalDecisionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Clôturer la RCP : Décision Finale</h3>
              <button className="btn-icon" onClick={() => setShowFinalDecisionModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <form id="final-decision-form" onSubmit={handleFinalizeRCP}>
                <div className="form-group">
                  <label className="form-label">Décision collégiale finale</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    value={decisionText}
                    onChange={e => setDecisionText(e.target.value)}
                    placeholder="Saisissez le compte rendu final ou la décision globale de cette RCP..."
                    required
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowFinalDecisionModal(false)}>Annuler</button>
              <button type="submit" form="final-decision-form" className="btn btn-success" disabled={submitting}>
                {submitting ? 'Clôture...' : 'Clôturer la réunion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Inviter un médecin</h3>
              <button className="btn-icon" onClick={() => setShowInviteModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <form id="invite-form" onSubmit={handleInviteDoctor}>
                <div className="form-group">
                  <label className="form-label">Sélectionner un collaborateur</label>
                  <select
                    className="form-control"
                    value={selectedMedecin}
                    onChange={e => setSelectedMedecin(e.target.value)}
                    required
                  >
                    <option value="">Sélectionnez un médecin...</option>
                    {medecins.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nom} {m.prenom}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowInviteModal(false)}>Annuler</button>
              <button type="submit" form="invite-form" className="btn btn-primary" disabled={submitting || !selectedMedecin}>
                {submitting ? 'Invitation...' : 'Inviter'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
