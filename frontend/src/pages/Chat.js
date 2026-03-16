import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const roleLabel = { admin: 'Admin', medecin: 'Médecin', laboratoire: 'Laboratoire', epidemiologie: 'Épidémiologie' };
const roleColor = { admin: '#e63946', medecin: '#0f4c81', laboratoire: '#7c3aed', epidemiologie: '#2d6a4f' };

export default function Chat() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const token = localStorage.getItem('token');

  // Init socket
  useEffect(() => {
    const s = io(SOCKET_URL);
    s.on('connect', () => {
      s.emit('join', user.id);
    });
    s.on('users_online', (ids) => setOnlineUsers(ids));
    s.on('new_message', (data) => {
      if (data.conversation_id === activeConv?.id) {
        setMessages(prev => [...prev, data.message]);
      }
      loadConversations();
    });
    s.on('user_typing', ({ sender_id }) => {
      if (activeUser?.id === sender_id) setIsTyping(true);
    });
    s.on('user_stop_typing', ({ sender_id }) => {
      if (activeUser?.id === sender_id) setIsTyping(false);
    });
    setSocket(s);
    return () => s.disconnect();
  }, [user.id]);

  // Update socket listeners when activeConv or activeUser changes
  useEffect(() => {
    if (!socket) return;
    socket.off('new_message');
    socket.on('new_message', (data) => {
      if (activeConv && data.conversation_id === activeConv.id) {
        setMessages(prev => [...prev, data.message]);
        scrollBottom();
      }
      loadConversations();
    });
    socket.off('user_typing');
    socket.on('user_typing', ({ sender_id }) => {
      if (activeUser && activeUser.id === sender_id) setIsTyping(true);
    });
    socket.off('user_stop_typing');
    socket.on('user_stop_typing', ({ sender_id }) => {
      if (activeUser && activeUser.id === sender_id) setIsTyping(false);
    });
  }, [socket, activeConv, activeUser]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      setConversations(res.data);
    } catch (e) {}
  }, [token]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/chat/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (e) {}
  }, [token]);

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, [loadConversations, loadUsers]);

  const scrollBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openConversation = async (targetUser) => {
    try {
      const res = await axios.get(`${API}/chat/conversation/${targetUser.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setActiveConv(res.data);
      setActiveUser(targetUser);
      const msgs = await axios.get(`${API}/chat/messages/${res.data.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(msgs.data);
      loadConversations();
      scrollBottom();
    } catch (e) {
      toast.error('Erreur lors de l\'ouverture de la conversation');
    }
  };

  const sendText = async () => {
    if (!text.trim() || !activeConv) return;
    const msgContent = text.trim();
    setText('');
    try {
      const res = await axios.post(`${API}/chat/messages`, {
        conversation_id: activeConv.id,
        content: msgContent,
        type: 'text'
      }, { headers: { Authorization: `Bearer ${token}` } });

      const newMsg = res.data;
      setMessages(prev => [...prev, newMsg]);
      scrollBottom();

      socket?.emit('send_message', {
        conversation_id: activeConv.id,
        receiver_id: activeUser.id,
        message: newMsg
      });
      socket?.emit('stop_typing', { sender_id: user.id, receiver_id: activeUser.id });
      loadConversations();
    } catch (e) {
      toast.error('Erreur envoi message');
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !activeUser) return;
    socket.emit('typing', { sender_id: user.id, receiver_id: activeUser.id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { sender_id: user.id, receiver_id: activeUser.id });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result;
          try {
            const res = await axios.post(`${API}/chat/messages`, {
              conversation_id: activeConv.id,
              type: 'audio',
              audio_data: base64,
              content: '🎤 Message vocal'
            }, { headers: { Authorization: `Bearer ${token}` } });

            const newMsg = res.data;
            setMessages(prev => [...prev, newMsg]);
            scrollBottom();
            socket?.emit('send_message', {
              conversation_id: activeConv.id,
              receiver_id: activeUser.id,
              message: newMsg
            });
            loadConversations();
          } catch (e) {
            toast.error('Erreur envoi audio');
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch (e) {
      toast.error('Microphone non accessible');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

  const getOtherUser = (conv) => {
    if (conv.user1_id === user.id) return { id: conv.user2_id, nom: conv.user2_nom, prenom: conv.user2_prenom, role: conv.user2_role };
    return { id: conv.user1_id, nom: conv.user1_nom, prenom: conv.user1_prenom, role: conv.user1_role };
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout title="Messagerie">
      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 120px)', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

        {/* Sidebar */}
        <div style={{ width: 300, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>💬 Messagerie</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>NOUVELLE CONVERSATION</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {users.map(u => (
                <button key={u.id} onClick={() => openConversation(u)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 8, border: '1px solid #e2e8f0', background: 'white',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4f8'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: roleColor[u.role] || '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
                    }}>{u.nom[0]}{u.prenom[0]}</div>
                    {isOnline(u.id) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dr. {u.prenom} {u.nom}</div>
                    <div style={{ fontSize: 11, color: roleColor[u.role] || '#64748b' }}>{roleLabel[u.role]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent conversations */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, padding: '0 4px' }}>Conversations récentes</div>
            {conversations.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>Aucune conversation</div>
            )}
            {conversations.map(conv => {
              const other = getOtherUser(conv);
              const isActive = activeConv?.id === conv.id;
              return (
                <button key={conv.id} onClick={() => openConversation(other)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 8, border: 'none', width: '100%', textAlign: 'left',
                  background: isActive ? '#dbeafe' : 'transparent', cursor: 'pointer',
                  marginBottom: 4, transition: 'all 0.15s'
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: roleColor[other.role] || '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: 'white'
                    }}>{other.nom[0]}{other.prenom[0]}</div>
                    {isOnline(other.id) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{other.prenom} {other.nom}</div>
                      {conv.last_message_time && <div style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{formatTime(conv.last_message_time)}</div>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        {conv.last_message_type === 'audio' ? '🎤 Message vocal' : conv.last_message || 'Démarrer la conversation'}
                      </div>
                      {conv.unread_count > 0 && (
                        <div style={{ background: '#0f4c81', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        {!activeConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Sélectionnez une conversation</div>
            <div style={{ fontSize: 14 }}>Choisissez un médecin pour commencer à échanger</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: roleColor[activeUser?.role] || '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'white'
                }}>{activeUser?.nom[0]}{activeUser?.prenom[0]}</div>
                {isOnline(activeUser?.id) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Dr. {activeUser?.prenom} {activeUser?.nom}</div>
                <div style={{ fontSize: 12, color: isOnline(activeUser?.id) ? '#22c55e' : '#94a3b8' }}>
                  {isOnline(activeUser?.id) ? '● En ligne' : '○ Hors ligne'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8, background: '#fafbfc' }}>
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: roleColor[msg.role] || '#64748b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'white', marginRight: 8, flexShrink: 0, alignSelf: 'flex-end'
                      }}>{msg.nom?.[0]}{msg.prenom?.[0]}</div>
                    )}
                    <div style={{ maxWidth: '65%' }}>
                      {!isMe && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3, fontWeight: 600 }}>Dr. {msg.prenom} {msg.nom}</div>}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMe ? '#0f4c81' : 'white',
                        color: isMe ? 'white' : '#0f172a',
                        fontSize: 13.5,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        border: isMe ? 'none' : '1px solid #e2e8f0'
                      }}>
                        {msg.type === 'audio' ? (
                          <div>
                            <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.8 }}>🎤 Message vocal</div>
                            <audio controls src={msg.audio_data} style={{ height: 32, width: 200 }} />
                          </div>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>Dr. {activeUser?.nom} est en train d'écrire...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={text}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                placeholder="Écrire un message... (Entrée pour envoyer)"
                rows={1}
                style={{
                  flex: 1, border: '1px solid #e2e8f0', borderRadius: 20, padding: '10px 16px',
                  fontFamily: 'Sora, sans-serif', fontSize: 13.5, resize: 'none',
                  outline: 'none', maxHeight: 100, lineHeight: 1.5,
                  background: '#f8fafc'
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
              />

              {/* Voice button */}
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                title="Maintenir pour enregistrer un message vocal"
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: recording ? '#e63946' : '#f1f5f9',
                  border: 'none', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                  boxShadow: recording ? '0 0 0 4px rgba(230,57,70,0.2)' : 'none'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={recording ? 'white' : '#475569'} strokeWidth="2">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>

              {/* Send button */}
              <button onClick={sendText} disabled={!text.trim()} style={{
                width: 42, height: 42, borderRadius: '50%',
                background: text.trim() ? '#0f4c81' : '#e2e8f0',
                border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9"/>
                </svg>
              </button>
            </div>

            {recording && (
              <div style={{ padding: '8px 16px', background: '#fee2e2', textAlign: 'center', fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
                🔴 Enregistrement en cours... Relâchez pour envoyer
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
