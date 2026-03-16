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
    <div className="login-page-v2">
      <div className="login-split-card">
        {/* Left Side: Form */}
        <div className="login-form-section">
          <div className="login-form-content">
            <h2 className="login-title">Connexion</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group-minimal">
                <input
                  type="email"
                  className="form-control-minimal"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group-minimal" style={{ marginBottom: '24px' }}>
                <input
                  type="password"
                  className="form-control-minimal"
                  placeholder="Mot de passe"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn-login-submit" 
                disabled={loading}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Info */}
        <div className="login-info-section">
          <div className="login-info-content">
            <h1>Registre de Cancer</h1>
            <p>
              Système de gestion des patients<br />
              et statistiques du cancer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
