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
router.post('/patients', authMiddleware, requireRole('admin', 'medecin'), createPatient);
router.put('/patients/:id', authMiddleware, requireRole('admin', 'medecin'), updatePatient);
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
router.post('/traitements', authMiddleware, requireRole('admin', 'medecin'), addTraitement);
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
const { getDashboardStats, getAuditLogs, analyzeWilayaIA, analyzePatientIA, askGlobalIA, getRawStatsData, getLocalizedStats } = require('../controllers/statsController');
router.get('/stats/dashboard', authMiddleware, getDashboardStats);
router.get('/stats/localized', authMiddleware, getLocalizedStats);
router.get('/stats/raw', authMiddleware, getRawStatsData);
router.post('/stats/ia-analysis', authMiddleware, analyzeWilayaIA);
router.post('/stats/analyze-patient', authMiddleware, analyzePatientIA);
router.post('/chat-ia', authMiddleware, askGlobalIA);
router.get('/audit-logs', authMiddleware, requireRole('admin'), getAuditLogs);
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
router.post('/champs-dynamiques', authMiddleware, requireRole('admin', 'medecin'), createChampDynamique);
router.put('/champs-dynamiques/:id', authMiddleware, requireRole('admin', 'medecin'), updateChampDynamique);
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
  getBiologiePatientStats,
  getImagerie, createImagerie, deleteImagerie,
  getConsultations, createConsultation, deleteConsultation,
  getEffetsSecondaires, createEffetSecondaire, resolveEffet,
  getChimioSeances, createChimioSeance,
  getDocumentsByPatient, createDocument,
  getAnapathByPatient, getPrelevementsList, getTraitementsByPatient, getConsultationsByPatient, getImagerieByPatient, getEffetsByPatient
} = require('../controllers/medicalController');

router.get('/anapath/prelevements', authMiddleware, requireRole('admin', 'medecin', 'anapath'), getPrelevementsList);
router.get('/anapath/patient/:patientId', authMiddleware, getAnapathByPatient);

// Comptes rendus ANAPATH
const { getByAnapath: getCR, getPrelevementInfo, create: createCR, update: updateCR, valider: validerCR } = require('../controllers/anapathCompteRenduController');
router.get('/anapath/:anapathId/compte-rendu', authMiddleware, requireRole('admin', 'medecin', 'anapath'), getCR);
router.get('/anapath/:anapathId/info', authMiddleware, requireRole('admin', 'medecin', 'anapath'), getPrelevementInfo);
router.post('/anapath/compte-rendu', authMiddleware, requireRole('admin', 'medecin', 'anapath'), createCR);
router.put('/anapath/compte-rendu/:id', authMiddleware, requireRole('admin', 'medecin', 'anapath'), updateCR);
router.put('/anapath/compte-rendu/:id/valider', authMiddleware, requireRole('admin', 'anapath'), validerCR);

router.get('/anapath/:caseId', authMiddleware, getAnapath);
router.post('/anapath', authMiddleware, createAnapath);
router.put('/anapath/:id', authMiddleware, updateAnapath);
router.delete('/anapath/:id', authMiddleware, deleteAnapath);

router.get('/biologie/patient-stats', authMiddleware, getBiologiePatientStats);
router.get('/biologie/patient/:patientId', authMiddleware, getBiologieByPatient);
router.get('/biologie/:caseId', authMiddleware, getBiologie);
router.post('/biologie', authMiddleware, createBiologie);
router.delete('/biologie/:id', authMiddleware, deleteBiologie);

router.get('/imagerie/patient/:patientId', authMiddleware, getImagerieByPatient);
router.get('/imagerie/:caseId', authMiddleware, getImagerie);
router.post('/imagerie', authMiddleware, createImagerie);
router.delete('/imagerie/:id', authMiddleware, deleteImagerie);

