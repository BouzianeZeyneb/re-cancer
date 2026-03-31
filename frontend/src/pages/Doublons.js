import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FIELDS = [
  { key: 'nom', label: 'Nom', weight: 20 },
  { key: 'prenom', label: 'Prénom', weight: 20 },
  { key: 'date_naissance', label: 'Date de naissance', isDate: true, weight: 15 },
  { key: 'sexe', label: 'Sexe', weight: 5 },
  { key: 'telephone', label: 'Téléphone', weight: 10 },
  { key: 'num_carte_nationale', label: 'Carte Nationale', weight: 15 },
  { key: 'num_carte_chifa', label: 'Carte Chifa', weight: 10 },
  { key: 'adresse', label: 'Adresse', weight: 5 },
  { key: 'commune', label: 'Commune', weight: 5 },
  { key: 'wilaya', label: 'Wilaya', weight: 5 },
  { key: 'fumeur', label: 'Fumeur', isBool: true, weight: 2 },
  { key: 'alcool', label: 'Alcool', isBool: true, weight: 2 },
  { key: 'activite_sportive', label: 'Activité sportive', isBool: true, weight: 2 },
  { key: 'antecedents_medicaux', label: 'Antécédents médicaux', weight: 5 },
  { key: 'antecedents_familiaux', label: 'Antécédents familiaux', weight: 5 },
  { key: 'autres_medicaments', label: 'Autres médicaments', weight: 2 },
  { key: 'autres_facteurs_risque', label: 'Facteurs de risque', weight: 2 },
];

const calcSimilarity = (p1, p2) => {
  let totalWeight = 0;
  let matchWeight = 0;
  FIELDS.forEach(f => {
    const v1 = String(p1[f.key] || '').toLowerCase().trim();
    const v2 = String(p2[f.key] || '').toLowerCase().trim();
    if (v1 || v2) {
      totalWeight += f.weight;
      if (v1 === v2 && v1) matchWeight += f.weight;
      else if (v1 && v2 && (v1.includes(v2) || v2.includes(v1))) matchWeight += f.weight * 0.7;
    }
  });
  return totalWeight > 0 ? Math.round((matchWeight / totalWeight) * 100) : 0;
};

const fmt = (val, isDate, isBool) => {
  if (isBool) return val ? '✅ Oui' : '❌ Non';
  if (isDate && val) return new Date(val).toLocaleDateString('fr-DZ');
  return val || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>;
};

