import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Simple stat card
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: 'white',
      border: `2px solid ${color}22`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      minWidth: 0,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: color, lineHeight: 1, fontFamily: 'Outfit, sans-serif' }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function AnapathDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/anapath/stats')
      .then(res => setStats(res.data))
      .catch(() => setError('Impossible de charger les statistiques ANAPATH.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Tableau de bord ANAPATH">
      <div style={{ padding: '0 0 40px', maxWidth: 960, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f4c81 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 28,
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
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                Tableau de bord ANAPATH
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5, margin: 0, marginTop: 2 }}>
                Vue globale de l'activité anatomopathologique
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              id="btn-voir-historique"
              onClick={() => navigate('/anapath/historique')}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,0.15)', color: 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', gap: 8,
                backdropFilter: 'blur(4px)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Historique des rapports
            </button>
            <button
              id="btn-voir-prelevements"
              onClick={() => navigate('/anapath/prelevements')}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,0.15)', color: 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', gap: 8,
                backdropFilter: 'blur(4px)',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Voir les prélèvements
            </button>
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, gap: 12 }}>
            <div className="spinner" />
            <span style={{ color: '#64748b', fontWeight: 600 }}>Chargement des statistiques...</span>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
            padding: '20px 24px', color: '#b91c1c', fontWeight: 600, fontSize: 14
          }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* ── Stat Cards ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 28
            }}>
              <StatCard
                label="Total prélèvements"
                value={stats.total_prelevements}
                color="#3b82f6"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M10 2v7.51M14 2v7.51M2 22h20M4.53 13.51a3 3 0 0 0-2.53 3.53C2.26 19.34 3.73 21 5.61 21h12.78c1.88 0 3.35-1.66 3.61-3.96a3 3 0 0 0-2.53-3.53l-1.47-.2v-3.71A2.5 2.5 0 0 0 15.5 7H14V2H10v5H8.5a2.5 2.5 0 0 0-2.5 2.5v3.71l-1.47.2z" />
                  </svg>
                }
              />
              <StatCard
                label="Comptes rendus rédigés"
                value={stats.total_cr}
                color="#8b5cf6"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                }
              />
              <StatCard
                label="Rapports validés"
                value={stats.total_valides}
                color="#10b981"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              />
              <StatCard
                label="Brouillons en cours"
                value={stats.total_brouillons}
                color="#f59e0b"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                }
              />
              <StatCard
                label="En attente (sans rapport)"
                value={stats.en_attente}
                color="#ef4444"
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
              />
            </div>

            {/* ── Recent Validations ── */}
            <div style={{
              background: 'white', borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{
                padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>
                  Derniers rapports validés
                </span>
              </div>

              {stats.recents.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                  Aucun rapport validé pour le moment.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Patient', 'Type de prélèvement', 'Diagnostic', 'Validé le'].map(h => (
                        <th key={h} style={{
                          padding: '10px 20px', textAlign: 'left',
                          fontSize: 11, fontWeight: 700, color: '#94a3b8',
                          textTransform: 'uppercase', letterSpacing: 0.5
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recents.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                          {r.nom} {r.prenom}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '3px 10px',
                            borderRadius: 20, background: '#eff6ff', color: '#3b82f6'
                          }}>
                            {r.type_prelevement || '—'}
                          </span>
                        </td>
                        <td style={{
                          padding: '12px 20px', fontSize: 13, color: '#475569',
                          maxWidth: 280,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {r.diagnostic || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {formatDate(r.validated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Quick Actions ── */}
            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                id="btn-dashboard-prelevements"
                onClick={() => navigate('/anapath/prelevements')}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  color: '#0f4c81', cursor: 'pointer', fontSize: 13,
                  fontWeight: 700, fontFamily: 'Sora, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Gérer les prélèvements
              </button>
              <button
                id="btn-dashboard-historique"
                onClick={() => navigate('/anapath/historique')}
                style={{
                  padding: '10px 20px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  color: '#0f4c81', cursor: 'pointer', fontSize: 13,
                  fontWeight: 700, fontFamily: 'Sora, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Historique des rapports
              </button>
              {stats.en_attente > 0 && (
                <button
                  id="btn-dashboard-en-attente"
                  onClick={() => navigate('/anapath/prelevements?statut=en_attente')}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    border: '1.5px solid #fecaca', background: '#fef2f2',
                    color: '#b91c1c', cursor: 'pointer', fontSize: 13,
                    fontWeight: 700, fontFamily: 'Sora, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {stats.en_attente} prélèvement{stats.en_attente > 1 ? 's' : ''} en attente
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
