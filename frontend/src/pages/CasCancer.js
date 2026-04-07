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
    <Layout title="Diagnostics">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Diagnostics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gestion des diagnostics oncologiques avec descripteurs dynamiques</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cas-cancer/nouveau')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau diagnostic
        </button>
      </div>

      <div className="filter-bar" style={{ background: 'white', padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-light)', marginBottom: 24 }}>
        <div className="search-bar" style={{ border: 'none', boxShadow: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Rechercher un patient..." value={filters.search || ''} onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="filter-select" style={{ border: 'none', backgroundPosition: 'right' }} value={filters.type_cancer} onChange={e => setFilters({ ...filters, type_cancer: e.target.value })}>
          <option value="">Tous les types</option>
          {['Cancer du Sein', 'Cancer du Poumon', 'Cancer de la Prostate', 'Cancer Colorectal'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : cases.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/><path d="M7 7h.01"/><path d="M7 11h.01"/><path d="M7 15h.01"/></svg>
          <h3>Aucun diagnostic trouvé</h3>
          <p>Essayez de modifier vos filtres ou créez votre premier dossier.</p>
        </div>
      ) : (
        <div className="diag-grid">
          {cases.filter(c => {
            if (!filters.search) return true;
            const q = filters.search.toLowerCase();
            return `${c.patient_nom} ${c.patient_prenom}`.toLowerCase().includes(q);
          }).map(c => (
            <div key={c.id} className="diag-card" onClick={() => navigate(`/cas-cancer/${c.id}`)} style={{ cursor: 'pointer' }}>
              <div className="diag-header">
                <div className="diag-patient-info">
                  <div className="diag-patient-name">{c.patient_prenom} {c.patient_nom}</div>
                  <div className="diag-badges">
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{c.type_cancer}</span>
                    {c.tnm_t && <span className="badge badge-gray" style={{ fontSize: 10 }}>{c.tnm_t}{c.tnm_n}{c.tnm_m}</span>}
                    <span className={statusClass(c.statut_patient)} style={{ fontSize: 10 }}>{c.statut_patient}</span>
                  </div>
                </div>
                <div className="diag-doctor">Dr. {c.medecin_nom || 'Non assigné'}</div>
              </div>
              
              <div className="diag-body">
                <div className="diag-meta-row">
                  <div className="diag-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {c.date_diagnostic ? format(parseISO(c.date_diagnostic), 'dd/MM/yyyy') : '-'}
                  </div>
                  <div className="diag-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {c.localisation || 'Localisation non précisée'}
                  </div>
                  {c.grade_histologique && (
                    <div className="diag-meta-item">
                      <b>Grade:</b> {c.grade_histologique}
                    </div>
                  )}
                </div>

                <div className="diag-attributes">
                  {c.lateralite && <span className="diag-attr-pill"><b>Latéralité:</b> {c.lateralite}</span>}
                  {c.taille_cancer && <span className="diag-attr-pill"><b>Taille:</b> {c.taille_cancer} cm</span>}
                  {c.recepteur_er && c.recepteur_er !== 'Inconnu' && <span className="diag-attr-pill"><b>ER:</b> {c.recepteur_er}</span>}
                  {c.recepteur_pr && c.recepteur_pr !== 'Inconnu' && <span className="diag-attr-pill"><b>PR:</b> {c.recepteur_pr}</span>}
                  {c.her2 && c.her2 !== 'Inconnu' && <span className="diag-attr-pill"><b>HER2:</b> {c.her2}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