router.get('/consultations/patient/:patientId', authMiddleware, requireRole('admin', 'medecin'), getConsultationsByPatient);
router.get('/consultations/:caseId', authMiddleware, requireRole('admin', 'medecin'), getConsultations);
router.post('/consultations', authMiddleware, requireRole('admin', 'medecin'), createConsultation);
router.delete('/consultations/:id', authMiddleware, requireRole('admin', 'medecin'), deleteConsultation);

router.get('/effets-secondaires/patient/:patientId', authMiddleware, requireRole('admin', 'medecin'), getEffetsByPatient);
router.get('/effets-secondaires/:caseId', authMiddleware, requireRole('admin', 'medecin'), getEffetsSecondaires);
router.post('/effets-secondaires', authMiddleware, requireRole('admin', 'medecin'), createEffetSecondaire);
router.put('/effets-secondaires/:id/resoudre', authMiddleware, requireRole('admin', 'medecin'), resolveEffet);

router.get('/traitements/patient/:patientId', authMiddleware, requireRole('admin', 'medecin', 'pharmacien', 'pharmacie'), getTraitementsByPatient);

router.get('/chimio-seances/:caseId', authMiddleware, getChimioSeances);
router.post('/chimio-seances', authMiddleware, createChimioSeance);

router.get('/documents/patient/:patientId', authMiddleware, getDocumentsByPatient);
router.post('/documents', authMiddleware, createDocument);

// Pharmacy routes
const pharmacieRoutes = require('./pharmacieRoutes');
router.use('/pharmacie', authMiddleware, pharmacieRoutes);

// Lab requests
const { createRequest, getRequestsByCase, getRequestsForLabo, uploadPdf, getLabRequestsByPatient } = require('../controllers/labRequestsController');
const uploadLab = require('../middleware/upload');
router.post('/lab-requests', authMiddleware, requireRole('admin', 'medecin', 'laboratoire'), createRequest);
router.get('/lab-requests/case/:caseId', authMiddleware, getRequestsByCase);
router.get('/lab-requests/patient/:patientId', authMiddleware, getLabRequestsByPatient);
router.get('/lab-requests/labo', authMiddleware, requireRole('laboratoire', 'admin', 'medecin'), getRequestsForLabo);
router.put('/lab-requests/:id/upload', authMiddleware, requireRole('laboratoire'), uploadLab.single('pdf'), uploadPdf);

const { getAll, create, update, remove, getValues, saveValue } = require('../controllers/customFieldsController');

// Custom dynamic fields routes (admin only for CRUD)
router.get('/custom-fields', authMiddleware, requireRole('admin'), getAll);
router.post('/custom-fields', authMiddleware, requireRole('admin'), create);
router.put('/custom-fields/:id', authMiddleware, requireRole('admin'), update);
router.delete('/custom-fields/:id', authMiddleware, requireRole('admin'), remove);

// Endpoints for retrieving and saving field values (available to all authenticated users)
router.get('/custom-fields/:id/value/:recordId', authMiddleware, getValues);
router.post('/custom-fields/:id/value', authMiddleware, saveValue);

// Additional admin & epi protections
router.post('/zones', authMiddleware, requireRole('admin', 'epidemiologiste'), (req, res) => res.status(200).send('OK'));
router.delete('/zones/:id', authMiddleware, requireRole('admin', 'epidemiologiste'), (req, res) => res.status(200).send('OK'));
router.post('/backup', authMiddleware, requireRole('admin'), (req, res) => res.status(200).send('OK'));
router.use('/admin', authMiddleware, requireRole('admin'), (req, res, next) => next());

