import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPatients, deletePatient } from '../utils/api';
import toast from 'react-hot-toast';
import { format, differenceInYears, parseISO } from 'date-fns';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (sexeFilter) params.sexe = sexeFilter;
    getPatients(params)
      .then(r => setPatients(r.data.patients || r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, sexeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, nom, prenom) => {
    if (!window.confirm(`Supprimer le patient ${prenom} ${nom} ?`)) return;
    try {
      await deletePatient(id);
      toast.success('Patient supprimé');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const getAge = (dob) => {
    try { return differenceInYears(new Date(), parseISO(dob)); } catch { return '-'; }
  };

  const statusBadge = (statut) => {
    const map = {
      'En traitement': 'badge badge-blue',
      'Guéri': 'badge badge-green',
      'Décédé': 'badge badge-red',
    };
    return statut ? <span className={map[statut] || 'badge badge-gray'}>{statut}</span> : <span className="badge badge-gray">-</span>;
  };

  return (
    <Layout title="Gestion des Patients">
      <div className="filter-bar">
        <Link to="/patients/nouveau" className="btn btn-primary" style={{ flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nouveau Patient
        </Link>
        <div className="search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Rechercher par nom, carte, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={sexeFilter} onChange={e => setSexeFilter(e.target.value)}>
          <option value="">Tous les sexes</option>
          <option value="M">Masculin</option>
          <option value="F">Féminin</option>
        </select>
        <div style={{ flex: 1 }} />
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Patients ({patients.length})</h2>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <h3>Aucun patient trouvé</h3>
            <p>Commencez par ajouter un nouveau patient</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Sexe</th>
                  <th>Âge</th>
                  <th>Carte Nationale</th>
                  <th>Wilaya</th>
                  <th>Cancers</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#475569', fontWeight: 700 }}>#{String(p.id).padStart(4, '0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: p.sexe === 'M' ? '#dbeafe' : '#fce7f3',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          color: p.sexe === 'M' ? '#1e40af' : '#9d174d',
                          flexShrink: 0
                        }}>
                          {p.prenom[0]}{p.nom[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.prenom} {p.nom}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{p.telephone || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.sexe === 'M' ? '♂ Masculin' : '♀ Féminin'}</td>
                    <td>{getAge(p.date_naissance)} ans</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12.5 }}>{p.num_carte_nationale || '-'}</td>
                    <td>{p.wilaya || '-'}</td>
                    <td>
                      <span className="badge badge-purple">{p.nb_cancers || 0}</span>
                    </td>
                    <td>{statusBadge(p.derniere_statut)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => navigate(`/patients/${p.id}`)} title="Voir">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="btn-icon" onClick={() => navigate(`/patients/${p.id}/modifier`)} title="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(p.id, p.nom, p.prenom)} title="Supprimer" style={{ color: '#e63946' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
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
