import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ── TABLER ICONS ─────────────────────────────────────────────────────────────
const TI = {
  download: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 11l5 5 5-5"/><path d="M12 4v12"/></svg>,
  clock: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 12l3 2"/><path d="M12 7v5"/></svg>,
  checkCircle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M9 12l2 2l4 -4"/></svg>,
  xCircle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M10 10l4 4m0 -4l-4 4"/></svg>,
  pie: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 12l5 -5"/><path d="M12 12v-9"/></svg>,
  eye: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10"/></svg>,
  x: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>,
  clipboardCheck: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2V7a2 2 0 0 0 -2 -2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 14l2 2l4 -4"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg>,
  history: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8l0 4l2 2"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>,
  arrowRight: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l14 0"/><path d="M13 18l6 -6"/><path d="M13 6l6 6"/></svg>,
  chartBar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M9 8m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M15 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/><path d="M4 20l14 0"/></svg>,
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const age = (dob) => dob ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000)) + ' ans' : '—';
const relTime = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `il y a ${days} j`;
};
const relTimeShort = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
};
const getCancerBadge = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('sein')) return { bg: '#FBEAF0', text: '#993556' };
  if (t.includes('poumon')) return { bg: '#E6F1FB', text: '#185FA5' };
  if (t.includes('côlon') || t.includes('colon')) return { bg: '#FAEEDA', text: '#854F0B' };
  if (t.includes('prostate')) return { bg: '#E1F5EE', text: '#0F6E56' };
  return { bg: '#F1EFE8', text: '#5F5E5A' };
};
const getTNMBadge = (t) => {
  if (!t) return { bg: '#f1f5f9', text: '#64748b', label: '—' };
  if (t.includes('1')) return { bg: '#dcfce7', text: '#166534', label: 'Stade I' };
  if (t.includes('2')) return { bg: '#fef3c7', text: '#92400e', label: 'Stade II' };
  if (t.includes('3')) return { bg: '#ffedd5', text: '#9a3412', label: 'Stade III' };
  if (t.includes('4')) return { bg: '#fee2e2', text: '#991b1b', label: 'Stade IV' };
  return { bg: '#f1f5f9', text: '#64748b', label: t };
};