// ── VALIDATIONS ÉPIDÉMIOLOGIQUES ──────────────────────────────────────────────
router.get('/validations/stats', authMiddleware, requireRole('admin', 'epidemiologiste'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const startOfDay = now.toISOString().slice(0,10);

    const [[pending]] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM cancer_cases c LEFT JOIN validations_epidemio v ON v.case_id = c.id WHERE COALESCE(v.statut,'en_attente')='en_attente'`
    );
    const [[approvedToday]] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM validations_epidemio WHERE statut='approuve' AND DATE(validated_at)=?`, [startOfDay]
    );
    const [[rejectedToday]] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM validations_epidemio WHERE statut='rejete' AND DATE(validated_at)=?`, [startOfDay]
    );
    const [[approvedMonth]] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM validations_epidemio WHERE statut='approuve' AND validated_at >= ?`, [startOfMonth]
    );
    const [[rejectedMonth]] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM validations_epidemio WHERE statut='rejete' AND validated_at >= ?`, [startOfMonth]
    );
    const totalMonth = approvedMonth.cnt + rejectedMonth.cnt;
    const rate = totalMonth > 0 ? Math.round((approvedMonth.cnt / totalMonth) * 100) : 0;

    res.json({
      pending: pending.cnt,
      approvedToday: approvedToday.cnt,
      rejectedToday: rejectedToday.cnt,
      approvedMonth: approvedMonth.cnt,
      rejectedMonth: rejectedMonth.cnt,
      monthlyRate: rate
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/validations', authMiddleware, requireRole('admin', 'epidemiologiste'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.execute(`
      SELECT p.id, p.nom, p.prenom, p.date_naissance, p.sexe, p.wilaya,
             p.num_carte_nationale,
             c.id as case_id, c.topographie_icdo3, c.morphologie_icdo3,
             c.tnm_t as stade_tnm_t, c.tnm_n as stade_tnm_n, c.tnm_m as stade_tnm_m,
             c.date_diagnostic, c.created_at as case_created,
             COALESCE(v.statut, 'en_attente') as validation_statut,
             v.id as validation_id, v.commentaire, v.validated_at,
             u.nom as valideur_nom, u.prenom as valideur_prenom
      FROM patients p
      JOIN cancer_cases c ON c.patient_id = p.id
      LEFT JOIN validations_epidemio v ON v.case_id = c.id
      WHERE COALESCE(v.statut, 'en_attente') = 'en_attente'
      ORDER BY c.created_at ASC
      LIMIT 50
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

router.get('/validations/historique', authMiddleware, requireRole('admin', 'epidemiologiste'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const [rows] = await pool.execute(`
      SELECT p.id, p.nom, p.prenom, p.sexe,
             c.id as case_id, c.topographie_icdo3,
             v.statut as validation_statut, v.commentaire, v.validated_at,
             u.nom as valideur_nom, u.prenom as valideur_prenom
      FROM validations_epidemio v
      JOIN cancer_cases c ON v.case_id = c.id
      JOIN patients p ON c.patient_id = p.id
      LEFT JOIN users u ON v.validated_by = u.id
      WHERE v.statut != 'en_attente'
      ORDER BY v.validated_at DESC
      LIMIT 30
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/validations/:caseId/approuver', authMiddleware, requireRole('admin', 'epidemiologiste'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { commentaire } = req.body;
    const userId = req.user.id;
    await pool.execute(
      `INSERT INTO validations_epidemio (case_id, statut, commentaire, validated_by, validated_at)
       VALUES (?, 'approuve', ?, ?, NOW())
       ON DUPLICATE KEY UPDATE statut='approuve', commentaire=?, validated_by=?, validated_at=NOW()`,
      [req.params.caseId, commentaire || null, userId, commentaire || null, userId]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/validations/:caseId/rejeter', authMiddleware, requireRole('admin', 'epidemiologiste'), async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { commentaire } = req.body;
    const userId = req.user.id;
    await pool.execute(
      `INSERT INTO validations_epidemio (case_id, statut, commentaire, validated_by, validated_at)
       VALUES (?, 'rejete', ?, ?, NOW())
       ON DUPLICATE KEY UPDATE statut='rejete', commentaire=?, validated_by=?, validated_at=NOW()`,
      [req.params.caseId, commentaire, userId, commentaire, userId]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
