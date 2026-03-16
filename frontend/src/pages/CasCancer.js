import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCases } from '../utils/api';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function CasCancer() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type_cancer: '', etat: '', statut: '' });
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filters.type_cancer) params.type_cancer = filters.type_cancer;
    if (filters.etat) params.etat = filters.etat;
    if (filters.statut) params.statut = filters.statut;
    getCases(params).then(r => setCases(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const statusClass = (s) => ({ 'En traitement': 'badge badge-blue', 'Guéri': 'badge badge-green', 'Décédé': 'badge badge-red' }[s] || 'badge badge-gray');
  const etatClass = (e) => ({ 'Localisé': 'badge badge-purple', 'Métastase': 'badge badge-orange' }[e] || 'badge badge-gray');

  return (
    <Layout title="Cas de Cancer">
      <div className="filter-bar">
        <select className="filter-select" value={filters.type_cancer} onChange={e => setFilters({ ...filters, type_cancer: e.target.value })}>
          <option value="">Tous les types</option>
          <option>Solide</option>
          <option>Liquide</option>
        </select>
        <select className="filter-select" value={filters.etat} onChange={e => setFilters({ ...filters, etat: e.target.value })}>
          <option value="">Tous les états</option>
          <option>Localisé</option>
          <option>Métastase</option>
        </select>
        <select className="filter-select" value={filters.statut} onChange={e => setFilters({ ...filters, statut: e.target.value })}>
          <option value="">Tous les statuts</option>
          <option>En traitement</option>
          <option>Guéri</option>
          <option>Décédé</option>
        </select>
        <div style={{ flex: 1 }} />
        {user?.role !== 'laboratoire' && (
          <button className="btn btn-primary" onClick={() => navigate('/cas-cancer/nouveau')}>+ Nouveau Cas</button>
        )}
      </div>

      <div className="card">
        <div className="card-header"><h2>Cas de Cancer ({cases.length})</h2></div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <h3>Aucun cas trouvé</h3>
            <p>Modifiez les filtres ou ajoutez un nouveau cas</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Âge/Sexe</th>
                  <th>Type</th>
                  <th>Sous-type</th>
                  <th>État</th>
                  <th>Stade</th>
                  <th>Statut</th>
                  <th>Diagnostic</th>
                  <th>Wilaya</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.patient_prenom} {c.patient_nom}</div>
                      {c.medecin_nom && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Dr. {c.medecin_nom}</div>}
                    </td>
                    <td>{c.age} ans · {c.sexe === 'M' ? '♂' : '♀'}</td>
                    <td><span className="badge badge-blue">{c.type_cancer}</span></td>
                    <td style={{ fontSize: 12.5 }}>{c.sous_type || '-'}</td>
                    <td><span className={etatClass(c.etat)}>{c.etat}</span></td>
                    <td>{c.stade || '-'}</td>
                    <td><span className={statusClass(c.statut_patient)}>{c.statut_patient}</span></td>
                    <td style={{ fontSize: 12.5 }}>{c.date_diagnostic ? format(parseISO(c.date_diagnostic), 'dd/MM/yyyy') : '-'}</td>
                    <td>{c.wilaya || '-'}</td>
                    <td>
                      <button className="btn-icon" onClick={() => navigate(`/cas-cancer/${c.id}`)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </td>
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
