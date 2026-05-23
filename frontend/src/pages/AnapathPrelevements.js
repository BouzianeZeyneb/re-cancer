import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

const TYPE_PRELEVEMENT_OPTIONS = [
  'Biopsie',
  'Pièce opératoire',
  'Biopsie à l\'aiguille',
  'Cytoponction',
  'Biopsie chirurgicale',
  'Biopsie endoscopique',
  'Autre',
];

const TYPE_COLORS = {
  'Biopsie': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Pièce opératoire': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Biopsie à l\'aiguille': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Cytoponction': { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  'Biopsie chirurgicale': { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  'Biopsie endoscopique': { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
};

function getTypeStyle(type) {
  return TYPE_COLORS[type] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getDaysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 30) return `Il y a ${diff} j`;
  if (diff < 365) return `Il y a ${Math.floor(diff / 30)} mois`;
  return `Il y a ${Math.floor(diff / 365)} an(s)`;
}

export default function AnapathPrelevements() {
  const navigate = useNavigate();
  const [prelevements, setPrelevements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState('date_prelevement');
  const [sortDir, setSortDir] = useState('desc');

  const fetchPrelevements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (typeFilter) params.append('type_prelevement', typeFilter);
      const res = await api.get(`/anapath/prelevements?${params.toString()}`);
      setPrelevements(res.data);
    } catch (e) {
      setError('Erreur lors du chargement des prélèvements.');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchPrelevements, 300);
    return () => clearTimeout(timer);
  }, [fetchPrelevements]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sorted = [...prelevements].sort((a, b) => {
    let va = a[sortField] || '';
    let vb = b[sortField] || '';
    if (sortField === 'date_prelevement') {
      va = va ? new Date(va) : new Date(0);
      vb = vb ? new Date(vb) : new Date(0);
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    va = String(va).toLowerCase();
    vb = String(vb).toLowerCase();
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginLeft: 4 }}>
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    );
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" style={{ marginLeft: 4 }}>
        {sortDir === 'asc'
          ? <path d="M7 14l5-5 5 5" />
          : <path d="M7 10l5 5 5-5" />}
      </svg>
    );
  };

  return (
    <Layout title="Prélèvements Anapath">
      <div style={{ padding: '0 0 40px' }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f4c81 100%)',
          borderRadius: 16, padding: '32px 36px', marginBottom: 28,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(15,76,129,0.25)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
                  <polyline points="8 3 8 8 3 8" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <div>
                <h1 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                  Prélèvements à analyser
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0, marginTop: 2 }}>
                  Liste des patients avec biopsies / pièces opératoires
                </p>
              </div>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.12)', borderRadius: 12,
            padding: '12px 20px', textAlign: 'center', backdropFilter: 'blur(10px)'
          }}>
            <div style={{ color: 'white', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
              {prelevements.length}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
              PRÉLÈVEMENT{prelevements.length !== 1 ? 'S' : ''}
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
          padding: '20px 24px', marginBottom: 24,
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              id="search-prelevements"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom ou matricule..."
              style={{
                width: '100%', paddingLeft: 40, paddingRight: 16, height: 42,
                border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13.5,
                fontFamily: 'Sora, sans-serif', background: '#f8fafc',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Type filter */}
          <div style={{ position: 'relative' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <select
              id="filter-type-prelevement"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                height: 42, paddingLeft: 34, paddingRight: 36,
                border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13,
                fontFamily: 'Sora, sans-serif', background: '#f8fafc',
                outline: 'none', cursor: 'pointer', color: '#334155',
                appearance: 'none', minWidth: 200
              }}
            >
              <option value="">Tous les types</option>
              {TYPE_PRELEVEMENT_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {(search || typeFilter) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter(''); }}
              style={{
                height: 42, padding: '0 16px', borderRadius: 10, border: '1.5px solid #fecaca',
                background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 13,
                fontWeight: 600, fontFamily: 'Sora, sans-serif', display: 'flex',
                alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Réinitialiser
            </button>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
            <div className="spinner" />
            <span style={{ color: '#64748b', fontWeight: 600 }}>Chargement des prélèvements...</span>
          </div>
        ) : error ? (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
            padding: 24, textAlign: 'center', color: '#dc2626'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: 8 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Erreur de chargement</div>
            <div style={{ fontSize: 13 }}>{error}</div>
            <button onClick={fetchPrelevements} style={{
              marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 600
            }}>Réessayer</button>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: 60, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
                <polyline points="8 3 8 8 3 8" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', marginBottom: 6 }}>
              Aucun prélèvement trouvé
            </div>
            <div style={{ color: '#64748b', fontSize: 13.5 }}>
              {search || typeFilter
                ? 'Aucun résultat pour ces critères de recherche.'
                : 'Aucun prélèvement enregistré dans le système.'}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {[
                    { label: 'Matricule', field: 'matricule', width: '110px' },
                    { label: 'Patient', field: 'nom', width: 'auto' },
                    { label: 'Date prélèvement', field: 'date_prelevement', width: '150px' },
                    { label: 'Type', field: 'type_prelevement', width: '170px' },
                    { label: 'Localisation', field: 'localisation', width: 'auto' },
                    { label: 'Statut CR', field: 'cr_statut', width: '110px' },
                    { label: 'Action', field: null, width: '140px' },
                  ].map(col => (
                    <th
                      key={col.label}
                      onClick={col.field ? () => handleSort(col.field) : undefined}
                      style={{
                        padding: '14px 16px', textAlign: 'left', fontSize: 11,
                        fontWeight: 700, letterSpacing: 0.6,
                        color: col.field && sortField === col.field ? '#3b82f6' : '#64748b',
                        textTransform: 'uppercase', width: col.width,
                        cursor: col.field ? 'pointer' : 'default',
                        userSelect: 'none', whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {col.label}
                        {col.field && <SortIcon field={col.field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => {
                  const typeStyle = getTypeStyle(row.type_prelevement);
                  const crStatus = row.cr_statut;
                  return (
                    <tr
                      key={row.anapath_id}
                      style={{
                        borderBottom: idx < sorted.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Matricule */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                          color: '#0f4c81', background: '#eff6ff', padding: '4px 8px',
                          borderRadius: 6, border: '1px solid #bfdbfe'
                        }}>
                          {row.matricule || '—'}
                        </span>
                      </td>

                      {/* Patient */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13.5 }}>
                          {row.nom} {row.prenom}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                          {row.sous_type || row.type_cancer || 'Type non précisé'}
                        </div>
                      </td>

                      {/* Date prélèvement */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>
                          {formatDate(row.date_prelevement)}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          {getDaysSince(row.date_prelevement)}
                        </div>
                      </td>

                      {/* Type de prélèvement */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: 20,
                          fontSize: 11.5, fontWeight: 700,
                          background: typeStyle.bg, color: typeStyle.color,
                          border: `1px solid ${typeStyle.border}`
                        }}>
                          {row.type_prelevement || '—'}
                        </span>
                      </td>

                      {/* Localisation anatomique */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {row.localisation && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                          )}
                          <span style={{ color: '#334155', fontSize: 13, fontWeight: 500 }}>
                            {row.localisation || <span style={{ color: '#94a3b8' }}>Non précisée</span>}
                          </span>
                        </div>
                        {row.type_histologique && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {row.type_histologique}
                          </div>
                        )}
                      </td>

                      {/* Statut CR */}
                      <td style={{ padding: '14px 16px' }}>
                        {crStatus === 'validé' ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0'
                          }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Validé
                          </span>
                        ) : crStatus === 'brouillon' ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a'
                          }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Brouillon
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0'
                          }}>
                            — Aucun
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          id={`btn-rapport-${row.anapath_id}`}
                          onClick={() => navigate(`/anapath/compte-rendu/${row.anapath_id}`)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 8, border: 'none',
                            background: crStatus === 'validé'
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : crStatus === 'brouillon'
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white', cursor: 'pointer', fontSize: 12,
                            fontWeight: 700, fontFamily: 'Sora, sans-serif',
                            boxShadow: crStatus === 'validé'
                              ? '0 3px 10px rgba(16,185,129,0.3)'
                              : crStatus === 'brouillon'
                                ? '0 3px 10px rgba(245,158,11,0.3)'
                                : '0 3px 10px rgba(59,130,246,0.3)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                          title={crStatus === 'validé' ? 'Voir le rapport validé' : crStatus === 'brouillon' ? 'Continuer le brouillon' : 'Créer le rapport anatomopathologique'}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            {crStatus === 'validé'
                              ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="16 13 12 17 8 13" /></>
                              : crStatus === 'brouillon'
                                ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>
                                : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></>
                            }
                          </svg>
                          {crStatus === 'validé' ? 'Voir rapport' : crStatus === 'brouillon' ? 'Continuer' : 'Créer rapport'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div style={{
              padding: '12px 18px', borderTop: '1px solid #f1f5f9',
              background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
                {sorted.length} prélèvement{sorted.length !== 1 ? 's' : ''} affiché{sorted.length !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  ✓ {sorted.filter(r => r.cr_statut === 'validé').length} validé{sorted.filter(r => r.cr_statut === 'validé').length !== 1 ? 's' : ''}
                </span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                  ✎ {sorted.filter(r => r.cr_statut === 'brouillon').length} brouillon{sorted.filter(r => r.cr_statut === 'brouillon').length !== 1 ? 's' : ''}
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>
                  ⏳ {sorted.filter(r => !r.cr_statut).length} en attente
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
