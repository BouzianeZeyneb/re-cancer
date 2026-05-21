import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Laboratoire() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/lab-requests/labo');
      setRequests(res.data);
    } catch (e) {
      toast.error('Erreur de chargement');
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
      toast.success('Résultats transmis !');
      fetchRequests();
    } catch (e) {
      toast.error('Erreur d\'envoi');
    } finally {
      setUploadingId(null);
    }
  };

  const filteredRequests = requests.filter(r => activeTab === 'pending' ? r.statut === 'En attente' : r.statut === 'Terminée');

  const cardStyle = { background: 'white', borderRadius: 28, border: '1.5px solid #f1f5f9', padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' };

  return (
    <Layout title="Espace Laboratoire">
      <div style={{ animation: 'fade-in 0.4s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: 0 }}>Workflow Laboratoire</h1>
                <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500, marginTop: 4 }}>Gestion des demandes & Transmission des résultats</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '6px', borderRadius: 16, border: '1.5px solid #f1f5f9', display: 'flex', gap: 4 }}>
                <button onClick={() => setActiveTab('pending')} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: activeTab === 'pending' ? 'white' : 'transparent', color: activeTab === 'pending' ? '#0f172a' : '#64748b', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
                    À TRAITER ({requests.filter(r => r.statut === 'En attente').length})
                </button>
                <button onClick={() => setActiveTab('history')} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: activeTab === 'history' ? 'white' : 'transparent', color: activeTab === 'history' ? '#0f172a' : '#64748b', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: activeTab === 'history' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
                    HISTORIQUE ({requests.filter(r => r.statut === 'Terminée').length})
                </button>
            </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><div className="spinner" /></div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 100, border: '2px dashed #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>{activeTab === 'pending' ? '✨' : '📂'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{activeTab === 'pending' ? 'Aucune demande en attente' : 'Historique vide'}</h2>
            <p style={{ color: '#64748b', fontWeight: 500 }}>{activeTab === 'pending' ? 'Toutes les analyses ont été transmises.' : 'Vos transmissions apparaîtront ici.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 32 }}>
            {filteredRequests.map(req => {
              const analyses = JSON.parse(req.analyses_demandees || '[]');
              return (
                <div key={req.id} style={cardStyle}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 6, height: '100%', background: req.statut === 'En attente' ? '#3b82f6' : '#10b981' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f8fafc', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                            {req.patient_nom?.[0]}{req.patient_prenom?.[0]}
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{req.patient_nom} {req.patient_prenom}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Reçu le {format(parseISO(req.created_at), 'dd MMM yyyy', { locale: fr })}</div>
                        </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 900, background: req.statut === 'En attente' ? '#eff6ff' : '#f0fdf4', color: req.statut === 'En attente' ? '#3b82f6' : '#10b981', padding: '6px 12px', borderRadius: 8 }}>{req.statut.toUpperCase()}</span>
                  </div>

                  <div style={{ background: '#f8fafc', borderRadius: 20, padding: 24, marginBottom: 24, border: '1.5px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20"/><path d="m4.93 4.93 14.14 14.14M4.93 19.07 19.07 4.93"/></svg>
                        Analyses Requises
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {analyses.map((a, i) => (
                            <span key={i} style={{ background: 'white', padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0f172a', border: '1.5px solid #e2e8f0' }}>{a}</span>
                        ))}
                    </div>
                  </div>

                  {req.notes_labo && (
                    <div style={{ marginBottom: 24, padding: '0 8px' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>NOTE CLINIQUE :</div>
                        <div style={{ fontSize: 14, color: '#475569', fontStyle: 'italic', lineHeight: 1.5 }}>"{req.notes_labo}"</div>
                    </div>
                  )}

                  <div style={{ borderTop: '1.5px solid #f1f5f9', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Par: <strong style={{ color: '#0f172a' }}>Dr. {req.medecin_nom}</strong></div>
                    
                    {req.statut === 'En attente' ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: '#0f172a', color: 'white', borderRadius: 12, cursor: uploadingId === req.id ? 'default' : 'pointer', fontSize: 13, fontWeight: 800 }}>
                             {uploadingId === req.id ? <><div className="spinner" style={{ width: 14, height: 14, borderBottomColor: 'white' }} /> ENVOI...</> : 'TRANSMETTRE RÉSULTATS (PDF)'}
                             <input type="file" accept=".pdf" hidden disabled={uploadingId === req.id} onChange={(e) => handleFileUpload(req.id, e.target.files[0])} />
                        </label>
                    ) : (
                        <a href={`http://localhost:5000${req.fichier_pdf}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#0f172a', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            VOIR ARCHIVE
                        </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
