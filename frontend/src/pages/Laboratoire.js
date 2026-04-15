import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Laboratoire() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/lab-requests/labo');
      setRequests(res.data);
    } catch (e) {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (requestId, file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('pdf', file);
    
    setUploadingId(requestId);
    try {
      await api.put(`/lab-requests/${requestId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Résultats envoyés au médecin !');
      fetchRequests();
    } catch (e) {
      toast.error('Erreur lors de l\'envoi du fichier');
    } finally {
      setUploadingId(null);
    }
  };

  const filteredRequests = requests.filter(r => activeTab === 'pending' ? r.statut === 'En attente' : r.statut === 'Terminée');

  return (
    <Layout title="Espace Laboratoire">
      <div className="container-xl">
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>📋 Gestion des Analyses</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Consultez les demandes en attente et transmettez les résultats aux médecins traitants.</p>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
              <button 
                onClick={() => setActiveTab('pending')}
                style={{ 
                  padding: '12px 20px', 
                  fontSize: 14, 
                  fontWeight: 700, 
                  color: activeTab === 'pending' ? '#3b82f6' : '#64748b', 
                  border: 'none', 
                  background: 'none', 
                  borderBottom: activeTab === 'pending' ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📥 À traiter ({requests.filter(r => r.statut === 'En attente').length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                style={{ 
                  padding: '12px 20px', 
                  fontSize: 14, 
                  fontWeight: 700, 
                  color: activeTab === 'history' ? '#3b82f6' : '#64748b', 
                  border: 'none', 
                  background: 'none', 
                  borderBottom: activeTab === 'history' ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📜 Historique & Résultats ({requests.filter(r => r.statut === 'Terminée').length})
              </button>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="card" style={{ padding: 60, textAlign: 'center', background: '#f8fafc', border: '2px dashed #cbd5e1' }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>{activeTab === 'pending' ? '🎉' : '📂'}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
                  {activeTab === 'pending' ? 'Aucune demande en attente' : 'Aucun historique disponible'}
                </h2>
                <p style={{ color: '#64748b' }}>
                  {activeTab === 'pending' ? 'Toutes les analyses ont été traitées.' : 'Vous n\'avez pas encore envoyé de résultats.'}
                </p>
              </div>
            ) : (
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                {filteredRequests.map(req => {
                  let analyses = [];
                  try {
                    analyses = typeof req.analyses_demandees === 'string' ? JSON.parse(req.analyses_demandees) : req.analyses_demandees;
                  } catch (e) {
                    analyses = [req.analyses_demandees];
                  }

                  return (
                    <div key={req.id} className="card request-card" style={{ 
                      transition: 'all 0.3s ease', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: 4, 
                        height: '100%', 
                        background: '#3b82f6' 
                      }} />
                      
                      <div className="card-body" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div>
                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Patient
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                              {req.patient_nom} {req.patient_prenom}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                              Reçu le {format(new Date(req.created_at), 'dd MMM yyyy', { locale: fr })}
                            </div>
                            <span className={`badge ${req.statut === 'En attente' ? 'badge-orange' : 'badge-green'}`} style={{ marginTop: 4 }}>
                              {req.statut === 'En attente' ? '⏳ ' : '✅ '}{req.statut}
                            </span>
                          </div>
                        </div>

                        <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                          <div style={{ fontSize: 12, color: '#475569', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            🧪 ANALYSES DEMANDÉES
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {analyses.map((a, idx) => (
                              <span key={idx} style={{ 
                                background: 'white', 
                                padding: '4px 10px', 
                                borderRadius: 6, 
                                fontSize: 13, 
                                fontWeight: 600, 
                                color: '#0f4c81',
                                border: '1px solid #cbd5e1'
                              }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        {req.notes_labo && (
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 4 }}>Note du médecin :</div>
                            <div style={{ fontSize: 14, color: '#334155', fontStyle: 'italic', background: '#fff9db', padding: '8px 12px', borderRadius: 8 }}>
                              "{req.notes_labo}"
                            </div>
                          </div>
                        )}

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 600 }}>
                            Demandé par : <span style={{ color: '#0f172a' }}>Dr. {req.medecin_nom} {req.medecin_prenom}</span>
                          </div>
                          
                          <div className="upload-section">
                            {req.statut === 'En attente' ? (
                              <label className="btn btn-primary" style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: 10,
                                cursor: uploadingId === req.id ? 'not-allowed' : 'pointer',
                                opacity: uploadingId === req.id ? 0.7 : 1
                              }}>
                                {uploadingId === req.id ? (
                                  <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Envoi en cours...</>
                                ) : (
                                  <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Uploader les résultats (PDF) & Envoyer
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  accept=".pdf" 
                                  hidden 
                                  disabled={uploadingId === req.id}
                                  onChange={(e) => handleFileUpload(req.id, e.target.files[0])} 
                                />
                              </label>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                   Résultats déjà transmis
                                </div>
                                <a 
                                  href={`http://localhost:5000${req.fichier_pdf}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="btn btn-outline"
                                  style={{ 
                                    width: '100%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: 10,
                                    background: '#f0fdf4',
                                    borderColor: '#bbf7d0',
                                    color: '#166534'
                                  }}
                                >
                                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                   Voir le fichier envoyé
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .request-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .request-card {
          animation: fadeIn 0.4s ease forwards;
        }
      `}</style>
    </Layout>
  );
}
