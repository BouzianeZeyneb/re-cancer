import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getLabRequestsForLabo, uploadLabPdf } from '../utils/api';
import toast from 'react-hot-toast';

export default function DemandesLabo() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await getLabRequestsForLabo();
      setRequests(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e, reqId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF.');
      return;
    }

    try {
      setUploadingId(reqId);
      const formData = new FormData();
      formData.append('pdf', file);
      
      await uploadLabPdf(reqId, formData);
      toast.success('Résultat PDF téléversé avec succès!');
      loadRequests(); // Refresh list to update status
    } catch (error) {
      toast.error('Erreur lors de l\'upload : ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <Layout title="Mes Demandes d'Analyses">
      <div style={{ background: 'white', borderRadius: 14, padding: '24px', border: '1px solid #e2e8f0', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f4c81' }}>🧪 Mes Demandes d'Analyses</h2>
          <span style={{ padding: '6px 14px', background: '#f8fafc', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0' }}>Total : {requests.length}</span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 40 }}>📭</div>
            <h3>Aucune demande</h3>
            <p style={{ color: '#64748b' }}>Vous n'avez reçu aucune demande d'analyse pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requests.map(r => (
              <div key={r.id} style={{ border: `1px solid ${r.statut === 'Terminée' ? '#dcfce7' : '#e2e8f0'}`, borderRadius: 12, padding: 20, background: r.statut === 'Terminée' ? '#f8fafc' : 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{r.patient_prenom} {r.patient_nom}</span>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: r.statut === 'Terminée' ? '#dcfce7' : '#fef08a', color: r.statut === 'Terminée' ? '#166534' : '#854d0e', fontWeight: 700 }}>{r.statut}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                      <span>👤 {r.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                      <span>🎂 Né(e) le {r.date_naissance?.slice(0, 10)}</span>
                      <span>🩺 Dr. {r.medecin_nom}</span>
                      <span>📅 Reçu le {r.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {r.statut === 'Terminée' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        <span style={{ color: '#166534', fontWeight: 700, fontSize: 13 }}>✓ Résultat envoyé</span>
                        {r.fichier_pdf && (
                          <a href={`${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api','') : 'http://localhost:5000'}${r.fichier_pdf}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>📄 Voir PDF Téléversé</a>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="application/pdf"
                          id={`upload-${r.id}`}
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileChange(e, r.id)}
                          disabled={uploadingId === r.id}
                        />
                        <label htmlFor={`upload-${r.id}`} className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {uploadingId === r.id ? '⏳ Envoi...' : '⬆️ Importer Résultat (PDF)'}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Analyses Demandées :</div>
                  <div style={{ fontSize: 14, color: '#0f172a', whiteSpace: 'pre-wrap' }}>{r.analyses_demandees}</div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
