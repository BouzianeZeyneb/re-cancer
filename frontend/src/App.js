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
import AnapathDashboard from './pages/AnapathDashboard';
import AnapathHistorique from './pages/AnapathHistorique';

// Returns the default home path for a given role
const getRoleHome = (role) => {
  switch (role) {
    case 'laboratoire': return '/laboratoire';
    case 'pharmacie':
    case 'pharmacien': return '/pharmacie';
    case 'anapath': return '/anapath/dashboard';
    case 'medecin': return '/';
    case 'admin': return '/';
    case 'epidemio':
    case 'epidemiologiste': return '/statistiques';
    default: return '/patients';
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  // Normalize role to lowercase
  const safeRole = (user.role && typeof user.role === 'string' && user.role.trim() !== '')
    ? user.role.toLowerCase()
    : 'medecin';

  if (allowedRoles && !allowedRoles.includes(safeRole)) {
    // Always redirect to the role's home instead of showing an error wall
    return <Navigate to={getRoleHome(safeRole)} replace />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/patient-forms/:id" element={<PatientFormulairePublic />} />
      <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'epidemiologiste', 'epidemio', 'statisticien', 'pharmacien', 'pharmacie']}><Dashboard /></ProtectedRoute>} />

      {/* Patients: Admin, Medecin, Labo, Anapath, Pharmacie, Epidemio */}
      <Route path="/patients" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath', 'pharmacie', 'pharmacien', 'epidemiologiste', 'epidemio']}><Patients /></ProtectedRoute>} />
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
      <Route path="/carte-sig" element={<ProtectedRoute allowedRoles={['admin', 'epidemiologiste', 'epidemio', 'statisticien']}><CarteSIG /></ProtectedRoute>} />
      <Route path="/utilisateurs" element={<ProtectedRoute allowedRoles={['admin']}><Utilisateurs /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute allowedRoles={['admin', 'pharmacie']}><AuditLogs /></ProtectedRoute>} />
      <Route path="/parametres" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire', 'anapath', 'pharmacie', 'pharmacien']}><AdminSettings /></ProtectedRoute>} />

      <Route path="/validations" element={<ProtectedRoute allowedRoles={['admin', 'epidemiologiste', 'epidemio']}><Validations /></ProtectedRoute>} />

      {/* Partagés */}
      <Route path="/statistiques" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'epidemiologiste', 'epidemio', 'statisticien']}><Statistiques /></ProtectedRoute>} />
      <Route path="/laboratoire" element={<ProtectedRoute allowedRoles={['admin', 'medecin', 'laboratoire']}><Laboratoire /></ProtectedRoute>} />

      <Route path="/analyses-biologie" element={<ProtectedRoute allowedRoles={['admin', 'medecin']}><AnalysesBiologie /></ProtectedRoute>} />
      <Route path="/pharmacie" element={<ProtectedRoute allowedRoles={['admin', 'pharmacien', 'pharmacie']}><Pharmacie /></ProtectedRoute>} />
      <Route path="/anapath/dashboard" element={<ProtectedRoute allowedRoles={['admin','medecin','anapath']}><AnapathDashboard /></ProtectedRoute>} />
      <Route path="/anapath/historique" element={<ProtectedRoute allowedRoles={['admin','medecin','anapath']}><AnapathHistorique /></ProtectedRoute>} />
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
