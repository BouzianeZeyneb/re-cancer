const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');

// Auth routes
const { login, getProfile, changePassword } = require('../controllers/authController');
router.post('/auth/login', login);
router.get('/auth/profile', authMiddleware, getProfile);
router.put('/auth/password', authMiddleware, changePassword);

// Users routes
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/usersController');
router.get('/users', authMiddleware, requireRole('admin'), getAllUsers);
router.post('/users', authMiddleware, requireRole('admin'), createUser);
router.put('/users/:id', authMiddleware, requireRole('admin'), updateUser);
router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);

router.get('/users/role/medecins', authMiddleware, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [medecins] = await pool.execute('SELECT id, nom, prenom, email FROM users WHERE role = "medecin" AND actif = true');
    res.json(medecins);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/users/role/laboratoire', authMiddleware, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [labos] = await pool.execute('SELECT id, nom, prenom, email FROM users WHERE role = "laboratoire" AND actif = true');
    res.json(labos);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Patients routes
const { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, mergePatients, checkDuplicateRealtime, getPublicPatientInfo, updatePublicHabitudes } = require('../controllers/patientsController');
router.get('/patients', authMiddleware, getAllPatients);
router.post('/patients/check-duplicate', authMiddleware, checkDuplicateRealtime);
router.get('/patients/:id', authMiddleware, getPatientById);
router.post('/patients', authMiddleware, createPatient);
router.put('/patients/:id', authMiddleware, updatePatient);
router.delete('/patients/:id', authMiddleware, requireRole('admin', 'medecin'), deletePatient);
router.post('/patients/merge', authMiddleware, requireRole('admin'), mergePatients);

// Public Patient routes (for QR Code Questionnaire)
router.get('/public/patients/:id', getPublicPatientInfo);
router.put('/public/patients/:id/habitudes', updatePublicHabitudes);

// Cancer cases routes
const { getCasesByPatient, getCaseById, createCase, updateCase, addTraitement, addRendezVous, getAllCases } = require('../controllers/casesController');
router.get('/cases', authMiddleware, getAllCases);
router.get('/cases/patient/:patientId', authMiddleware, getCasesByPatient);
router.get('/cases/:id', authMiddleware, getCaseById);
router.post('/cases', authMiddleware, createCase);
router.put('/cases/:id', authMiddleware, updateCase);
router.post('/traitements', authMiddleware, addTraitement);
router.post('/rendez-vous', authMiddleware, addRendezVous);
router.get('/rendez-vous', authMiddleware, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [rdvs] = await pool.execute(`
      SELECT rv.*, 
        p.nom as patient_nom, p.prenom as patient_prenom,
        u.nom as medecin_nom, u.prenom as medecin_prenom
      FROM rendez_vous rv
      JOIN patients p ON rv.patient_id = p.id
      LEFT JOIN users u ON rv.medecin_id = u.id
      ORDER BY rv.date_rdv DESC
    `);
    res.json(rdvs);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Statistics & AI routes
const { getDashboardStats, getAuditLogs, analyzeWilayaIA, analyzePatientIA, askGlobalIA, getRawStatsData } = require('../controllers/statsController');
router.get('/stats/dashboard', authMiddleware, getDashboardStats);
router.get('/stats/raw', authMiddleware, getRawStatsData);
router.post('/stats/ia-analysis', authMiddleware, analyzeWilayaIA);
router.post('/stats/analyze-patient', authMiddleware, analyzePatientIA);
router.post('/chat-ia', authMiddleware, askGlobalIA);
router.get('/stats/audit', authMiddleware, requireRole('admin'), getAuditLogs);

// Chat routes
const { getConversations, getOrCreateConversation, getMessages, sendMessage, getUsers: getChatUsers } = require('../controllers/chatController');
router.get('/chat/users', authMiddleware, getChatUsers);
router.get('/chat/conversations', authMiddleware, getConversations);
router.get('/chat/conversation/:userId', authMiddleware, getOrCreateConversation);
router.get('/chat/messages/:convId', authMiddleware, getMessages);
router.post('/chat/messages', authMiddleware, sendMessage);

// Notifications routes
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationsController');
router.get('/notifications', authMiddleware, getMyNotifications);
router.put('/notifications/:id/read', authMiddleware, markAsRead);
router.put('/notifications/read-all', authMiddleware, markAllAsRead);

// RCP routes
const { 
  getAllRCP, getRCPById, createRCP, updateRCP, deleteRCP, 
  addCaseToRCP, updateRCPCaseDecision, removeCaseFromRCP,
  getRCPMessages, saveRCPMessage, updateRCPDecisionFinale,
  joinRCPByCode, inviteDoctorToRCP
} = require('../controllers/rcpController');

router.get('/rcp', authMiddleware, getAllRCP);
router.post('/rcp/join', authMiddleware, joinRCPByCode);
router.get('/rcp/:id', authMiddleware, getRCPById);
router.post('/rcp/:id/invite', authMiddleware, requireRole('admin', 'medecin'), inviteDoctorToRCP);
router.post('/rcp', authMiddleware, createRCP);
router.put('/rcp/:id', authMiddleware, updateRCP);
router.put('/rcp/:id/decision', authMiddleware, updateRCPDecisionFinale);
router.delete('/rcp/:id', authMiddleware, requireRole('admin'), deleteRCP);
router.post('/rcp/:rcp_id/cases', authMiddleware, addCaseToRCP);
router.put('/rcp/:rcp_id/cases/:case_rcp_id', authMiddleware, updateRCPCaseDecision);
router.delete('/rcp/:rcp_id/cases/:case_rcp_id', authMiddleware, requireRole('admin', 'medecin'), removeCaseFromRCP);

// RCP chat routes
router.get('/rcp/:id/messages', authMiddleware, getRCPMessages);
router.post('/rcp/:id/messages', authMiddleware, saveRCPMessage);

// Dynamic descriptors & styles de vie
const {
  getChampsDynamiques, createChampDynamique, updateChampDynamique, deleteChampDynamique,
  getValeursDynamiques, saveValeursDynamiques,
  getParametresGlobaux, createParametreGlobal, updateParametreGlobal, deleteParametreGlobal,
  detectDoublons
} = require('../controllers/dynamicController');

// Unified Dynamic Fields Endpoints
router.get('/champs-dynamiques', authMiddleware, getChampsDynamiques);
router.post('/champs-dynamiques', authMiddleware, requireRole('admin','medecin'), createChampDynamique);
router.put('/champs-dynamiques/:id', authMiddleware, requireRole('admin','medecin'), updateChampDynamique);
router.delete('/champs-dynamiques/:id', authMiddleware, requireRole('admin'), deleteChampDynamique);

// Unified Dynamic Values Endpoints
router.get('/valeurs-dynamiques/:recordId', authMiddleware, getValeursDynamiques);
router.post('/valeurs-dynamiques', authMiddleware, saveValeursDynamiques);

router.get('/parametres', authMiddleware, getParametresGlobaux);
router.post('/parametres', authMiddleware, requireRole('admin'), createParametreGlobal);
router.put('/parametres/:id', authMiddleware, requireRole('admin'), updateParametreGlobal);
router.delete('/parametres/:id', authMiddleware, requireRole('admin'), deleteParametreGlobal);

router.get('/doublons', authMiddleware, detectDoublons);

// Medical modules
const {
  getAnapath, createAnapath, updateAnapath, deleteAnapath,
  getBiologie, getBiologieByPatient, createBiologie, deleteBiologie,
  getImagerie, createImagerie, deleteImagerie,
  getConsultations, createConsultation, deleteConsultation,
  getEffetsSecondaires, createEffetSecondaire, resolveEffet,
  getChimioSeances, createChimioSeance
} = require('../controllers/medicalController');

router.get('/anapath/:caseId', authMiddleware, getAnapath);
router.post('/anapath', authMiddleware, createAnapath);
router.put('/anapath/:id', authMiddleware, updateAnapath);
router.delete('/anapath/:id', authMiddleware, deleteAnapath);

router.get('/biologie/patient/:patientId', authMiddleware, getBiologieByPatient);
router.get('/biologie/:caseId', authMiddleware, getBiologie);
router.post('/biologie', authMiddleware, createBiologie);
router.delete('/biologie/:id', authMiddleware, deleteBiologie);

router.get('/imagerie/:caseId', authMiddleware, getImagerie);
router.post('/imagerie', authMiddleware, createImagerie);
router.delete('/imagerie/:id', authMiddleware, deleteImagerie);

router.get('/consultations/:caseId', authMiddleware, getConsultations);
router.post('/consultations', authMiddleware, createConsultation);
router.delete('/consultations/:id', authMiddleware, deleteConsultation);

router.get('/effets-secondaires/:caseId', authMiddleware, getEffetsSecondaires);
router.post('/effets-secondaires', authMiddleware, createEffetSecondaire);
router.put('/effets-secondaires/:id/resoudre', authMiddleware, resolveEffet);

router.get('/chimio-seances/:caseId', authMiddleware, getChimioSeances);
router.post('/chimio-seances', authMiddleware, createChimioSeance);

// Lab requests
const { createRequest, getRequestsByCase, getRequestsForLabo, uploadPdf } = require('../controllers/labRequestsController');
const uploadLab = require('../middleware/upload');
router.post('/lab-requests', authMiddleware, requireRole('admin', 'medecin'), createRequest);
router.get('/lab-requests/case/:caseId', authMiddleware, getRequestsByCase);
router.get('/lab-requests/labo', authMiddleware, requireRole('laboratoire'), getRequestsForLabo);
router.put('/lab-requests/:id/upload', authMiddleware, requireRole('laboratoire'), uploadLab.single('pdf'), uploadPdf);

module.exports = router;
