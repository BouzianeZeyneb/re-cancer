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
import AuditLogs from './pages/AuditLogs';
import AdminSettings from './pages/AdminSettings';
import RCPList from './pages/RCPList';
import RCPDetail from './pages/RCPDetail';
import PatientFormulairePublic from './pages/PatientFormulairePublic';
import Laboratoire from './pages/Laboratoire';
import AnalysesBiologie from './pages/AnalysesBiologie';
import Pharmacie from './pages/Pharmacie';
import AnapathPrelevements from './pages/AnapathPrelevements';
import AnapathCompteRendu from './pages/AnapathCompteRendu';
import Validations from './pages/Validations';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  // Normalize role to lowercase
  const safeRole = (user.role && typeof user.role === 'string' && user.role.trim() !== '')
    ? user.role.toLowerCase()
    : 'medecin';

  if (allowedRoles && !allowedRoles.includes(safeRole)) {
    const path = window.location.pathname;

    if (safeRole === 'statisticien' && (path.startsWith('/patients') || path.startsWith('/analyses-biologie'))) {
      return <Navigate to="/statistiques" replace />;
    }
    if ((safeRole === 'pharmacien' || safeRole === 'pharmacie') && (path.startsWith('/patients') || path.startsWith('/carte-sig'))) {
      return <Navigate to="/pharmacie" replace />;
    }
    if (safeRole === 'epidemiologiste' && path.startsWith('/admin')) {
      return <Navigate to="/" replace />;
    }

    if (path === '/') {
      if (safeRole === 'laboratoire') return <Navigate to="/laboratoire" replace />;
      if (safeRole === 'pharmacien' || safeRole === 'pharmacie') return <Navigate to="/pharmacie" replace />;
      if (safeRole === 'anapath') return <Navigate to="/patients" replace />;
      if (safeRole === 'medecin') return <Navigate to="/patients" replace />;
      if (safeRole === 'statisticien') return <Navigate to="/" replace />;
      if (safeRole === 'epidemiologiste') return <Navigate to="/" replace />;
    }

    return (
      <div style={{ padding: 50, textAlign: 'center', fontFamily: 'Sora' }}>
        <h2 style={{ color: '#e63946' }}>Accès Refusé</h2>
        <p>Votre rôle (<strong>{user.role}</strong>) ne vous permet pas d'accéder à cette page.</p>
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
      <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'epidemiologiste', 'statisticien', 'pharmacien', 'pharmacie']}><Dashboard /></ProtectedRoute>} />

      {/* Patients: Admin, Medecin, Labo, Anapath, Pharmacie, Epidemio */}
      <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath', 'pharmacie', 'pharmacien', 'epidemiologiste']}><Patients /></ProtectedRoute>} />
      <Route path="/patients/nouveau" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><PatientForm /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath', 'pharmacie', 'pharmacien']}><PatientDetail /></ProtectedRoute>} />
      <Route path="/patients/:id/modifier" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><PatientForm /></ProtectedRoute>} />
      <Route path="/cas-cancer" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'anapath']}><CasCancer /></ProtectedRoute>} />
      <Route path="/cas-cancer/nouveau" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><CasForm /></ProtectedRoute>} />
      <Route path="/cas-cancer/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'anapath']}><CasDetail /></ProtectedRoute>} />
      <Route path="/rcp" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><RCPList /></ProtectedRoute>} />
      <Route path="/rcp/:id" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><RCPDetail /></ProtectedRoute>} />

      {/* Admin uniquement / Modules SIG / Doublons pour Medecin */}
      <Route path="/doublons" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><Doublons /></ProtectedRoute>} />
      <Route path="/carte-sig" element={<ProtectedRoute allowedRoles={['admin', 'epidemiologiste', 'statisticien']}><CarteSIG /></ProtectedRoute>} />
      <Route path="/utilisateurs" element={<ProtectedRoute allowedRoles={['admin']}><Utilisateurs /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute allowedRoles={['admin', 'pharmacie']}><AuditLogs /></ProtectedRoute>} />
      <Route path="/parametres" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

      <Route path="/validations" element={<ProtectedRoute allowedRoles={['admin', 'epidemiologiste']}><Validations /></ProtectedRoute>} />

      {/* Partagés */}
      <Route path="/statistiques" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'epidemiologiste', 'statisticien']}><Statistiques /></ProtectedRoute>} />
      <Route path="/laboratoire" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire']}><Laboratoire /></ProtectedRoute>} />

      <Route path="/analyses-biologie" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath']}><AnalysesBiologie /></ProtectedRoute>} />
      <Route path="/pharmacie" element={<ProtectedRoute allowedRoles={['admin', 'pharmacien', 'pharmacie']}><Pharmacie /></ProtectedRoute>} />
      <Route path="/anapath/prelevements" element={<ProtectedRoute allowedRoles={['admin','medecin','anapath']}><AnapathPrelevements /></ProtectedRoute>} />
      <Route path="/anapath/compte-rendu/:anapathId" element={<ProtectedRoute allowedRoles={['admin','medecin','anapath']}><AnapathCompteRendu /></ProtectedRoute>} />


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
