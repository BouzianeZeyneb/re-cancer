import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Accès autorisé');
      if (user.role === 'admin') navigate('/');
      else if (user.role === 'medecin') navigate('/patients');
      else if (user.role === 'laboratoire' || user.role === 'anapath') navigate('/cas-cancer');
      else navigate('/');
    } catch (err) {
      toast.error('Identifiants non reconnus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#020617', fontFamily: "'Outfit', sans-serif", overflow: 'hidden' }}>
      {/* ── Visual Panel (Left) ── */}
      <div style={{ flex: 1.2, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80 }}>
        {/* Abstract medical gradient background */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at 20% 30%, #1e40af 0%, transparent 50%), radial-gradient(circle at 80% 70%, #1e1b4b 0%, transparent 50%)', opacity: 0.4, filter: 'blur(80px)' }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 80 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(59,130,246,0.5)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>OncoTrack</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Excellence</div>
            </div>
          </div>

          <div style={{ maxWidth: 520, marginBottom: 60 }}>
            <h1 style={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
              L'intelligence au service de <span style={{ color: '#3b82f6' }}>l'oncologie</span>.
            </h1>
            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, fontWeight: 500 }}>
              Plateforme de nouvelle génération pour la gestion des registres du cancer et le suivi clinique haute-fidélité.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 24 }}>
              <div style={{ color: '#3b82f6', marginBottom: 12 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg></div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Standard ICD-O-3</div>
              <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>Codification clinique internationale rigoureuse.</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: 24 }}>
              <div style={{ color: '#3b82f6', marginBottom: 12 }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m11 20 2 2 4-4" /><path d="M7 4h10" /><path d="M10 10l-2 2 2 2" /><path d="M14 10l2 2-2 2" /></svg></div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Analytique SIG</div>
              <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>Cartographie dynamique des incidences cancéreuses.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Panel (Right) ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#020617' }}>
        <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255,255,255,0.05)', borderRadius: 32, padding: 48, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 8 }}>Connexion</h2>
              <p style={{ color: '#64748b', fontWeight: 600, fontSize: 14 }}>Identifiez-vous pour accéder à l'espace clinique.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Adresse Email Professional</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="medecin@oncotrack.dz"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 20px', color: 'white', fontSize: 14, fontWeight: 500, outline: 'none', transition: 'all 0.2s' }}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mot de passe</label>
                  <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 800, cursor: 'pointer' }}>Oublié ?</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 20px', color: 'white', fontSize: 14, fontWeight: 500, outline: 'none' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                    {showPassword ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontSize: 15, fontWeight: 900, border: 'none', cursor: 'pointer', marginTop: 12, boxShadow: '0 10px 20px -10px rgba(37,99,235,0.5)', transition: 'all 0.2s' }}
              >
                {loading ? 'AUTHENTIFICATION...' : 'DÉVERROUILLER L\'ESPÈCE'}
              </button>
            </form>

            <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Test Environments</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { role: 'Admin', email: 'admin@registre-cancer.dz', pw: 'Admin@2024' },
                  { role: 'Médecin', email: 'medecin@hospital.dz', pw: 'password123' },
                  { role: 'Anapath', email: 'anapath@hospital.dz', pw: 'password123' },
                  { role: 'Laboratoire', email: 'labo@hospital.dz', pw: 'password123' },
                  { role: 'Épidémiologiste', email: 'epidemio@registre-cancer.dz', pw: 'password123' },
                  { role: 'Statisticien', email: 'stats@registre-cancer.dz', pw: 'password123' },
                  { role: 'Pharmacien', email: 'pharmacie@hospital.dz', pw: 'password123' }
                ].map(acc => (
                  <div key={acc.email} onClick={() => setForm({ email: acc.email, password: acc.pw })} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6' }}>{acc.role}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{acc.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
