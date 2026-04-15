import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/audit')
      .then(res => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getActionLabel = (action) => {
    const map = {
      'LOGIN': 'Connexion',
      'CREATE_PATIENT': 'Création Patient',
      'UPDATE_PATIENT': 'Modification Patient',
      'DELETE_PATIENT': 'Suppression Patient',
      'CREATE_CASE': 'Nouveau Diagnostic',
      'UPDATE_CASE': 'Modif. Diagnostic',
      'ADD_TRAITEMENT': 'Ajout Traitement',
      'CREATE_USER': 'Nouveau Utilisateur',
      'DELETE_USER': 'Utilisateur Désactivé',
      'UPDATE_USER': 'Modif. Utilisateur',
      'MERGE_PATIENTS': 'Fusion de Patients',
    };
    return map[action] || action;
  };

  const getLogBadge = (action) => {
    if (action.includes('DELETE')) return 'badge-red';
    if (action.includes('CREATE') || action.includes('ADD')) return 'badge-green';
    if (action.includes('UPDATE')) return 'badge-blue';
    return 'badge-gray';
  };

  return (
    <Layout title="Traçabilité des Actions">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Traçabilité & Audit</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Historique complet des actions effectuées sur la plateforme par tous les utilisateurs.</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Action</th>
                  <th>Cible</th>
                  <th>Détails</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>
                      {format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{log.user_prenom} {log.user_nom}</div>
                    </td>
                    <td><span className="badge badge-gray">{log.user_role}</span></td>
                    <td>
                      <span className={`badge ${getLogBadge(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                      {log.record_id ? log.record_id.split('-')[0] : '-'}
                    </td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#64748b' }}>
                      {log.details || '-'}
                    </td>
                    <td style={{ fontSize: 11 }}>{log.ip_address || '-'}</td>
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
