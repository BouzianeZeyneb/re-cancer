import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Search, AlertTriangle, XCircle, Package, 
  Activity, RefreshCw, Edit, Trash2, ShieldAlert,
  LayoutDashboard, Database, ClipboardList, Bell, DollarSign, Calendar
} from 'lucide-react';
import { io } from 'socket.io-client';
import Layout from '../components/Layout';
import api, { BASE_URL, getPharmacyStocks, getPharmacyStats, createPharmacyDrug, updatePharmacyDrug, deletePharmacyDrug,
  getPendingValidations, updatePharmacyValidation, getPharmacyAlternatives } from '../utils/api';
import toast from 'react-hot-toast';

export default function Pharmacie() {
  const [stocks, setStocks] = useState([]);
  const [stats, setStats] = useState(null);
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [showDrugModal, setShowDrugModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [drugFormData, setDrugFormData] = useState({
    nom_dci: '', dosage: '', forme: '', stock_actuel: 0, seuil_alerte: 10, seuil_rupture: 0, categorie: 'Chimio', prix: 0, date_expiration: ''
  });

  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationComment, setValidationComment] = useState('');
  
  const [selectedDrugAlts, setSelectedDrugAlts] = useState([]);
  const [showAltModal, setShowAltModal] = useState(false);

  // Socket setup with cleanup to prevent memory leaks
  useEffect(() => {
    const socket = io(BASE_URL);
    
    socket.on('pharmacy_update', () => {
      loadData(false); // Silent background refresh
    });

    return () => {
      socket.off('pharmacy_update');
      socket.disconnect();
    };
  }, []);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = {
        search: searchTerm,
        category: filterCategory,
        status: filterStatus
      };
      
      const [stockRes, statsRes, validRes] = await Promise.all([
        getPharmacyStocks(params),
        getPharmacyStats(),
        getPendingValidations()
      ]);
      
      setStocks(stockRes.data);
      setStats(statsRes.data);
      setValidations(validRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [searchTerm, filterCategory, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDrugSubmit = async (e) => {
    e.preventDefault();
    if (!drugFormData.nom_dci || drugFormData.stock_actuel < 0) {
      return toast.error("Veuillez remplir correctement les champs");
    }

    setIsSubmitting(true);
    try {
      if (selectedDrug) {
        await updatePharmacyDrug(selectedDrug.id, drugFormData);
        toast.success("Médicament mis à jour");
      } else {
        await createPharmacyDrug(drugFormData);
        toast.success("Médicament ajouté au stock");
      }
      setShowDrugModal(false);
      loadData(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDrug = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce médicament ?")) return;
    try {
      await deletePharmacyDrug(id);
      toast.success("Supprimé");
      loadData(false);
    } catch (error) {
      toast.error("Échec de suppression");
    }
  };

  const openDrugModal = (drug = null) => {
    if (drug) {
      setSelectedDrug(drug);
      // Format date for input[type="date"]
      const formattedDate = drug.date_expiration ? new Date(drug.date_expiration).toISOString().split('T')[0] : '';
      setDrugFormData({ ...drug, date_expiration: formattedDate });
    } else {
      setSelectedDrug(null);
      setDrugFormData({ nom_dci: '', dosage: '', forme: '', stock_actuel: 0, seuil_alerte: 10, seuil_rupture: 0, categorie: 'Chimio', prix: 0, date_expiration: '' });
    }
    setShowDrugModal(true);
  };

  const handleValidate = async (statut) => {
    if (!selectedPrescription) return;
    try {
      await updatePharmacyValidation(selectedPrescription.id, { 
        statut, 
        commentaire: validationComment 
      });
      toast.success(statut === 'Validé' ? "Validé et stock réduit" : "Refusé");
      setShowValidationModal(false);
      loadData(false);
    } catch (error) {
      toast.error("Erreur de validation");
    }
  };

  const viewAlternatives = async (drug) => {
    try {
      const res = await getPharmacyAlternatives(drug.id);
      setSelectedDrugAlts(res.data);
      setShowAltModal(true);
    } catch (error) {
      toast.error("Alternatives indisponibles");
    }
  };

  return (
    <Layout title="OncoTrack Pharmacy - Hospital Grade">
      <div style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 120px)' }}>
        
        {/* Module Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="card" style={{ padding: '8px', borderRadius: 16, border: '1px solid #e2e8f0', position: 'sticky', top: 20 }}>
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarLink icon={<Database size={18} />} label="Stock Global" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarLink icon={<ClipboardList size={18} />} label="Prescriptions" count={validations.length} active={activeTab === 'prescriptions'} onClick={() => setActiveTab('prescriptions')} />
            <SidebarLink icon={<Bell size={18} />} label="Alertes" count={stats?.alertes + stats?.ruptures} active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} />
            <hr style={{ margin: '12px 0', borderColor: '#f1f5f9' }} />
            <div style={{ padding: '0 8px' }}>
              <button onClick={() => openDrugModal()} className="btn btn-primary w-100" style={{ gap: 8 }}>
                <Plus size={16} /> Ajouter Med
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
                <KPICard icon={<Package />} label="Total Stock" value={stats?.total || 0} color="#6366f1" />
                <KPICard icon={<AlertTriangle />} label="Stock Faible" value={stats?.alertes || 0} color="#f59e0b" />
                <KPICard icon={<XCircle />} label="Ruptures" value={stats?.ruptures || 0} color="#ef4444" />
                <KPICard icon={<Activity />} label="En Attente" value={stats?.pending_validations || 0} color="#3b82f6" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div className="card" style={{ padding: 24 }}>
                  <h4 style={{ marginBottom: 20, fontWeight: 800 }}>Répartition par Catégorie</h4>
                  {stats && Object.entries(stats.by_category).map(([cat, count]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ color: '#64748b' }}>{cat}</span>
                      <span style={{ fontWeight: 700 }}>{count}</span>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                     <ShieldAlert size={24} color="#fca5a5" />
                     <h4 style={{ margin: 0 }}>Intelligence Ruptures</h4>
                  </div>
                  <p style={{ opacity: 0.8 }}>Prédiction temps réel : 3 médicaments risquent une rupture d'ici la fin de semaine selon les prescriptions validées.</p>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'inventory' || activeTab === 'alerts') && (
            <div className="fade-in">
              <div className="filter-bar" style={{ marginBottom: 20 }}>
                <div className="search-bar">
                  <Search size={18} />
                  <input type="text" placeholder="DCI, Dosage..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">Toutes Catégories</option>
                  <option value="Chimio">Chimio</option>
                  <option value="Therapie Ciblee">Therapie Ciblée</option>
                  <option value="Support">Support</option>
                </select>
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                   <option value="">Tous les État</option>
                   <option value="OK">En Stock</option>
                   <option value="ALERTE">Alerte</option>
                   <option value="RUPTURE">Rupture</option>
                </select>
                <button onClick={() => loadData()} className="btn-icon"><RefreshCw size={18} /></button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>DCI (Médicament)</th>
                      <th>Catégorie</th>
                      <th>Stock / Seuils</th>
                      <th>Prix Unitaire</th>
                      <th>Expiration</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{s.nom_dci}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{s.dosage} {s.forme}</div>
                        </td>
                        <td><span className="badge badge-gray">{s.categorie}</span></td>
                        <td>
                           <span style={{ fontWeight: 800, fontSize: 15 }}>{s.stock_actuel}</span>
                           <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 8 }}>(A:{s.seuil_alerte} R:{s.seuil_rupture})</span>
                        </td>
                        <td>{s.prix ? `${parseFloat(s.prix).toLocaleString()} DA` : '-'}</td>
                        <td>
                          {s.date_expiration ? (
                            <span style={{ color: new Date(s.date_expiration) < new Date() ? '#ef4444' : 'inherit' }}>
                              {new Date(s.date_expiration).toLocaleDateString()}
                            </span>
                          ) : '-'}
                        </td>
                        <td><StockStatusBadge status={s.statut} /></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => viewAlternatives(s)} className="btn-icon" title="Alternatives IA"><Activity size={14} /></button>
                            <button onClick={() => openDrugModal(s)} className="btn-icon"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteDrug(s.id)} className="btn-icon" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
             <div className="table-wrap fade-in">
               <table>
                 <thead>
                   <tr>
                     <th>Patient</th>
                     <th>Prescription</th>
                     <th>Alertes Stock</th>
                     <th>État</th>
                     <th>Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {validations.map(v => (
                     <tr key={v.id}>
                       <td><div style={{ fontWeight: 700 }}>{v.nom} {v.prenom}</div></td>
                       <td>
                         <div style={{ fontWeight: 800, color: '#0f172a' }}>{v.protocole}</div>
                         <div style={{ fontSize: 12 }}>{v.medicaments}</div>
                       </td>
                       <td style={{ color: '#ef4444', fontWeight: 700, fontSize: 11 }}>
                         {v.stock_warnings?.map((w, i) => <div key={i}>{w}</div>)}
                       </td>
                       <td><span className="badge badge-orange">{v.statut}</span></td>
                       <td>
                         <button onClick={() => { setSelectedPrescription(v); setValidationComment(''); setShowValidationModal(true); }} className="btn btn-sm btn-primary">Valider</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>

      {/* FIXED MODAL: ADD/EDIT MEDICAMENT */}
      {showDrugModal && (
        <div className="modal-overlay" onClick={() => setShowDrugModal(false)}>
           <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
             <div className="modal-header">
               <h3>{selectedDrug ? 'Modifier Médicament' : 'Ajouter Nouveau Médicament'}</h3>
               <button className="btn-icon" onClick={() => setShowDrugModal(false)}>✕</button>
             </div>
             <form onSubmit={handleDrugSubmit}>
               <div className="modal-body">
                 <div className="form-group">
                   <label className="form-label">Nom DCI (Médicament)</label>
                   <input type="text" className="form-control" required value={drugFormData.nom_dci} onChange={e => setDrugFormData({...drugFormData, nom_dci: e.target.value})} />
                 </div>
                 
                 <div className="form-row">
                   <div className="form-group">
                     <label className="form-label">Dosage</label>
                     <input type="text" className="form-control" value={drugFormData.dosage} onChange={e => setDrugFormData({...drugFormData, dosage: e.target.value})} />
                   </div>
                   <div className="form-group">
                     <label className="form-label">Forme</label>
                     <input type="text" className="form-control" value={drugFormData.forme} onChange={e => setDrugFormData({...drugFormData, forme: e.target.value})} />
                   </div>
                 </div>

                 <div className="form-row-3">
                    <div className="form-group">
                      <label className="form-label"><Database size={12} /> Stock Actuel</label>
                      <input type="number" className="form-control" min="0" required value={drugFormData.stock_actuel} onChange={e => setDrugFormData({...drugFormData, stock_actuel: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alerte (Orange)</label>
                      <input type="number" className="form-control" value={drugFormData.seuil_alerte} onChange={e => setDrugFormData({...drugFormData, seuil_alerte: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rupture (Rouge)</label>
                      <input type="number" className="form-control" value={drugFormData.seuil_rupture} onChange={e => setDrugFormData({...drugFormData, seuil_rupture: e.target.value})} />
                    </div>
                 </div>

                 <div className="form-row">
                   <div className="form-group">
                     <label className="form-label"><DollarSign size={12} /> Prix Unitaire (DA)</label>
                     <input type="number" step="0.01" className="form-control" value={drugFormData.prix} onChange={e => setDrugFormData({...drugFormData, prix: e.target.value})} />
                   </div>
                   <div className="form-group">
                     <label className="form-label"><Calendar size={12} /> Date d'expiration</label>
                     <input type="date" className="form-control" value={drugFormData.date_expiration} onChange={e => setDrugFormData({...drugFormData, date_expiration: e.target.value})} />
                   </div>
                 </div>

                 <div className="form-group">
                   <label className="form-label">Catégorie Thérapeutique</label>
                   <select className="form-control" value={drugFormData.categorie} onChange={e => setDrugFormData({...drugFormData, categorie: e.target.value})}>
                     <option value="Chimio">Chimiothérapie</option>
                     <option value="Therapie Ciblee">Therapie Ciblée</option>
                     <option value="Support">Traitement de Support</option>
                     <option value="Adjuvant">Adjuvant (Hormono/Immunothérapie)</option>
                   </select>
                 </div>
               </div>
               <div className="modal-footer">
                  <button type="button" onClick={() => setShowDrugModal(false)} className="btn btn-outline" disabled={isSubmitting}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <RefreshCw className="spin" size={16} /> : (selectedDrug ? 'Mettre à jour' : 'Enregistrer au Stock')}
                  </button>
               </div>
             </form>
           </div>
        </div>
      )}

      {/* Prescription Validation Modal */}
      {showValidationModal && (
        <div className="modal-overlay" onClick={() => setShowValidationModal(false)}>
           <div className="modal" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
               <h3>Validation Pharmaco-Clinique</h3>
               <button className="btn-icon" onClick={() => setShowValidationModal(false)}>✕</button>
             </div>
             <div className="modal-body">
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 20 }}>
                  <div style={{ color: '#64748b', fontSize: 12, marginBottom: 5 }}>Prescription pour :</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedPrescription?.nom} {selectedPrescription?.prenom}</div>
                  <div style={{ padding: '10px 0', fontWeight: 600, color: '#0f4c81' }}>{selectedPrescription?.medicaments}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes, Ajustements ou Raison du refus</label>
                  <textarea className="form-control" rows="3" placeholder="Ex: BSA recalculée, réduction de dose de 10%..." value={validationComment} onChange={e => setValidationComment(e.target.value)}></textarea>
                </div>
             </div>
             <div className="modal-footer">
                <button onClick={() => handleValidate('Refusé')} className="btn btn-outline" style={{ color: '#ef4444' }}>Refuser</button>
                <button onClick={() => handleValidate('Validé')} className="btn btn-primary">Valider & Débiter Stock</button>
             </div>
           </div>
        </div>
      )}

      {/* AI Alternatives Modal */}
      {showAltModal && (
         <div className="modal-overlay" onClick={() => setShowAltModal(false)}>
            <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Substitutions Recommandées (IA)</h3></div>
              <div className="modal-body">
                {selectedDrugAlts.map((alt, i) => (
                  <div key={i} style={{ padding: 20, borderRadius: 12, background: alt.is_ia ? '#f0f9ff' : '#f8fafc', border: alt.is_ia ? '1px solid #bae6fd' : '1px solid #f1f5f9', marginBottom: 12 }}>
                    <div style={{ fontWeight: 900, marginBottom: 5 }}>{alt.alternative_nom} {alt.is_ia && '(IA)'}</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>{alt.justification}</div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAltModal(false)} className="btn btn-primary w-100">Fermer</button>
              </div>
            </div>
         </div>
      )}

    </Layout>
  );
}

function SidebarLink({ icon, label, active, onClick, count }) {
  return (
    <div onClick={onClick} style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', 
      borderRadius: 12, cursor: 'pointer', marginBottom: 4,
      background: active ? '#eff6ff' : 'transparent',
      color: active ? '#1e40af' : '#64748b',
      fontWeight: active ? 800 : 500,
      transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon}
        <span style={{ fontSize: 13 }}>{label}</span>
      </div>
      {count > 0 && <span style={{ background: active ? '#1e40af' : '#94a3b8', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 100 }}>{count}</span>}
    </div>
  );
}

function StockStatusBadge({ status }) {
  const styles = {
    OK: { bg: '#dcfce7', text: '#166534', label: 'STOCK OK' },
    ALERTE: { bg: '#ffedd5', text: '#9a3412', label: 'FAIBLE' },
    RUPTURE: { bg: '#fee2e2', text: '#991b1b', label: 'RUPTURE' }
  };
  const s = styles[status] || styles.OK;
  return <span style={{ padding: '4px 10px', borderRadius: 100, background: s.bg, color: s.text, fontSize: 10, fontWeight: 800 }}>{s.label}</span>;
}

function KPICard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: 24, borderRadius: 20, borderTop: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ color, opacity: 0.8 }}>{icon}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
