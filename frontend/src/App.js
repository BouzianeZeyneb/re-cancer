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

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/" replace />;
    if (user.role === 'medecin') return <Navigate to="/patients" replace />;
    if (user.role === 'laboratoire' || user.role === 'anapath') return <Navigate to="/cas-cancer" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><Dashboard /></ProtectedRoute>} />
      
      {/* Medecin uniquement */}
      <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><Patients /></ProtectedRoute>} />
      <Route path="/patients/nouveau" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><PatientForm /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><PatientDetail /></ProtectedRoute>} />
      <Route path="/patients/:id/modifier" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><PatientForm /></ProtectedRoute>} />
      <Route path="/cas-cancer" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath']}><CasCancer /></ProtectedRoute>} />
      <Route path="/cas-cancer/nouveau" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><CasForm /></ProtectedRoute>} />
      <Route path="/cas-cancer/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath']}><CasDetail /></ProtectedRoute>} />
      <Route path="/rcp" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><RCPList /></ProtectedRoute>} />
      <Route path="/rcp/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><RCPDetail /></ProtectedRoute>} />
      
      {/* Admin uniquement */}
      <Route path="/doublons" element={<ProtectedRoute allowedRoles={['admin']}><Doublons /></ProtectedRoute>} />
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