// ── DOSSIER REVIEW MODAL ─────────────────────────────────────────────────────
function ReviewModal({ item, onClose, onDecision }) {
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleAction = async (action) => {
    if (action === 'rejeter' && !commentaire.trim()) {
      setError(true);
      return toast.error('Veuillez indiquer le motif du rejet.');
    }
    const msg = action === 'approuver' 
      ? "Confirmer l'approbation ? Ce dossier sera intégré aux statistiques nationales."
      : "Confirmer le rejet ? Le médecin recevra votre commentaire pour correction.";
    
    if (!window.confirm(msg)) return;

    setLoading(true);
    try {
      await api.post(`/validations/${item.case_id}/${action}`, { commentaire });
      toast.success(action === 'approuver' ? 'Dossier approuvé avec succès' : 'Dossier rejeté — médecin notifié');
      onDecision();
      onClose();
    } catch (e) {
      toast.error('Erreur lors du traitement du dossier.');
    } finally {
      setLoading(false);
    }
  };

  const badge = getCancerBadge(item.topographie_icdo3);
  const tnm = getTNMBadge(item.stade_tnm_t || item.tnm_t);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 1100, height: '90vh', display: 'flex', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* LEFT PANEL */}
        <div style={{ flex: '0 0 60%', borderRight: '1px solid #e2e8f0', overflowY: 'auto', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{item.nom} {item.prenom}</h2>
              <div style={{ display: 'flex', gap: 12, fontSize: 14, color: '#64748b' }}>
                <span>{age(item.date_naissance)}</span> • <span>{item.wilaya || 'Wilaya non précisée'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500, background: badge.bg, color: badge.text }}>{item.topographie_icdo3 || 'Inconnu'}</span>
              <span style={{ padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500, background: tnm.bg, color: tnm.text }}>{tnm.label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Diagnostic */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Diagnostic</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Topographie (ICD-O-3)</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.topographie_icdo3 || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Morphologie (ICD-O-3)</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.morphologie_icdo3 || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Date de diagnostic</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.date_diagnostic ? new Date(item.date_diagnostic).toLocaleDateString('fr-FR') : '—'}</div>
                </div>
              </div>
            </div>

            {/* Anapath */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Résultats anatomopathologiques</h3>
              <div style={{ fontSize: 14, color: '#475569', fontStyle: 'italic', background: '#f8fafc', padding: 12, borderRadius: 6 }}>
                Section en cours d'intégration avec le module labo...
              </div>
            </div>

            {/* Traitement */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Traitement en cours</h3>
              <div style={{ fontSize: 14, color: '#475569', fontStyle: 'italic', background: '#f8fafc', padding: 12, borderRadius: 6 }}>
                Section en cours d'intégration avec le module traitement...
              </div>
            </div>

            {/* Historique */}
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Historique des statuts</h3>
              <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
                <div style={{ width: 2, background: '#e2e8f0', position: 'absolute', top: 8, bottom: 8, left: 5 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Soumis pour validation</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>Par Médecin • {item.case_created ? new Date(item.case_created).toLocaleString('fr-FR') : '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: '0 0 40%', background: '#f8fafc', padding: 32, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
            {TI.x}
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fffbeb', color: '#b45309', borderRadius: 20, fontWeight: 500, fontSize: 14, border: '1px solid #fde68a' }}>
              En attente de validation
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>MÉDECIN SOUMETTEUR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 600 }}>
                Dr
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Dr. Traitant</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Soumis le {item.case_created ? new Date(item.case_created).toLocaleDateString('fr-FR') : '—'}</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 8 }}>Commentaire de l'épidémiologiste</label>
            <textarea 
              value={commentaire}
              onChange={e => { setCommentaire(e.target.value); setError(false); }}
              placeholder="Ajoutez vos observations ou motif de rejet..."
              style={{ width: '100%', height: 120, padding: 12, borderRadius: 8, border: `1px solid ${error ? '#ef4444' : '#e2e8f0'}`, outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            <button onClick={() => handleAction('approuver')} disabled={loading} style={{ width: '100%', padding: '12px', background: '#EAF3DE', color: '#27500A', border: '1px solid #639922', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {TI.checkCircle} Approuver et intégrer
            </button>
            <button onClick={() => handleAction('rejeter')} disabled={loading} style={{ width: '100%', padding: '12px', background: 'white', color: '#A32D2D', border: '1px solid #F09595', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {TI.xCircle} Rejeter pour correction
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── PAGE COMPONENTS ──────────────────────────────────────────────────────────
const StatCard = ({ title, value, color, icon, bg }) => (
  <div style={{ background: bg, borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
    <div style={{ color: color }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{title}</div>
    </div>
  </div>
);

export default function Validations() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('queue');
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/validations/stats').catch(() => ({ data: {} })),
      api.get('/validations').catch(() => ({ data: [] })),
      api.get('/validations/historique').catch(() => ({ data: [] }))
    ]).then(([s, q, h]) => {
      setStats(s.data);
      setQueue(q.data);
      setHistory(h.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Handle Quick Actions
  const handleQuickApprove = async (item) => {
    if (!window.confirm("Confirmer l'approbation ?")) return;
    try {
      await api.post(`/validations/${item.case_id}/approuver`, { commentaire: '' });
      toast.success('Dossier approuvé');
      loadData();
    } catch (e) { toast.error('Erreur'); }
  };
  const handleQuickReject = async (item) => {
    const motif = window.prompt("Motif du rejet (obligatoire) :");
    if (!motif) return toast.error('Motif obligatoire annulé');
    try {
      await api.post(`/validations/${item.case_id}/rejeter`, { commentaire: motif });
      toast.success('Dossier rejeté');
      loadData();
    } catch (e) { toast.error('Erreur'); }
  };
  const processNext = () => {
    if (queue.length > 0) setSelected(queue[0]);
    else toast('Aucun dossier en attente');
  };

  const handleExportCSV = () => {
    if (history.length === 0 && queue.length === 0) return toast.error('Aucune donnée à exporter');
    const headers = ['ID Cas', 'Statut Actuel', 'Patient', 'Decision', 'Date', 'Type Cancer', 'TNM'];
    
    const allData = [
      ...history.map(h => [h.case_id, 'Historique', `${h.nom} ${h.prenom}`, h.validation_statut, new Date(h.validated_at || h.created_at).toLocaleDateString('fr-FR'), h.topographie_icdo3 || '', h.stade_tnm_t || h.tnm_t || '']),
      ...queue.map(q => [q.case_id, 'En attente', `${q.nom} ${q.prenom}`, 'En attente', new Date(q.case_created || new Date()).toLocaleDateString('fr-FR'), q.topographie_icdo3 || '', q.stade_tnm_t || q.tnm_t || ''])
    ];
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(';') + '\n' 
      + allData.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_Validations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rapport CSV exporté avec succès');
  };

  return (
    <Layout title="Validations épidémiologiques">
      {selected && <ReviewModal item={selected} onClose={() => setSelected(null)} onDecision={loadData} />}

      <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, color: '#0f172a' }}>Validations épidémiologiques</h1>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Contrôlez la qualité des dossiers avant intégration aux statistiques nationales</p>
          </div>
          <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            {TI.download} Exporter rapport CSV
          </button>
        </div>

        {/* STATS BAR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard title="Dossiers à traiter" value={stats?.pending || 0} color="#b45309" bg="#FAEEDA" icon={TI.clock} />
          <StatCard title="Validés ce jour" value={stats?.approvedToday || 0} color="#15803d" bg="#EAF3DE" icon={TI.checkCircle} />
          <StatCard title="Renvoyés en correction" value={stats?.rejectedToday || 0} color="#b91c1c" bg="#FCEBEB" icon={TI.xCircle} />
          <StatCard title="Taux de validation" value={`${stats?.monthlyRate || 0}%`} color="#1d4ed8" bg="#E6F1FB" icon={TI.pie} />
        </div>

        {/* MAIN CONTENT GRID */}
        <div style={{ display: 'flex', gap: 24 }}>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* TABS */}
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
              <button 
                onClick={() => setTab('queue')}
                style={{ background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: 14, fontWeight: tab === 'queue' ? 600 : 400, color: tab === 'queue' ? '#3b82f6' : '#64748b', borderBottom: tab === 'queue' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                File d'attente
                <span style={{ padding: '2px 8px', borderRadius: 12, background: tab === 'queue' ? '#3b82f6' : '#e2e8f0', color: tab === 'queue' ? 'white' : '#64748b', fontSize: 12 }}>{queue.length}</span>
              </button>
              <button 
                onClick={() => setTab('history')}
                style={{ background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: 14, fontWeight: tab === 'history' ? 600 : 400, color: tab === 'history' ? '#3b82f6' : '#64748b', borderBottom: tab === 'history' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Historique
                <span style={{ padding: '2px 8px', borderRadius: 12, background: tab === 'history' ? '#3b82f6' : '#e2e8f0', color: tab === 'history' ? 'white' : '#64748b', fontSize: 12 }}>{history.length}</span>
              </button>
            </div>

            {/* TAB CONTENT: QUEUE */}
            {tab === 'queue' && (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
                ) : queue.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ marginBottom: 16 }}>{TI.clipboardCheck}</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 500, color: '#0f172a' }}>File d'attente vide</h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Tous les dossiers ont été traités avec succès</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        {['Patient', 'Type de cancer', 'Stade TNM', 'Médecin soumetteur', 'Soumis le', 'Priorité', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map(c => {
                        const badge = getCancerBadge(c.topographie_icdo3);
                        const tnm = getTNMBadge(c.stade_tnm_t || c.tnm_t);
                        return (
                          <tr key={c.case_id} style={{ borderBottom: '1px solid #f1f5f9' }} onClick={() => setSelected(c)} onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '12px 16px', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500 }}>
                                  {c.nom?.[0]}{c.prenom?.[0]}
                                </div>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{c.nom} {c.prenom}</div>
                                  <div style={{ fontSize: 12, color: '#64748b' }}>#{c.case_id?.slice(0,8)}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', cursor: 'pointer' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500, background: badge.bg, color: badge.text }}>{c.topographie_icdo3 || '—'}</span>
                            </td>
                            <td style={{ padding: '12px 16px', cursor: 'pointer' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500, background: tnm.bg, color: tnm.text }}>{tnm.label}</span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a', cursor: 'pointer' }}>Dr. Traitant</td>
                            <td style={{ padding: '12px 16px', cursor: 'pointer' }}>
                              <div style={{ fontSize: 14, color: '#0f172a' }}>{c.case_created ? new Date(c.case_created).toLocaleDateString('fr-FR') : '—'}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>({relTime(c.case_created)})</div>
                            </td>
                            <td style={{ padding: '12px 16px', cursor: 'pointer' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500, background: '#f1f5f9', color: '#64748b' }}>Normale</span>
                            </td>
                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => setSelected(c)} style={{ background: 'none', border: 'none', padding: 6, color: '#64748b', cursor: 'pointer' }} title="Examiner">{TI.eye}</button>
                              <button onClick={() => handleQuickApprove(c)} style={{ background: 'none', border: 'none', padding: 6, color: '#10b981', cursor: 'pointer' }} title="Approuver">{TI.check}</button>
                              <button onClick={() => handleQuickReject(c)} style={{ background: 'none', border: 'none', padding: 6, color: '#ef4444', cursor: 'pointer' }} title="Rejeter">{TI.x}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {tab === 'history' && (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 16 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <div style={{ position: 'absolute', top: 10, left: 12, color: '#94a3b8' }}>{TI.search}</div>
                    <input type="text" placeholder="Rechercher un patient..." style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <select style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, outline: 'none', background: 'white' }}>
                    <option>Toutes les décisions</option>
                    <option>Approuvés</option>
                    <option>Rejetés</option>
                  </select>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
                    {TI.x} Réinitialiser
                  </button>
                </div>

                {history.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ marginBottom: 16 }}>{TI.history}</div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 500, color: '#0f172a' }}>Aucune validation enregistrée</h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Votre historique de décisions apparaîtra ici</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        {['Patient', 'Type cancer', 'Décision', 'Commentaire', 'Médecin', 'Date de décision', ''].map(h => (
                          <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 500, color: '#64748b' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => {
                        const badge = getCancerBadge(h.topographie_icdo3);
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{h.nom} {h.prenom}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>#{h.case_id?.slice(0,8)}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500, background: badge.bg, color: badge.text }}>{h.topographie_icdo3 || '—'}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {h.validation_statut === 'approuve' 
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500, background: '#dcfce7', color: '#166534' }}>{TI.check} Approuvé</span>
                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500, background: '#fee2e2', color: '#991b1b' }}>{TI.x} Rejeté</span>
                              }
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.commentaire}>
                              {h.commentaire || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>Dr. Traitant</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>
                              {h.validated_at ? new Date(h.validated_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <button style={{ background: 'none', border: 'none', padding: 6, color: '#64748b', cursor: 'pointer' }} title="Voir le dossier archivé">{TI.eye}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                
                {history.length > 0 && (
                  <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#64748b' }}>
                    <span>Affichage de 1 à {history.length} sur {history.length} résultats</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: 6, cursor: 'not-allowed', color: '#cbd5e1' }}>Précédent</button>
                      <button style={{ padding: '6px 12px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, fontWeight: 500 }}>1</button>
                      <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: 6, cursor: 'not-allowed', color: '#cbd5e1' }}>Suivant</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Card 1 */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Actions rapides</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={processNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  <span>Traiter le suivant</span>
                  {TI.arrowRight}
                </button>
                <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  {TI.download} Exporter rapport CSV
                </button>
                <button onClick={() => navigate('/statistiques')} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  {TI.chartBar} Accéder aux statistiques
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Mes dernières actions</h3>
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {history.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Aucune action récente</div>
                ) : (
                  history.slice(0, 10).map((h, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderBottom: i < history.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: h.validation_statut === 'approuve' ? '#10b981' : '#ef4444', marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{h.nom} {h.prenom}</div>
                        <div style={{ fontSize: 13, color: h.validation_statut === 'approuve' ? '#10b981' : '#ef4444', marginTop: 2 }}>{h.validation_statut === 'approuve' ? 'Approuvé' : 'Rejeté'}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{relTimeShort(h.validated_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
