import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Badge({ statut }) {
  const validated = statut === 'validé';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: validated ? '#dcfce7' : '#fef9c3',
      color: validated ? '#15803d' : '#a16207',
      border: `1px solid ${validated ? '#bbf7d0' : '#fde68a'}`,
      textTransform: 'uppercase', letterSpacing: 0.4
    }}>
      {validated ? '✓' : '⏳'} {validated ? 'Validé' : 'Brouillon'}
    </span>
  );
}

export default function AnapathHistorique() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [expanded, setExpanded] = useState(null); // cr_id of expanded row

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statut) params.statut = statut;
      const res = await api.get('/anapath/historique', { params });
      setReports(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statut]);

  useEffect(() => {
    const t = setTimeout(fetchReports, 300);
    return () => clearTimeout(t);
  }, [fetchReports]);

  return (
    <Layout title="Historique des rapports ANAPATH">
      <div style={{ padding: '0 0 40px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f4c81 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          boxShadow: '0 8px 24px rgba(15,76,129,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Historique des Comptes Rendus
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5, margin: 0, marginTop: 2 }}>
                {reports.length} rapport{reports.length !== 1 ? 's' : ''} trouvé{reports.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            id="btn-histoback-prelevements"
            onClick={() => navigate('/anapath/prelevements')}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.15)', color: 'white',
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
              fontFamily: 'Sora, sans-serif',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            ← Prélèvements
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={{
          background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="histoSearch"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par patient, matricule, diagnostic..."
              style={{
                width: '100%', padding: '9px 14px 9px 36px',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: 13, fontFamily: 'Sora, sans-serif', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Status filter */}
          <select
            id="histoStatutFilter"
            value={statut}
            onChange={e => setStatut(e.target.value)}
            style={{
              padding: '9px 14px', border: '1.5px solid #e2e8f0',
              borderRadius: 10, fontSize: 13, fontFamily: 'Sora, sans-serif',
              outline: 'none', background: 'white', cursor: 'pointer', minWidth: 160
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="validé">Validés</option>
            <option value="brouillon">Brouillons</option>
          </select>

          {(search || statut) && (
            <button
              onClick={() => { setSearch(''); setStatut(''); }}
              style={{
                padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#64748b', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, fontFamily: 'Sora, sans-serif'
              }}
            >
              ✕ Effacer
            </button>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, gap: 12 }}>
            <div className="spinner" />
            <span style={{ color: '#64748b', fontWeight: 600 }}>Chargement...</span>
          </div>
        ) : reports.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
            padding: 60, textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>
              {search || statut ? 'Aucun rapport ne correspond à vos critères.' : 'Aucun compte rendu enregistré pour le moment.'}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 14, border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Patient', 'Matricule', 'Type de prélèvement', 'Diagnostic', 'Statut', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                      whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <React.Fragment key={r.cr_id}>
                    {/* ── Main row ── */}
                    <tr
                      style={{
                        borderTop: i > 0 ? '1px solid #f1f5f9' : 'none',
                        background: expanded === r.cr_id ? '#f8fafc' : 'white',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => { if (expanded !== r.cr_id) e.currentTarget.style.background = '#fafbfc'; }}
                      onMouseLeave={e => { if (expanded !== r.cr_id) e.currentTarget.style.background = 'white'; }}
                      onClick={() => setExpanded(expanded === r.cr_id ? null : r.cr_id)}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                        {r.nom} {r.prenom}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#64748b', fontFamily: 'monospace' }}>
                        {r.matricule || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        <span style={{
                          background: '#eff6ff', color: '#3b82f6',
                          fontSize: 12, fontWeight: 600, padding: '2px 9px', borderRadius: 20
                        }}>
                          {r.type_prelevement || '—'}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px', fontSize: 13, color: '#475569',
                        maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {r.diagnostic || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Non renseigné</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge statut={r.statut} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {r.statut === 'validé' ? formatDate(r.validated_at) : formatDate(r.updated_at)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            id={`btn-expand-${r.cr_id}`}
                            title={expanded === r.cr_id ? 'Masquer' : 'Voir détails'}
                            onClick={e => { e.stopPropagation(); setExpanded(expanded === r.cr_id ? null : r.cr_id); }}
                            style={{
                              background: '#f1f5f9', border: 'none', borderRadius: 8,
                              padding: '5px 10px', cursor: 'pointer', fontSize: 13,
                              color: '#475569', fontWeight: 700,
                              transition: 'background 0.15s'
                            }}
                          >
                            {expanded === r.cr_id ? '▲' : '▼'}
                          </button>
                          <button
                            id={`btn-edit-cr-${r.cr_id}`}
                            title="Ouvrir le rapport"
                            onClick={e => { e.stopPropagation(); navigate(`/anapath/compte-rendu/${r.anapath_id}`); }}
                            style={{
                              background: '#eff6ff', border: 'none', borderRadius: 8,
                              padding: '5px 10px', cursor: 'pointer', fontSize: 13,
                              color: '#3b82f6', fontWeight: 700,
                              transition: 'background 0.15s'
                            }}
                          >
                            Ouvrir →
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Detail panel ── */}
                    {expanded === r.cr_id && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, borderTop: '1px solid #e2e8f0' }}>
                          <div style={{
                            background: '#f8fafc', padding: '20px 24px',
                            borderBottom: '2px solid #e2e8f0'
                          }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: 16, marginBottom: 16
                            }}>
                              <DetailBlock label="Observation" text={r.observation} />
                              <DetailBlock label="Diagnostic" text={r.diagnostic} />
                              <DetailBlock label="Conclusion" text={r.conclusion} />
                            </div>
                            <div style={{
                              display: 'flex', gap: 24, flexWrap: 'wrap',
                              fontSize: 12, color: '#64748b', paddingTop: 12,
                              borderTop: '1px solid #e2e8f0'
                            }}>
                              <span>📅 Prélèvement : <strong style={{ color: '#334155' }}>{formatDate(r.date_prelevement)}</strong></span>
                              <span>📍 Localisation : <strong style={{ color: '#334155' }}>{r.localisation || '—'}</strong></span>
                              <span>🧬 Type cancer : <strong style={{ color: '#334155' }}>{r.type_cancer || '—'}</strong></span>
                              {r.created_by_nom && (
                                <span>✍️ Rédigé par : <strong style={{ color: '#334155' }}>{r.created_by_prenom} {r.created_by_nom}</strong></span>
                              )}
                              {r.statut === 'validé' && r.validated_by_nom && (
                                <span>✅ Validé par : <strong style={{ color: '#15803d' }}>{r.validated_by_prenom} {r.validated_by_nom}</strong> le {formatDateTime(r.validated_at)}</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

function DetailBlock({ label, text }) {
  return (
    <div style={{
      background: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
      padding: '14px 16px'
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: text ? '#334155' : '#cbd5e1', lineHeight: 1.6, fontStyle: text ? 'normal' : 'italic' }}>
        {text || 'Non renseigné'}
      </div>
    </div>
  );
}
