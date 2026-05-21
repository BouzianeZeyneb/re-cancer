import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPatients, deletePatient } from '../utils/api';
import toast from 'react-hot-toast';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stadeFilter, setStadeFilter] = useState('');
  const navigate = useNavigate();

  const CANCER_TYPES = ["Sein", "Poumon", "Colorectal", "Prostate", "Estomac", "Foie", "Vessie", "Rein", "Lymphome", "Leucémie"];
  const STAGES = ["I", "II", "III", "IV", "Inconnu"];

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (sexeFilter) params.sexe = sexeFilter;
    if (typeFilter) params.type = typeFilter;
    if (stadeFilter) params.stade = stadeFilter;
    getPatients(params)
      .then(r => {
         setPatients(r.data.patients || r.data);
         setTotal(r.data.total || (r.data.patients || r.data).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, sexeFilter, typeFilter, stadeFilter]);

  useEffect(() => { load(); }, [load]);

  const getInitials = (nom, prenom) => {
    return `${nom?.[0] || '?'}${prenom?.[0] || '?'}`.toUpperCase();
  };

  const getRandomGradient = (seed) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
    ];
    const index = (seed?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  return (
    <Layout title="">
      <div style={{ padding: '0 12px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Répertoire des Patients</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: 500 }}>{total} dossiers actifs enregistrés</p>
          </div>
          <Link to="/patients/nouveau" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 14, boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.15)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span style={{ fontWeight: 800 }}>Nouveau Patient</span>
          </Link>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div style={{ 
            background: 'white', 
            padding: '20px 24px', 
            borderRadius: 24, 
            border: '1px solid #f1f5f9', 
            display: 'flex', 
            gap: 16, 
            alignItems: 'center',
            marginBottom: 32,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
            flexWrap: 'wrap'
        }}>
            <div style={{ flex: 1, minWidth: 300, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="form-control"
                style={{ height: 48, paddingLeft: 48, background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 12, fontWeight: 600 }}
                placeholder="Rechercher par nom, matricule ou CNI..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <div style={{ height: 32, width: 1.5, background: '#f1f5f9' }} />

            <select className="form-control" style={{ width: 180, height: 48, background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 12, fontWeight: 700 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Tous les Types</option>
              {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select className="form-control" style={{ width: 160, height: 48, background: '#f8fafc', border: '1.5px solid #f1f5f9', borderRadius: 12, fontWeight: 700 }} value={stadeFilter} onChange={e => setStadeFilter(e.target.value)}>
              <option value="">Stade</option>
              {STAGES.map(s => <option key={s} value={s}>Stade {s}</option>)}
            </select>

            <button className="btn-icon-subtle" style={{ width: 48, height: 48 }} onClick={load}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M22 2v6h-6"/></svg>
            </button>
        </div>

        {/* PATIENTS TABLE */}
        <div className="card" style={{ padding: 0, borderRadius: 24, border: '1px solid #f1f5f9', overflow: 'hidden', background: 'white' }}>
          {loading ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 20px' }} />
                <div style={{ color: '#94a3b8', fontWeight: 600 }}>Synchronisation des données...</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Matricule</th>
                    <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Patient & Identité</th>
                    <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Diagnostic Cancer</th>
                    <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Stade</th>
                    <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>État Vital</th>
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0ea5e9', background: '#f0f9ff', padding: '6px 12px', borderRadius: 8, fontFamily: 'JetBrains Mono' }}>
                              ONC-{String(p.id).padStart(4, '0')}
                          </span>
                      </td>
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ 
                              width: 44, height: 44, borderRadius: 14, 
                              background: getRandomGradient(p.nom), 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              color: 'white', fontWeight: 800, fontSize: 15,
                              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                          }}>
                              {getInitials(p.nom, p.prenom)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{p.nom} {p.prenom}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: 600 }}>{p.sexe === 'F' ? 'Femme' : 'Homme'} · {p.date_naissance}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>{p.cancer_type || 'Diagnostic non précisé'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>ID ICD-O-3 : C44.5</div>
                      </td>
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: p.stade === 'IV' ? '#ef4444' : '#f59e0b' }} />
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 13 }}>Stade {p.stade || 'II'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ 
                            fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5,
                            background: p.statut_vital === 'Décédé' ? '#fee2e2' : '#f0fdf4',
                            color: p.statut_vital === 'Décédé' ? '#991b1b' : '#166534',
                            padding: '6px 14px', borderRadius: 30, display: 'inline-block'
                        }}>
                            {p.statut_vital || 'Vivant'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                         <button className="btn-icon-subtle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                         </button>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" style={{ padding: 60, textAlign: 'center' }}>
                         <div style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Aucun patient trouvé correspondant à ces critères.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
