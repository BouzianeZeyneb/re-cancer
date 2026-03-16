import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAuditLogs } from '../utils/api';

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  const actionColor = {
    'LOGIN': 'badge-green',
    'CREATE_PATIENT': 'badge-blue',
    'UPDATE_PATIENT': 'badge-orange',
    'DELETE_PATIENT': 'badge-red',
    'CREATE_CASE': 'badge-purple',
    'UPDATE_CASE': 'badge-orange',
    'MERGE_PATIENTS': 'badge-red',
    'CREATE_USER': 'badge-blue',
    'UPDATE_USER': 'badge-orange',
    'DELETE_USER': 'badge-red',
  };

  return (
    <Layout title="Journaux d'Audit">
      <div className="card">
        <div className="card-header">
          <h2>Journal d'Audit ({logs.length} entrées)</h2>
          <div className="alert alert-info" style={{ margin: 0, padding: '6px 12px', fontSize: 12 }}>
            🔒 Toutes les actions des utilisateurs sont journalisées
          </div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date/Heure</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Détails</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleString('fr-DZ')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.prenom} {l.nom}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.email}</div>
                    </td>
                    <td><span className={`badge ${actionColor[l.action] || 'badge-gray'}`}>{l.action}</span></td>
                    <td style={{ fontSize: 12.5, fontFamily: 'JetBrains Mono' }}>{l.table_name || '-'}</td>
                    <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.details ? JSON.stringify(JSON.parse(l.details)) : '-'}
                    </td>
                    <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>{l.ip_address || '-'}</td>
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