export default function Doublons() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [doublons, setDoublons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState(null); // { p1, p2, similarity }
  const [choices, setChoices] = useState({});
  const [merging, setMerging] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/doublons').then(r => setDoublons(r.data)).finally(() => setLoading(false));
  };

  const openComparisonById = async (id1, id2) => {
    try {
      const [r1, r2] = await Promise.all([api.get(`/patients/${id1}`), api.get(`/patients/${id2}`)]);
      openComparisonFromPatients(r1.data, r2.data);
    } catch (e) { toast.error('Erreur chargement'); }
  };

  const openComparisonFromPatients = (p1, p2) => {
    const similarity = calcSimilarity(p1, p2);
    const defaultChoices = {};
    FIELDS.forEach(f => {
      defaultChoices[f.key] = (p1[f.key] && !p2[f.key]) ? '1' : (!p1[f.key] && p2[f.key]) ? '2' : '1';
    });
    setChoices(defaultChoices);
    setComparison({ p1, p2, similarity });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const p1Id = searchParams.get('p1');
    const p2Id = searchParams.get('p2');
    if (p1Id && p2Id) {
      openComparisonById(p1Id, p2Id);
    } else if (location.state?.draftPatient && location.state?.existingId) {
      api.get(`/patients/${location.state.existingId}`).then(r => {
        const draft = { ...location.state.draftPatient, id: 'DRAFT', isDraft: true };
        const p1 = r.data;
        const similarity = calcSimilarity(p1, draft);
        const defaultChoices = {};
        FIELDS.forEach(f => {
          defaultChoices[f.key] = (p1[f.key] && !draft[f.key]) ? '1' : (!p1[f.key] && draft[f.key]) ? '2' : '1';
        });
        setChoices(defaultChoices);
        setComparison({ p1, p2: draft, similarity, isDraft: true });
      }).catch((err) => {
        console.error(err);
        toast.error('Erreur draft compare');
      });
    }
  }, [searchParams, location.state]);

  const openComparison = async (d) => {
    try {
      const [r1, r2] = await Promise.all([api.get(`/patients/${d.id1}`), api.get(`/patients/${d.id2}`)]);
      openComparisonFromPatients(r1.data, r2.data);
    } catch (e) { toast.error('Erreur chargement patients'); }
  };

  const handleMerge = async () => {
    if (!comparison) return;
    if (!window.confirm('Confirmer la fusion?')) return;
    setMerging(true);
    try {
      const mergedData = {};
      FIELDS.forEach(f => { mergedData[f.key] = choices[f.key] === '2' ? comparison.p2[f.key] : comparison.p1[f.key]; });
      
      await api.put(`/patients/${comparison.p1.id}`, mergedData);
      
      if (!comparison.isDraft) {
        await api.post('/patients/merge', { sourceId: comparison.p2.id, targetId: comparison.p1.id });
      }

      if (comparison.isDraft && comparison.p2.stylesVieValeurs) {
        const valeurs = Object.entries(comparison.p2.stylesVieValeurs).map(([style_vie_id, valeur]) => ({ style_vie_id, valeur }));
        if (valeurs.length) await api.post('/styles-vie/patient', { patient_id: comparison.p1.id, valeurs });
      }

      toast.success(comparison.isDraft ? '✅ Dossier existant mis à jour!' : '✅ Fusion réussie!');
      const targetId = comparison.p1.id;
      setComparison(null);
      
      if (comparison.isDraft) {
        navigate(`/patients/${targetId}`);
      } else {
        navigate('/doublons');
        load();
      }
    } catch (e) { toast.error('Erreur fusion'); }
    finally { setMerging(false); }
  };

  const similarityColor = (s) => s >= 80 ? '#e63946' : s >= 60 ? '#d97706' : '#22c55e';
  const similarityLabel = (s) => s >= 80 ? 'Très similaire' : s >= 60 ? 'Similaire' : 'Peu similaire';

  // Comparison view
  if (comparison) {
    const { p1, p2, similarity } = comparison;
    return (
      <Layout title="Comparer & Fusionner">
        {/* Similarity badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => { setComparison(null); navigate('/doublons'); }}>← Retour</button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'white', border: `2px solid ${similarityColor(similarity)}`, borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: similarityColor(similarity), fontFamily: 'JetBrains Mono' }}>{similarity}%</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: similarityColor(similarity) }}>{similarityLabel(similarity)}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Taux de similarité</div>
              </div>
              {/* Progress bar */}
              <div style={{ width: 100, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${similarity}%`, height: '100%', background: similarityColor(similarity), borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => { const a={}; FIELDS.forEach(f => a[f.key]='1'); setChoices(a); }}>← Tout P1</button>
            <button className="btn btn-outline btn-sm" onClick={() => { const a={}; FIELDS.forEach(f => a[f.key]='2'); setChoices(a); }}>Tout P2 →</button>
            <button className="btn btn-outline btn-sm" onClick={() => {
              const a={};
              FIELDS.forEach(f => { a[f.key] = (p1[f.key] && !p2[f.key]) ? '1' : (!p1[f.key] && p2[f.key]) ? '2' : '1'; });
              setChoices(a);
            }}>⚡ Auto</button>
            <button className="btn btn-primary" onClick={handleMerge} disabled={merging}>
              {merging ? '⏳...' : '🔗 Fusionner'}
            </button>
          </div>
        </div>

        {/* Comparison table */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 50px 1fr', background: '#f8fafc' }}>
            <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderRight: '1px solid #e2e8f0' }}>Champ</div>
            <div style={{ padding: '12px 16px', background: '#dbeafe', display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid #e2e8f0' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0f4c81', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11 }}>P1</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f4c81' }}>{p1.prenom} {p1.nom}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Patient 1</div>
              </div>
            </div>
            <div style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>VS</div>
            <div style={{ padding: '12px 16px', background: '#fef3c7', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11 }}>P2</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>{p2.prenom} {p2.nom}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Patient 2</div>
              </div>
            </div>
          </div>

          {/* Rows */}
          {FIELDS.map((f, i) => {
            const v1 = p1[f.key];
            const v2 = p2[f.key];
            const same = String(v1||'').toLowerCase().trim() === String(v2||'').toLowerCase().trim();
            const choice = choices[f.key];
            return (
              <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 50px 1fr', borderTop: '1px solid #f1f5f9', background: i%2===0 ? 'white' : '#fafbfc' }}>
                <div style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: '#64748b', borderRight: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>{f.label}</div>

                {/* P1 */}
                <div onClick={() => setChoices(p => ({ ...p, [f.key]: '1' }))} style={{
                  padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: choice==='1' ? '#eff6ff' : 'transparent',
                  borderLeft: choice==='1' ? '3px solid #0f4c81' : '3px solid transparent',
                  borderRight: '1px solid #f1f5f9', transition: 'all 0.15s'
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${choice==='1'?'#0f4c81':'#cbd5e1'}`, background: choice==='1'?'#0f4c81':'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {choice==='1' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: v1 ? '#0f172a' : '#94a3b8' }}>{fmt(v1, f.isDate, f.isBool)}</span>
                </div>

                {/* Similarity indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f1f5f9' }}>
                  {same
                    ? <span style={{ fontSize: 14, color: '#22c55e' }}>✓</span>
                    : <span style={{ fontSize: 10, fontWeight: 700, color: '#e63946', background: '#fee2e2', padding: '2px 5px', borderRadius: 4 }}>≠</span>
                  }
                </div>

                {/* P2 */}
                <div onClick={() => setChoices(p => ({ ...p, [f.key]: '2' }))} style={{
                  padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  background: choice==='2' ? '#fffbeb' : 'transparent',
                  borderLeft: choice==='2' ? '3px solid #d97706' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${choice==='2'?'#d97706':'#cbd5e1'}`, background: choice==='2'?'#d97706':'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {choice==='2' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: v2 ? '#0f172a' : '#94a3b8' }}>{fmt(v2, f.isDate, f.isBool)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleMerge} disabled={merging} style={{ padding: '12px 32px' }}>
            {merging ? '⏳ Fusion en cours...' : '🔗 Confirmer la Fusion'}
          </button>
        </div>
      </Layout>
    );
  }

  // List view
  return (
    <Layout title="Gestion des Doublons">
      <div className="card">
        <div className="card-header">
          <h2>🔍 Doublons Détectés ({doublons.length})</h2>
          <button className="btn btn-outline" onClick={load}>🔄 Actualiser</button>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : doublons.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48 }}>✅</div>
              <h3>Aucun doublon détecté</h3>
              <p>Tous les dossiers patients sont uniques</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {doublons.map((d, i) => (
                <div key={i} style={{ border: '1px solid #fecaca', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ background: '#fee2e2', padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚠️ Doublon potentiel
                    {d.cn1 && d.cn1 === d.cn2 && <span className="badge badge-red">Même carte nationale</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, padding: 16, alignItems: 'center', background: '#fff5f5' }}>
                    <div style={{ padding: 14, background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{d.prenom1} {d.nom1}</div>
                      {d.dob1 && <div style={{ fontSize: 12, color: '#64748b' }}>Né: {new Date(d.dob1).toLocaleDateString('fr-DZ')}</div>}
                      {d.cn1 && <div style={{ fontSize: 12, color: '#64748b' }}>CN: {d.cn1}</div>}
                    </div>
                    <button className="btn btn-primary" onClick={() => openComparison(d)}>
                      🔍 Comparer & Fusionner
                    </button>
                    <div style={{ padding: 14, background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{d.prenom2} {d.nom2}</div>
                      {d.dob2 && <div style={{ fontSize: 12, color: '#64748b' }}>Né: {new Date(d.dob2).toLocaleDateString('fr-DZ')}</div>}
                      {d.cn2 && <div style={{ fontSize: 12, color: '#64748b' }}>CN: {d.cn2}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
