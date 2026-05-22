import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPatients, deletePatient } from '../utils/api';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Patients() {
  const { user, isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stadeFilter, setStadeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [prelevementOnly, setPrelevementOnly] = useState(false);

  useEffect(() => {
    if (user?.role === 'anapath') {
      setPrelevementOnly(true);
    }
  }, [user]);

  useEffect(() => { setPage(1); }, [search, sexeFilter, typeFilter, stadeFilter, prelevementOnly]);

  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  const CANCER_TYPES = ["Sein", "Poumon", "Colorectal", "Prostate", "Estomac", "Foie", "Vessie", "Rein", "Lymphome", "Leucémie"];
  const STAGES = ["I", "II", "III", "IV", "Inconnu"];

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (sexeFilter) params.sexe = sexeFilter;
    if (typeFilter) params.type = typeFilter;
    if (stadeFilter) params.stade = stadeFilter;
    if (prelevementOnly) params.prelevementOnly = 'true';
    params.page = page;
    params.limit = limit;
    getPatients(params)
      .then(r => {
        setPatients(r.data.patients || r.data);
        setTotal(r.data.total || (r.data.patients || r.data).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, sexeFilter, typeFilter, stadeFilter, prelevementOnly, page, limit]);

  useEffect(() => { load(); }, [load, page]);

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

  const openDeleteModal = (e, patient) => {
    e.stopPropagation();
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (hardDelete) => {
    try {
      await api.delete(`/patients/${patientToDelete.id}${hardDelete ? '?hardDelete=true' : ''}`);
      toast.success(hardDelete ? 'Patient supprimé définitivement' : 'Patient archivé avec succès');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setShowDeleteModal(false);
      setPatientToDelete(null);
    }
  };

  const [showImportOptions, setShowImportOptions] = useState(false);
  const fileInputRef = React.useRef(null);
  const [importType, setImportType] = useState('');

  const triggerFileInput = (type) => {
    setImportType(type);
    if (type === 'xlsx') fileInputRef.current.accept = ".xlsx,.xls";
    else if (type === 'csv') fileInputRef.current.accept = ".csv";
    else if (type === 'txt') fileInputRef.current.accept = ".txt";
    else fileInputRef.current.accept = ".csv,.xlsx,.xls,.txt";

    fileInputRef.current.click();
    setShowImportOptions(false);
  };

  const handleImportFiles = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    const loadingToast = toast.loading('Importation en cours...', { id: 'import' });

    try {
      let data = [];
      if (extension === 'xlsx' || extension === 'xls') {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(sheet);
      } else {
        const text = await file.text();
        const firstLine = text.split('\n')[0];
        const delimiter = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');

        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) throw new Error('Fichier vide ou mal formaté');

        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        data = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim());
          const obj = {};
          headers.forEach((h, i) => {
            if (values[i] !== undefined) obj[h] = values[i];
          });
          return obj;
        });
      }

      if (!data.length) throw new Error('Aucune donnée trouvée dans le fichier');

      let count = 0;
      let duplicates = 0;
      let errors = 0;

      for (const row of data) {
        const p = {};
        Object.entries(row).forEach(([k, v]) => {
          if (!v) return;
          const key = String(k).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (key.includes('nom')) p.nom = v;
          if (key.includes('prenom')) p.prenom = v;
          if (key.includes('sexe') || key.includes('genre')) {
            const val = String(v).toUpperCase().trim();
            p.sexe = (val.startsWith('F') || val.includes('FEMME')) ? 'F' : 'M';
          }
          if (key.includes('nais') || key.includes('dob') || key.includes('birth')) {
            let val = String(v).trim();
            if (val.includes('/') || (val.includes('-') && val.split('-')[0].length < 4)) {
              const parts = val.split(/[/-]/);
              if (parts.length === 3) {
                val = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
            p.date_naissance = val;
          }
          if (key.includes('nationale') || key.includes('cni') || key.includes('identity')) p.num_carte_nationale = v;
          if (key.includes('chifa')) p.num_carte_chifa = v;
          if (key.includes('tel')) p.telephone = v;
          if (key.includes('wilaya')) p.wilaya = v;
          if (key.includes('commune')) p.commune = v;
          if (key.includes('adresse')) p.adresse = v;
          if (key.includes('assurance')) p.assurance = v;
          if (key.includes('groupe')) p.groupe_sanguin = v;
          if (key.includes('email')) p.email = v;
        });

        if (p.nom && p.prenom) {
          try {
            await api.post('/patients', { ...p, forceSave: true });
            count++;
          } catch (err) {
            if (err.response?.status === 409) duplicates++;
            else {
              console.error('Row import error:', err);
              errors++;
            }
          }
        }
      }

      if (count > 0) {
        toast.success(`${count} patients importés${duplicates > 0 ? ` (${duplicates} doublons ignorés)` : ''}`, { id: 'import', duration: 5000 });
      } else if (duplicates > 0) {
        toast.error(`${duplicates} patients déjà existants`, { id: 'import', duration: 5000 });
      } else {
        toast.error('Aucun patient importé (format invalide)', { id: 'import', duration: 5000 });
      }
      load();
    } catch (err) {
      console.error('Import global error:', err);
      toast.error('Erreur: ' + (err.message || 'Fichier non supporté'), { id: 'import' });
    }
    e.target.value = '';
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
    <Layout title="">
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportFiles} />

      <div style={{ padding: '0 12px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Répertoire des Patients</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: 500 }}>{total} dossiers actifs enregistrés</p>
          </div>
          {user?.role !== 'anapath' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowImportOptions(!showImportOptions)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderRadius: 14 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  <span style={{ fontWeight: 700 }}>Importer</span>
                </button>

                {showImportOptions && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', zIndex: 100, width: 200, padding: 8 }}>
                    <button onClick={() => triggerFileInput('xlsx')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>Format Excel (.xlsx)</button>
                    <button onClick={() => triggerFileInput('csv')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>Format CSV (.csv)</button>
                    <button onClick={() => triggerFileInput('txt')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>Format Texte (.txt)</button>
                  </div>
                )}
              </div>

              <Link to="/patients/nouveau" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 14, boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.15)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span style={{ fontWeight: 800 }}>Nouveau Patient</span>
              </Link>
            </div>
          )}
        </div>

        {/* ANAPATH SPECIAL TABS */}
        {user?.role === 'anapath' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              onClick={() => setPrelevementOnly(true)}
              style={{
                padding: '12px 24px', borderRadius: 14, border: 'none',
                background: prelevementOnly ? '#0f172a' : '#f1f5f9',
                color: prelevementOnly ? 'white' : '#64748b',
                fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🔬 Patients avec prélèvements
            </button>
            <button
              onClick={() => setPrelevementOnly(false)}
              style={{
                padding: '12px 24px', borderRadius: 14, border: 'none',
                background: !prelevementOnly ? '#0f172a' : '#f1f5f9',
                color: !prelevementOnly ? 'white' : '#64748b',
                fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🔎 Tous les Patients (Recherche/Nouveau Rapport)
            </button>
          </div>
        )}

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
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><path d="M22 2v6h-6" /></svg>
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
                    {prelevementOnly ? (
                      <>
                        <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Type de Prélèvement</th>
                        <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Date Prélèvement</th>
                        <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Localisation</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Diagnostic Cancer</th>
                        <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>Stade</th>
                        <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #f1f5f9' }}>État Vital</th>
                      </>
                    )}
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0ea5e9', background: '#f0f9ff', padding: '6px 12px', borderRadius: 8, fontFamily: 'JetBrains Mono' }}>
                          {p.matricule || `PAT-${new Date(p.created_at || Date.now()).getFullYear()}-${String(p.patient_seq || 0).padStart(4, '0')}`}
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
                      {prelevementOnly ? (
                        <>
                          <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 13 }}>{p.type_prelevement || '—'}</span>
                          </td>
                          <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#475569', fontSize: 13 }}>
                            {p.date_prelevement ? new Date(p.date_prelevement).toLocaleDateString('fr-FR') : '—'}
                          </td>
                          <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
                              {p.localisation || '—'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontWeight: 700, color: '#334155', fontSize: 13 }}>{p.cancer_type || 'Diagnostic non précisé'}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>Wilaya : {p.wilaya || '—'}</div>
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
                        </>
                      )}
                      <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          {user?.role !== 'anapath' && (
                            <button onClick={(e) => openDeleteModal(e, p)} style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          )}
                          <button className="btn-icon-subtle" style={{ width: 36, height: 36 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                          </button>
                        </div>
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

          {/* PAGINATION */}
          {!loading && total > limit && (
            <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                Affichage de {((page - 1) * limit) + 1} à {Math.min(page * limit, total)} sur {total} patients
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-icon-subtle"
                  style={{ width: 36, height: 36, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', background: 'white', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>{page}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>/ {Math.ceil(total / limit)}</span>
                </div>
                <button
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-icon-subtle"
                  style={{ width: 36, height: 36, opacity: page >= Math.ceil(total / limit) ? 0.4 : 1, cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE SUPPRESSION ── */}
      {showDeleteModal && patientToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>

          <div style={{
            background: 'white', borderRadius: 16, width: 450, maxWidth: '90%',
            padding: 30, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#dc2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Gestion du dossier</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  Dossier de <strong>{patientToDelete.prenom} {patientToDelete.nom}</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => confirmDelete(false)}
                style={{
                  display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: 12,
                  background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>📂 Archiver le dossier</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>Retirer de la liste active sans supprimer les données.</span>
              </button>

              {isAdmin && (
                <button onClick={() => confirmDelete(true)}
                  style={{
                    display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: 12,
                    background: '#fff1f2', border: '1px solid #fecaca', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                  }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>🗑 Supprimer définitivement</span>
                  <span style={{ fontSize: 12, color: '#991b1b' }}>Action irréversible. Toutes les données seront effacées.</span>
                </button>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowDeleteModal(false); setPatientToDelete(null); }}
                style={{
                  padding: '10px 20px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0',
                  color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
