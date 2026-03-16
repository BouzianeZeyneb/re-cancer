import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { format } from 'date-fns';

export default function RendezVous() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rendez-vous')
      .then(r => setRdvs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusClass = {
    'Effectué': 'badge badge-green',
    'Annulé': 'badge badge-red',
    'Planifié': 'badge badge-blue'
  };

  return (
    <Layout title="Rendez-vous">
      <div className="card">
        <div className="card-header">
          <h2>Tous les Rendez-vous ({rdvs.length})</h2>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : rdvs.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h3>Aucun rendez-vous trouvé</h3>
            <p>Planifiez des rendez-vous depuis les dossiers patients</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Médecin</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rdvs.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>
                      {r.date_rdv ? format(new Date(r.date_rdv), 'dd/MM/yyyy HH:mm') : '-'}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {r.patient_prenom} {r.patient_nom}
                    </td>
                    <td>
                      {r.medecin_nom ? `Dr. ${r.medecin_prenom} ${r.medecin_nom}` : '-'}
                    </td>
                    <td>{r.motif || '-'}</td>
                    <td>
                      <span className={statusClass[r.statut] || 'badge badge-gray'}>
                        {r.statut}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: '#64748b' }}>{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
