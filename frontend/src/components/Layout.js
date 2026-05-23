import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

const NavItem = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const active = to ? location.pathname === to || location.pathname.startsWith(to + '/') : false;

  if (onClick) {
    return (
      <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
      {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />}
    </Link>
  );
};

export default function Layout({ children, title }) {
  const { user, logout, isAdmin, isPharmacien } = useAuth();
  const isPharmacieRole = user?.role === 'pharmacie'; // Rôle pharmacie strict (pas pharmacien legacy)
  const isLaboratoireRole = user?.role === 'laboratoire'; // Rôle laboratoire restreint
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => setNotifications(res.data)).catch(console.error);
      const socket = io('http://localhost:5000');
      socket.emit('join_user', user.id);
      socket.on('new_notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        toast(notif.message, {
          icon: '🔔',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
      });
      return () => socket.disconnect();
    }
  }, [user]);

  const handleNotificationClick = async (notif) => {
    if (!notif.lu) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, lu: true } : n));
      } catch (e) { console.error(e); }
    }
    setShowNotifications(false);
    if (notif.lien) navigate(notif.lien);
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  // Global AI Chat logics
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([
    { sender: 'ia', text: "Bonjour ! Je suis l'Assistant IA OncoTrack. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, isAiTyping, isAiChatOpen]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMsgs(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const res = await api.post('/chat-ia', { message: userMsg.text });
      setChatMsgs(prev => [...prev, { sender: 'ia', text: res.data.reply }]);
    } catch (err) {
      setChatMsgs(prev => [...prev, { sender: 'ia', text: "Erreur de connexion au Cerveau IA." }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Déconnexion effectuée');
  };

  const initials = user ? `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}`.toUpperCase() : 'U';

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/patients')) return 'Patients';
    if (path.startsWith('/cas-cancer')) return 'Diagnostics';
    if (path.startsWith('/traitements')) return 'Traitements';
    if (path.startsWith('/statistiques')) return 'Analyses Statistiques';
    if (path.startsWith('/carte-sig')) return 'Cartographie SIG';
    return title || 'OncoTrack';
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <h1>OncoTrack</h1>
            <span>Oncology Registry</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* ════════════════════════════════════════
               Sidebar PHARMACIE — accès restreint
              ════════════════════════════════════════ */}
          {isPharmacieRole ? (
            <>
              <div className="nav-section-title">PATIENTS</div>
              <NavItem
                to="/patients"
                label="Patients & Traitements"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  </svg>
                }
              />
              <div className="nav-section-title">PHARMACIE & STOCKS</div>
              <NavItem
                to="/pharmacie"
                label="Pharmacie & Stocks"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                    <path d="m8.5 8.5 7 7" />
                  </svg>
                }
              />
              <div className="nav-section-title">SYSTÈME</div>
              <NavItem
                to="/audit"
                label="Traçabilité"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="12 8 12 12 15 15" />
                  </svg>
                }
              />
            </>
          ) : isLaboratoireRole ? (
            /* ════════════════════════════════════════
                Sidebar LABORATOIRE — accès restreint
               ════════════════════════════════════════ */
            <>
              <div className="nav-section-title">PRINCIPAL</div>
              <NavItem
                to="/patients"
                label="Patients"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  </svg>
                }
              />
              <div className="nav-section-title">MODULES</div>
              <NavItem
                to="/analyses-biologie"
                label="Analyses Biologie"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" />
                    <polyline points="8 3 8 8 3 8" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                }
              />
              <NavItem
                to="/laboratoire"
                label="Laboratoire"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2v7.51" />
                    <path d="M14 2v7.51" />
                    <path d="M2 22h20" />
                    <path d="M9 13.51h6" />
                    <path d="M4.53 13.51a3 3 0 0 0-2.53 3.53C2.26 19.34 3.73 21 5.61 21h12.78c1.88 0 3.35-1.66 3.61-3.96a3 3 0 0 0-2.53-3.53l-1.47-.2v-3.71A2.5 2.5 0 0 0 15.5 7H14V2H10v5H8.5a2.5 2.5 0 0 0-2.5 2.5v3.71l-1.47.2z" />
                  </svg>
                }
              />
            </>
          ) : (
            /* ════════════════════════════════════════
                Sidebar complète — ADMIN / autres rôles
               ════════════════════════════════════════ */
            <>
              <div className="nav-section-title">{t('sidebar.principal', 'PRINCIPAL')}</div>
              {(isAdmin || user?.role === 'medecin') && (
                <NavItem to="/" label={t('sidebar.dashboard', 'Dashboard')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>} />
              )}
              <NavItem to="/patients" label={t('sidebar.patients', 'Patients')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /></svg>} />
              <NavItem to="/cas-cancer" label="Diagnostics" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>} />

              <div className="nav-section-title">{t('sidebar.modules', 'MODULES')}</div>
              <NavItem to="/analyses-biologie" label="Analyses Biologie" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8" /><polyline points="8 3 8 8 3 8" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>} />
              <NavItem to="/laboratoire" label="Laboratoire" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.51" /><path d="M14 2v7.51" /><path d="M2 22h20" /><path d="M9 13.51h6" /><path d="M4.53 13.51a3 3 0 0 0-2.53 3.53C2.26 19.34 3.73 21 5.61 21h12.78c1.88 0 3.35-1.66 3.61-3.96a3 3 0 0 0-2.53-3.53l-1.47-.2v-3.71A2.5 2.5 0 0 0 15.5 7H14V2H10v5H8.5a2.5 2.5 0 0 0-2.5 2.5v3.71l-1.47.2z" /></svg>} />
              <NavItem to="/traitements" label="Traitements" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 9 3 3 3-3" /><path d="M13 18H5a2 2 0 0 1-2-2V6" /></svg>} />
              <NavItem to="/consultations" label="Consultations" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>} />

              {(isAdmin || isPharmacien) && (
                <NavItem to="/pharmacie" label="Pharmacie & Stocks" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>} />
              )}

              <div className="nav-section-title">{t('sidebar.systeme', 'SYSTÈME')}</div>
              {(isAdmin || user?.role === 'medecin') && (
                <>
                  <NavItem to="/rcp" label="Réunions RCP" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /></svg>} />
                  <NavItem to="/statistiques" label={t('sidebar.statistics', 'Statistiques')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>} />
                </>
              )}
              {isAdmin && (
                <>
                  <NavItem to="/carte-sig" label="Cartographie SIG" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>} />
                  <NavItem to="/utilisateurs" label="Utilisateurs" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
                  <NavItem to="/audit" label="Traçabilité" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="12 8 12 12 15 15" /></svg>} />
                  <NavItem to="/parametres" label={t('sidebar.settings', 'Paramètres')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33-1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>} />
                </>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={() => navigate('/parametres')}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.nom} {user?.prenom}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} className="btn-icon" style={{ border: 'none', background: 'transparent' }} title="Déconnexion">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {isAiChatOpen && <div className="modal-overlay" onClick={() => setIsAiChatOpen(false)} style={{ zIndex: 9998 }} />}
      <div
        style={{
          position: 'fixed', top: 0, right: isAiChatOpen ? 0 : '-420px',
          width: 400, height: '100vh', background: 'white',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.1)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          transition: 'right 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, fontFamily: 'Outfit' }}>Assistant OncoTrack</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>IA CLINIQUE CONTEXTUELLE</div>
          </div>
          <button onClick={() => setIsAiChatOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, width: 32, height: 32, borderRadius: '50%' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div
                style={{
                  padding: '12px 16px', borderRadius: 16,
                  background: m.sender === 'user' ? '#3b82f6' : 'white',
                  color: m.sender === 'user' ? 'white' : '#1e293b',
                  boxShadow: m.sender === 'ia' ? '0 2px 4px rgba(0,0,0,0.03)' : 'none',
                  border: m.sender === 'ia' ? '1px solid #e2e8f0' : 'none',
                  fontSize: 13.5, lineHeight: 1.6,
                  borderBottomRightRadius: m.sender === 'user' ? 2 : 16,
                  borderBottomLeftRadius: m.sender === 'ia' ? 2 : 16
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div style={{ alignSelf: 'flex-start', background: 'white', border: '1px solid #e2e8f0', padding: '12px 18px', borderRadius: 16, borderBottomLeftRadius: 2 }}>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: 20, background: 'white', borderTop: '1px solid #e2e8f0' }}>
          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 10 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Écrivez votre message..."
              className="form-control"
              style={{ flex: 1, borderRadius: 20, height: 44 }}
            />
            <button type="submit" disabled={isAiTyping || !chatInput.trim()} className="btn btn-primary" style={{ borderRadius: '50%', width: 44, height: 44, padding: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </button>
          </form>
        </div>
      </div>

      <main className={`main-content ${!isSidebarOpen ? 'expanded' : ''}`}>
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px' }}
              title="Toggle Sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <span>OncoTrack</span>
              <span>/</span>
              <span style={{ color: '#64748b' }}>{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              style={{ marginRight: 15, padding: '4px 8px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', outline: 'none', cursor: 'pointer' }}>
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden' }}>
              <button
                onClick={() => { const el = document.querySelector('.page'); el.style.zoom = Math.max(0.5, (parseFloat(el.style.zoom) || 1) - 0.1); }}
                style={{ border: 'none', background: 'transparent', padding: '4px 12px', cursor: 'pointer', fontSize: 16, color: '#64748b' }}
                title="Dézoomer la page"
              >
                -
              </button>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f4c81', minWidth: 20, textAlign: 'center' }}>A</span>
              <button
                onClick={() => { const el = document.querySelector('.page'); el.style.zoom = Math.min(2, (parseFloat(el.style.zoom) || 1) + 0.1); }}
                style={{ border: 'none', background: 'transparent', padding: '4px 12px', cursor: 'pointer', fontSize: 16, color: '#64748b' }}
                title="Zoomer la page"
              >
                +
              </button>
            </div>

            <button className="notification-btn" onClick={() => setIsAiChatOpen(true)} title="Assistant IA">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', border: '2px solid white' }} />
            </button>

            <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

            <div style={{ position: 'relative' }}>
              <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="dropdown-menu" style={{ width: 320, right: 0, padding: 0 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>Notifications</span>
                    <button onClick={markAllAsRead} style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Marquer tout lu</button>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune notification</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="dropdown-item" onClick={() => handleNotificationClick(n)} style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #f8fafc', padding: '12px 20px' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: n.lu ? '#64748b' : '#0f172a' }}>{n.titre}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="page">
          {children}
        </section>
      </main>

      {!isAiChatOpen && (
        <button
          onClick={() => setIsAiChatOpen(true)}
          style={{
            position: 'fixed', bottom: 32, right: 32,
            width: 56, height: 56, borderRadius: 28,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59,130,246,0.5)', border: 'none', cursor: 'pointer',
            zIndex: 9997, transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        </button>
      )}
    </div>
  );
}
