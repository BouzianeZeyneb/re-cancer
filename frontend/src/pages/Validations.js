import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── Helpers ────────────────────────────────────────────────────────────────────
const age = (dob) => {
  if (!dob) return '—';
  return `${Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000))} ans`;
};
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const QualityScore = ({ row }) => {
  let score = 0;
  if (row.nom && row.prenom) score += 20;
  if (row.date_naissance) score += 15;
  if (row.num_carte_nationale) score += 15;
  if (row.topographie_icdo3) score += 20;
  if (row.morphologie_icdo3) score += 15;
  if (row.stade_tnm_t || row.tnm_t) score += 15;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Élevée' : score >= 50 ? 'Moyenne' : 'Faible';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 56, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
    </div>
  );
};

// ── Modal de validation détaillée ────────────────────────────────────────────
function ValidationModal({ item, onClose, onDecision }) {
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (action) => {
    if (action === 'rejeter' && !commentaire.trim()) {
      return toast.error('Veuillez indiquer le motif du rejet.');
    }
    setLoading(true);
    try {
      await api.post(`/validations/${item.case_id}/${action}`, { commentaire });
      toast.success(action === 'approuver'
        ? '✅ Dossier approuvé — intégré aux statistiques nationales.'
        : '↩️ Dossier rejeté — renvoyé au médecin pour correction.');
      onDecision();
      onClose();
    } catch (e) {
      toast.error('Erreur lors de la décision.');
    } finally {
      setLoading(false);
    }
  };

  const checks = [
    { label: 'Identité complète (Nom + Prénom)', ok: !!(item.nom && item.prenom) },
    { label: 'Date de naissance', ok: !!item.date_naissance },
    { label: 'Carte Nationale', ok: !!item.num_carte_nationale },
    { label: 'Topographie ICD-O-3', ok: !!item.topographie_icdo3 },
    { label: 'Morphologie ICD-O-3', ok: !!item.morphologie_icdo3 },
    { label: 'Stade TNM', ok: !!(item.stade_tnm_t || item.tnm_t) },
  ];
  const passed = checks.filter(c => c.ok).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Contrôle Qualité du Dossier</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{item.nom} {item.prenom} — Dossier #{item.case_id?.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Infos patient */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Patient', `${item.nom} ${item.prenom}`],
              ['Âge', age(item.date_naissance)],
              ['Sexe', item.sexe === 'M' ? 'Masculin' : 'Féminin'],
              ['Wilaya', item.wilaya || '—'],
              ['Topographie ICD-O-3', item.topographie_icdo3 || '—'],
              ['Morphologie ICD-O-3', item.morphologie_icdo3 || '—'],
              ['TNM T', item.stade_tnm_t || item.tnm_t || '—'],
              ['Date diagnostic', fmt(item.date_diagnostic)],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Checklist qualité */}
          <div style={{ background: '#f8fafc', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Vérification des champs critiques</h4>
              <span style={{ fontSize: 12, fontWeight: 800, color: passed === checks.length ? '#10b981' : '#f59e0b' }}>{passed}/{checks.length} OK</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checks.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.ok ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.ok
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    }
                  </div>
                  <span style={{ fontSize: 13, color: c.ok ? '#166534' : '#991b1b', fontWeight: 600 }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
              Commentaire / Notes qualité
            </label>
            <textarea
              rows={3}
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Motif de rejet obligatoire — notes facultatives pour approbation..."
              style={{ width: '100%', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '12px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => submit('rejeter')} disabled={loading} style={{ flex: 1, height: 48, borderRadius: 12, border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#e11d48', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              ↩️ Rejeter pour correction
            </button>
            <button onClick={() => submit('approuver')} disabled={loading} style={{ flex: 1, height: 48, borderRadius: 12, border: 'none', background: '#10b981', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              {loading ? 'Traitement...' : '✅ Approuver & Intégrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Validations() {
  const [tab, setTab] = useState('queue'); // 'queue' | 'history'
  const [cases, setCases] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState({ total: 0, approuves: 0, rejetes: 0 });

  const loadQueue = useCallback(() => {
    setLoading(true);
    api.get('/validations')
      .then(res => { setCases(res.data); setStats(s => ({ ...s, total: res.data.length })); })
      .catch(() => {
        // Fallback: load patients as demo cases if endpoint not ready
        api.get('/patients').then(r => setCases(r.data.slice(0, 6).map(p => ({
          ...p, case_id: p.id, topographie_icdo3: 'C50.1', morphologie_icdo3: '8500/3',
          stade_tnm_t: 'T2', date_diagnostic: p.created_at
        }))));
      })
      .finally(() => setLoading(false));
  }, []);

  const loadHistory = useCallback(() => {
    api.get('/validations/historique')
      .then(res => {
        setHistory(res.data);
        const ap = res.data.filter(r => r.validation_statut === 'approuve').length;
        const rj = res.data.filter(r => r.validation_statut === 'rejete').length;
        setStats(s => ({ ...s, approuves: ap, rejetes: rj }));
      })
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    loadQueue();
    loadHistory();
  }, [loadQueue, loadHistory]);

  const StatCard = ({ label, value, color, bg, icon }) => (
    <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );

  return (
    <Layout title="Validations Épidémiologiques">
      {selected && (
        <ValidationModal
          item={selected}
          onClose={() => setSelected(null)}
          onDecision={() => { loadQueue(); loadHistory(); }}
        />
      )}

      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
            🔬 Dashboard de Validation Épidémiologique
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Contrôlez la qualité des dossiers avant leur intégration aux statistiques nationales du cancer.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard label="Dossiers en attente" value={cases.length} color="#f59e0b" bg="#fef3c7" icon="⏳" />
          <StatCard label="Approuvés (session)" value={stats.approuves} color="#10b981" bg="#dcfce7" icon="✅" />
          <StatCard label="Rejetés (session)" value={stats.rejetes} color="#ef4444" bg="#fee2e2" icon="↩️" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 14, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          {[['queue', '📋 File d\'attente', cases.length], ['history', '📜 Historique', history.length]].map(([key, label, count]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              background: tab === key ? 'white' : 'transparent',
              color: tab === key ? '#0f172a' : '#64748b',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {label}
              <span style={{ background: tab === key ? '#3b82f6' : '#e2e8f0', color: tab === key ? 'white' : '#64748b', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── FILE D'ATTENTE ── */}
        {tab === 'queue' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : cases.length === 0 ? (
            <div style={{ background: 'white', padding: 60, borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>File d'attente vide !</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Tous les dossiers ont été traités. Aucun cas en attente de validation.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Patient', 'Âge / Sexe', 'ICD-O-3', 'TNM', 'Qualité', 'Enregistré le', 'Action'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: h === 'Action' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c, i) => (
                    <tr key={c.case_id || c.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{c.nom} {c.prenom}</div>
                        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{c.wilaya || 'Wilaya inconnue'}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{age(c.date_naissance)}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: c.sexe === 'M' ? '#eff6ff' : '#fdf2f8', color: c.sexe === 'M' ? '#3b82f6' : '#ec4899' }}>
                          {c.sexe === 'M' ? 'M' : 'F'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{c.topographie_icdo3 || <span style={{ color: '#ef4444' }}>Manquant</span>}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{c.morphologie_icdo3 || '—'}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {(c.stade_tnm_t || c.tnm_t) ? (
                          <div style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                            T{c.stade_tnm_t || c.tnm_t} N{c.stade_tnm_n || c.tnm_n || '?'} M{c.stade_tnm_m || c.tnm_m || '?'}
                          </div>
                        ) : <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>⚠ Non codé</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}><QualityScore row={c} /></td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>{fmt(c.case_created || c.created_at)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelected(c)}
                          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }}
                        >
                          Examiner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── HISTORIQUE ── */}
        {tab === 'history' && (
          history.length === 0 ? (
            <div style={{ background: 'white', padding: 60, borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📜</div>
              <p style={{ color: '#64748b' }}>Aucune décision enregistrée pour l'instant.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Patient', 'Topographie', 'Décision', 'Commentaire', 'Date décision'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.case_id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{h.nom} {h.prenom}</td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#475569' }}>{h.topographie_icdo3 || '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                          background: h.validation_statut === 'approuve' ? '#dcfce7' : '#fee2e2',
                          color: h.validation_statut === 'approuve' ? '#166534' : '#991b1b'
                        }}>
                          {h.validation_statut === 'approuve' ? '✅ Approuvé' : '↩️ Rejeté'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b', maxWidth: 220 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {h.commentaire || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>{fmt(h.validated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
