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

// Patients routes
const { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, mergePatients } = require('../controllers/patientsController');
router.get('/patients', authMiddleware, getAllPatients);
router.get('/patients/:id', authMiddleware, getPatientById);
router.post('/patients', authMiddleware, createPatient);
router.put('/patients/:id', authMiddleware, updatePatient);
router.delete('/patients/:id', authMiddleware, requireRole('admin', 'medecin'), deletePatient);
router.post('/patients/merge', authMiddleware, requireRole('admin'), mergePatients);

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

// Statistics routes
const { getDashboardStats, getAuditLogs } = require('../controllers/statsController');
router.get('/stats/dashboard', authMiddleware, getDashboardStats);
router.get('/stats/audit', authMiddleware, requireRole('admin'), getAuditLogs);

// Chat routes
const { getConversations, getOrCreateConversation, getMessages, sendMessage, getUsers: getChatUsers } = require('../controllers/chatController');
router.get('/chat/users', authMiddleware, getChatUsers);
router.get('/chat/conversations', authMiddleware, getConversations);
router.get('/chat/conversation/:userId', authMiddleware, getOrCreateConversation);
router.get('/chat/messages/:convId', authMiddleware, getMessages);
router.post('/chat/messages', authMiddleware, sendMessage);

// RCP routes
const { getAllRCP, getRCPById, createRCP, updateRCP, deleteRCP, addCaseToRCP, updateRCPCaseDecision, removeCaseFromRCP } = require('../controllers/rcpController');
router.get('/rcp', authMiddleware, getAllRCP);
router.get('/rcp/:id', authMiddleware, getRCPById);
router.post('/rcp', authMiddleware, createRCP);
router.put('/rcp/:id', authMiddleware, updateRCP);
router.delete('/rcp/:id', authMiddleware, requireRole('admin'), deleteRCP);
router.post('/rcp/:rcp_id/cases', authMiddleware, addCaseToRCP);
router.put('/rcp/:rcp_id/cases/:case_rcp_id', authMiddleware, updateRCPCaseDecision);
router.delete('/rcp/:rcp_id/cases/:case_rcp_id', authMiddleware, requireRole('admin', 'medecin'), removeCaseFromRCP);

// Dynamic descriptors & styles de vie
const {
  getDescripteurs, createDescripteur, updateDescripteur, deleteDescripteur,
  getValeursDescripteurs, saveValeursDescripteurs,
  getStylesVieTypes, createStyleVieType, deleteStyleVieType,
  getStylesViePatient, saveStylesViePatient,
  getParametresGlobaux, createParametreGlobal, updateParametreGlobal, deleteParametreGlobal,
  detectDoublons
} = require('../controllers/dynamicController');

router.get('/descripteurs', authMiddleware, getDescripteurs);
router.post('/descripteurs', authMiddleware, requireRole('admin','medecin'), createDescripteur);
router.put('/descripteurs/:id', authMiddleware, requireRole('admin','medecin'), updateDescripteur);
router.delete('/descripteurs/:id', authMiddleware, requireRole('admin'), deleteDescripteur);
router.get('/descripteurs/valeurs/:caseId', authMiddleware, getValeursDescripteurs);
router.post('/descripteurs/valeurs', authMiddleware, saveValeursDescripteurs);

router.get('/styles-vie/types', authMiddleware, getStylesVieTypes);
router.post('/styles-vie/types', authMiddleware, requireRole('admin','medecin'), createStyleVieType);
router.delete('/styles-vie/types/:id', authMiddleware, requireRole('admin'), deleteStyleVieType);
router.get('/styles-vie/patient/:patientId', authMiddleware, getStylesViePatient);
router.post('/styles-vie/patient', authMiddleware, saveStylesViePatient);

router.get('/parametres', authMiddleware, getParametresGlobaux);
router.post('/parametres', authMiddleware, requireRole('admin'), createParametreGlobal);
router.put('/parametres/:id', authMiddleware, requireRole('admin'), updateParametreGlobal);
router.delete('/parametres/:id', authMiddleware, requireRole('admin'), deleteParametreGlobal);

router.get('/doublons', authMiddleware, detectDoublons);

// Medical modules
const {
  getAnapath, createAnapath, updateAnapath, deleteAnapath,
  getBiologie, createBiologie, deleteBiologie,
  getImagerie, createImagerie, deleteImagerie,
  getConsultations, createConsultation, deleteConsultation,
  getEffetsSecondaires, createEffetSecondaire, resolveEffet,
  getChimioSeances, createChimioSeance
} = require('../controllers/medicalController');

router.get('/anapath/:caseId', authMiddleware, getAnapath);
router.post('/anapath', authMiddleware, createAnapath);
router.put('/anapath/:id', authMiddleware, updateAnapath);
router.delete('/anapath/:id', authMiddleware, deleteAnapath);

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

module.exports = router;
