import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Chat from './pages/Chat';
import EditeurRapport from './pages/EditeurRapport';
import Doublons from './pages/Doublons';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';
import CasCancer from './pages/CasCancer';
import CasForm from './pages/CasForm';
import CasDetail from './pages/CasDetail';
import Statistiques from './pages/Statistiques';
import CarteSIG from './pages/CarteSIG';
import Utilisateurs from './pages/Utilisateurs';
import { AuditLogs } from './pages/AuditLogs';
import AdminSettings from './pages/AdminSettings';
import RCPList from './pages/RCPList';
import RCPDetail from './pages/RCPDetail';
import PatientFormulairePublic from './pages/PatientFormulairePublic';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Normalize role to lowercase, default to 'anapath' if somehow empty/corrupted in DB
  const safeRole = (user.role && typeof user.role === 'string' && user.role.trim() !== '') 
    ? user.role.toLowerCase() 
    : 'anapath';

  if (allowedRoles && !allowedRoles.includes(safeRole)) {
    const path = window.location.pathname;
    if (path === '/') {
      if (safeRole === 'laboratoire') return <Navigate to="/demandes-labo" replace />;
      if (safeRole === 'medecin' || safeRole === 'anapath') return <Navigate to="/patients" replace />;
    }
    
    return (
      <div style={{ padding: 50, textAlign: 'center', fontFamily: 'Sora' }}>
        <h2 style={{ color: '#e63946' }}>Accès Refusé</h2>
        <p>Votre rôle (<strong>{user.role || 'anapath'}</strong>) ne vous permet pas d'accéder à cette page.</p>
        <button 
          onClick={() => window.location.href = '/'} 
          style={{ padding: '8px 16px', background: '#0f4c81', color: 'white', borderRadius: 6, border: 'none', cursor: 'pointer', marginTop: 16 }}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/patient-forms/:id" element={<PatientFormulairePublic />} />
      <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><Dashboard /></ProtectedRoute>} />
      
      {/* Patients: Admin, Medecin, Labo, Anapath */}
      <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath']}><Patients /></ProtectedRoute>} />
      <Route path="/patients/nouveau" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><PatientForm /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath']}><PatientDetail /></ProtectedRoute>} />
      <Route path="/patients/:id/modifier" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><PatientForm /></ProtectedRoute>} />
      <Route path="/cas-cancer" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath']}><CasCancer /></ProtectedRoute>} />
      <Route path="/cas-cancer/nouveau" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><CasForm /></ProtectedRoute>} />
      <Route path="/cas-cancer/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath']}><CasDetail /></ProtectedRoute>} />
      <Route path="/rcp" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><RCPList /></ProtectedRoute>} />
      <Route path="/rcp/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><RCPDetail /></ProtectedRoute>} />
      
      {/* Admin uniquement */}
      <Route path="/doublons" element={<ProtectedRoute allowedRoles={['admin']}><Doublons /></ProtectedRoute>} />
      <Route path="/carte-sig" element={<ProtectedRoute allowedRoles={['admin']}><CarteSIG /></ProtectedRoute>} />
      <Route path="/utilisateurs" element={<ProtectedRoute allowedRoles={['admin']}><Utilisateurs /></ProtectedRoute>} />
      <Route path="/parametres" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
      
      {/* Partagés */}
      <Route path="/statistiques" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><Statistiques /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontFamily: 'Sora, sans-serif', fontSize: 13.5 } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
