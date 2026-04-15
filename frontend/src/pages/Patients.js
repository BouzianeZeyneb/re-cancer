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
  
  const fileInputRef = React.useRef(null);

  const handleImportFiles = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const extension = file.name.split('.').pop().toLowerCase();
    toast.loading('Importation en cours...', { id: 'import' });
    
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
        const delimiter = extension === 'csv' ? ',' : (text.includes('\t') ? '\t' : (text.includes(';') ? ';' : ','));
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        
        data = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim());
          const obj = {};
          headers.forEach((h, i) => obj[h] = values[i]);
          return obj;
        });
      }

      let count = 0;
      const api = await import('../utils/api');
      
      for (const row of data) {
        const p = {};
        Object.entries(row).forEach(([k, v]) => {
          const key = String(k).toLowerCase();
          if (key.includes('nom')) p.nom = v;
          if (key.includes('prenom') || key.includes('prénom')) p.prenom = v;
          if (key.includes('sexe') || key.includes('genre')) p.sexe = String(v).toUpperCase()[0] === 'F' ? 'F' : 'M';
          if (key.includes('nais') || key.includes('dob') || key.includes('birth')) p.date_naissance = v;
          if (key.includes('tel')) p.telephone = v;
          if (key.includes('carte') || key.includes('chifa') || key.includes('nss')) p.num_carte_nationale = v;
          if (key.includes('wilaya')) p.wilaya = v;
          if (key.includes('commune')) p.commune = v;
          if (key.includes('adresse')) p.adresse = v;
        });

        if (p.nom && p.prenom) {
          try {
            await api.createPatient(p);
            count++;
          } catch (err) { console.error('Row import error:', err); }
        }
      }
      
      toast.success(`${count} patients importés avec succès`, { id: 'import' });
      load();
    } catch (err) {
      console.error('Import global error:', err);
      toast.error('Erreur lors de l\'importation', { id: 'import' });
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
          
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".csv,.xlsx,.xls,.txt" 
              onChange={handleImportFiles}
            />
            <button 
              className="btn btn-outline" 
              onClick={() => fileInputRef.current.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importer (CSV/Excel/Txt)
            </button>

            <select className="form-control" style={{ width: 180, background: '#f8fafc', border: 'none' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Tous les types</option>
              {CANCER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="form-control" style={{ width: 180, background: '#f8fafc', border: 'none' }} value={stadeFilter} onChange={e => setStadeFilter(e.target.value)}>
              <option value="">Tous les stades</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
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
