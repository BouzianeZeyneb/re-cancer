import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getPatients, deletePatient } from '../utils/api';
import toast from 'react-hot-toast';
import { format, differenceInYears, parseISO } from 'date-fns';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stadeFilter, setStadeFilter] = useState('');
  const navigate = useNavigate();

  const CANCER_TYPES = ["Sein", "Poumon", "Colorectal", "Prostate", "Estomac", "Foie", "Vessie", "Rein", "Lymphome", "Leucémie", "Autres"];
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
        // Détecter dynamiquement le délimiteur (virgule, point-virgule ou tabulation)
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
      const api = await import('../utils/api');
      
      for (const row of data) {
        const p = {};
        Object.entries(row).forEach(([k, v]) => {
          if (!v) return;
          const key = String(k).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Normaliser les accents
          if (key.includes('nom')) p.nom = v;
          if (key.includes('prenom')) p.prenom = v;
          if (key.includes('sexe') || key.includes('genre')) {
            const val = String(v).toUpperCase().trim();
            p.sexe = (val.startsWith('F') || val.includes('FEMME')) ? 'F' : 'M';
          }
          if (key.includes('nais') || key.includes('dob') || key.includes('birth')) {
            // Tenter de normaliser la date (DD/MM/YYYY ou DD-MM-YYYY vers YYYY-MM-DD)
            let val = String(v).trim();
            if (val.includes('/') || (val.includes('-') && val.split('-')[0].length < 4)) {
              const parts = val.split(/[/-]/);
              if (parts.length === 3) {
                // On assume DD/MM/YYYY
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
            await api.createPatient({ ...p, forceSave: true }); // On force l'importation en batch
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
        toast.error(`${duplicates} patients déjà existants (aucun ajout)`, { id: 'import', duration: 5000 });
      } else {
        toast.error('Aucun patient n\'a pu être importé. Vérifiez le format du fichier.', { id: 'import', duration: 5000 });
      }
      load();
    } catch (err) {
      console.error('Import global error:', err);
      toast.error('Erreur: ' + (err.message || 'Format de fichier non supporté'), { id: 'import' });
    }
    e.target.value = '';
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
    <Layout title="">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>Patients</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{total} patients trouvés</p>
        </div>
        <Link to="/patients/nouveau" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau Patient
        </Link>
      </div>

      <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: 16, 
          border: '1px solid #e2e8f0', 
          display: 'flex', 
          gap: 16, 
          alignItems: 'center',
          marginBottom: 24,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          flexWrap: 'wrap'
      }}>
          <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="form-control"
              style={{ paddingLeft: 48, background: '#f8fafc', border: 'none' }}
              placeholder="Rechercher par nom ou N° dossier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="dropdown-container">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImportFiles}
            />
            <button 
              className="btn btn-outline" 
              onClick={() => setShowImportOptions(!showImportOptions)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4, transform: showImportOptions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showImportOptions && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => triggerFileInput('xlsx')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Fichier Excel (.xlsx, .xls)
                </button>
                <button className="dropdown-item" onClick={() => triggerFileInput('csv')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M10 9H9h-1"/></svg>
                  Fichier CSV (.csv)
                </button>
                <button className="dropdown-item" onClick={() => triggerFileInput('txt')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                  Fichier Texte (.txt)
                </button>
              </div>
            )}
          </div>

            <select className="form-control" style={{ width: 180, background: '#f8fafc', border: 'none' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Tous les types</option>
              {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="form-control" style={{ width: 180, background: '#f8fafc', border: 'none' }} value={stadeFilter} onChange={e => setStadeFilter(e.target.value)}>
              <option value="">Tous les stades</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

      <div className="card" style={{ border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center" style={{ padding: 100 }}><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>N° Dossier</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>Patient</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>Cancer</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>Stade</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>Statut</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #e2e8f0' }}>Médecin</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer', transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px 24px', fontSize: 13, borderBottom: '1px solid #f1f5f9', color: '#0ea5e9', fontWeight: 600 }}>
                        ONC-2024-{String(p.id).padStart(3, '0')}
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{p.nom} {p.prenom}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{p.sexe === 'F' ? 'Femme' : 'Homme'} · {p.date_naissance}</div>
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: 14, color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                        {p.cancer_type || 'Sein'}
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b' }}>{p.stade || 'II'}</span>
                    </td>
                    <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <span className={`badge ${p.derniere_statut === 'Suivi' ? 'badge-green' : 'badge-blue'}`} style={{ borderRadius: 99, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
                            {p.derniere_statut || 'En traitement'}
                        </span>
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: 14, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                        Dr. {p.medecin || 'Khelifi'}
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
