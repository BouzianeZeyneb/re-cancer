import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { io } from 'socket.io-client';

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
    </Link>
  );
};

export default function Layout({ children, title }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => setNotifications(res.data)).catch(console.error);
      const socket = io('http://localhost:5000');
      socket.emit('join_user', user.id);
      socket.on('new_notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        toast(notif.message, { icon: '🔔' });
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
      setNotifications(prev => prev.map(n => ({...n, lu: true})));
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  // Global AI Chat logics
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([
    { sender: 'ia', text: "Bonjour ! Je suis l'Assistant IA du Registre (Normes SEER & ICD-O-3). Posez-moi des questions sur les zones (SIG), les statistiques ou l'abstraction des dossiers." }
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
    toast.success('Déconnexion réussie');
  };

  const initials = user ? `${user.nom[0]}${user.prenom[0]}`.toUpperCase() : 'U';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: '#0EA5E9', borderRadius: '12px', boxShadow: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div className="sidebar-logo-text">
            <h1>OncoTrack</h1>
            <span>Système Oncologique</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">PRINCIPAL</div>
          <NavItem to="/" label="Dashboard" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>} />
          <NavItem to="/patients" label="Patients" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>} />
          <NavItem to="/cas-cancer" label="Diagnostics" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>} />

          <div className="nav-section-title">MODULES</div>
          <NavItem to="/cas-cancer" label="Anapath" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><path d="M2 12h20"/></svg>} />
          <NavItem to="/labo" label="Laboratoire" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.51"/><path d="M14 2v7.51"/><path d="M2 22h20"/><path d="M9 13.51h6"/><path d="M4.53 13.51a3 3 0 0 0-2.53 3.53C2.26 19.34 3.73 21 5.61 21h12.78c1.88 0 3.35-1.66 3.61-3.96a3 3 0 0 0-2.53-3.53l-1.47-.2v-3.71A2.5 2.5 0 0 0 15.5 7H14V2H10v5H8.5a2.5 2.5 0 0 0-2.5 2.5v3.71l-1.47.2z"/></svg>} />
          <NavItem to="/cas-cancer" label="Imagerie" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} />
          <NavItem to="/traitements" label="Traitements" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 9 3 3 3-3"/><path d="M13 18H5a2 2 0 0 1-2-2V6"/><path d="m22 15-3-3-3 3"/><path d="M11 6h8a2 2 0 0 1 2 2v10"/></svg>} />
          <NavItem to="/consultations" label="Consultations" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>} />

          <div className="nav-section-title">SYSTÈME</div>
          <NavItem to="/rcp" label="Réunions RCP" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>} />
          <NavItem to="/statistiques" label="Statistiques" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>} />
          {isAdmin && (
            <>
              <NavItem to="/carte-sig" label="Carte SIG" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>} />
              <NavItem to="/utilisateurs" label="Utilisateurs" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
              <NavItem to="/parametres" label="Paramètres" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>} />
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.nom} {user?.prenom}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="btn-icon" title="Déconnexion">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* --- GLOBAL AI CHAT DRAWER --- */}
      {isAiChatOpen && <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9998 }} onClick={() => setIsAiChatOpen(false)} />}
      <div style={{ position: 'fixed', top: 0, right: isAiChatOpen ? 0 : '-400px', width: 380, height: '100vh', background: 'white', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', zIndex: 9999, display: 'flex', flexDirection: 'column', transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Assistant IA Global</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>SEER & ICD-O-3 v3.2</div>
            </div>
          </div>
          <button onClick={() => setIsAiChatOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: '#f8fafc' }}>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>Aujourd'hui, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              {m.sender === 'ia' && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, marginLeft: 4 }}>Cancer AI</div>}
              <div style={{ padding: '10px 14px', borderRadius: 16, background: m.sender === 'user' ? '#0f4c81' : 'white', color: m.sender === 'user' ? 'white' : '#1e293b', border: m.sender === 'ia' ? '1px solid #e2e8f0' : 'none', fontSize: 13, lineHeight: 1.5, borderTopRightRadius: m.sender === 'user' ? 4 : 16, borderTopLeftRadius: m.sender === 'ia' ? 4 : 16 }}>
                {m.text}
              </div>
            </div>
          ))}
          {isAiTyping && (
             <div style={{ alignSelf: 'flex-start', background: 'white', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: 16, borderTopLeftRadius: 4 }}>
               <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#7c3aed', borderRightColor: 'transparent' }} />
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: 16, background: 'white', borderTop: '1px solid #e2e8f0' }}>
          <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 10 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Posez une question (SIG, patients...)" className="form-control" style={{ flex: 1, borderRadius: 20, fontSize: 13 }} />
            <button type="submit" disabled={isAiTyping || !chatInput.trim()} className="btn btn-primary" style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#7c3aed', border: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </div>
      {/* --- END GLOBAL AI CHAT --- */}

      <main className="main-content">
        <div className="topbar">
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">
            
            {/* Global UI Zoom Controls */}
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

            <button className="notification-btn" onClick={() => setIsAiChatOpen(true)} style={{ position: 'relative', marginRight: 15 }} title="Discuter avec l'IA du Registre">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span className="notification-badge" style={{ background: '#7c3aed', right: -5, top: -5 }}>IA</span>
            </button>

            <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 01-3.46 0"></path></svg>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                     <button className="btn-icon" style={{ padding: '2px 8px', fontSize: 11 }} onClick={markAllAsRead}>Tout marquer lu</button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">Aucune notification</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notification-item ${!n.lu ? 'unread' : ''}`} onClick={() => handleNotificationClick(n)}>
                        <div className="notification-item-title">{n.titre}</div>
                        <div className="notification-item-msg">{n.message}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="page">
          {children}
        </div>
      </main>
    </div>
  );
}
