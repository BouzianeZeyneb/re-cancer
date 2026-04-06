import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Connexion réussie');
      
      if (user.role === 'admin') navigate('/');
      else if (user.role === 'medecin') navigate('/patients');
      else if (user.role === 'laboratoire' || user.role === 'anapath') navigate('/cas-cancer');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-v2" style={{ backgroundColor: '#F0F4F8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '400px', maxWidth: '95%', border: '1px solid #E2E8F0' }}>
        <h2 style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '24px', fontWeight: '700', color: '#1F2937', marginBottom: '8px', textAlign: 'center' }}>Registre du Cancer</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px', textAlign: 'center' }}>Veuillez vous authentifier pour accéder au système.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Adresse Email</label>
            <input
              type="email"
              style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '15px' }}
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Mot de passe</label>
            <input
              type="password"
              style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '15px' }}
              placeholder="Mot de passe"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button 
            type="submit" 
            style={{ width: '100%', padding: '12px', backgroundColor: '#0056D2', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
