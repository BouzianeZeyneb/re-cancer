import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user } = useAuth();
  const [parametres, setParametres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ categorie: 'cancer', valeur: '', code: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const categories = [
    { value: 'cancer', label: 'Types de Cancer' },
    { value: 'localite', label: 'Localités' },
    { value: 'antecedent', label: 'Antécédents' },
    { value: 'comorbidite', label: 'Comorbidités' },
    { value: 'effet_indesirable', label: 'Effets Indésirables' }
  ];

  const fetchParametres = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/parametres', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setParametres(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParametres();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/parametres/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Paramètre mis à jour');
      } else {
        await axios.post('/api/parametres', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Paramètre ajouté');
      }
      setFormData({ categorie: 'cancer', valeur: '', code: '' });
      setShowForm(false);
      setEditingId(null);
      fetchParametres();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (p) => {
    setFormData({ categorie: p.categorie, valeur: p.valeur, code: p.code || '' });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce paramètre ?')) {
      try {
        await axios.delete(`/api/parametres/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Paramètre supprimé');
        fetchParametres();
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getCategoryLabel = (cat) => categories.find(c => c.value === cat)?.label || cat;

  return (
    <Layout title="Paramètres Systèmes">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Gestion des listes dynamiques</h2>
          <button className="btn-primary" onClick={() => {
            setFormData({ categorie: 'cancer', valeur: '', code: '' });
            setEditingId(null);
            setShowForm(!showForm);
          }}>
            {showForm ? 'Annuler' : '+ Nouveau Paramètre'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div className="form-group">
              <label>Catégorie</label>
              <select 
                value={formData.categorie} 
                onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                disabled={!!editingId}
                required
              >
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Valeur / Nom</label>
              <input 
                type="text" 
                value={formData.valeur} 
                onChange={(e) => setFormData({...formData, valeur: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Code (Optionnel)</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-primary">Enregistrer</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Nom / Valeur</th>
                  <th>Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parametres.map(p => (
                  <tr key={p.id}>
                    <td><span className="badge" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>{getCategoryLabel(p.categorie)}</span></td>
                    <td>{p.valeur}</td>
                    <td>{p.code || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => handleEdit(p)}>✏️</button>
                        <button className="btn-icon" onClick={() => handleDelete(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {parametres.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Aucun paramètre configuré.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
