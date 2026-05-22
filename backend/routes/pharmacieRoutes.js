const express = require('express');
const router = express.Router();
const pharmacieController = require('../controllers/pharmacieController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Rôles autorisés pour la pharmacie
const PHARMA_ROLES = ['pharmacien', 'pharmacie', 'admin'];

// =========================
// 📊 STATS & DASHBOARD
// =========================
router.get('/stats', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.getPharmacyStats);
router.get('/stats/advanced', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.getAdvancedStats);

// =========================
// 📦 STOCK MANAGEMENT
// =========================
router.get('/stock', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.getStocks);
router.post('/stock', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.createMedicament);
router.put('/stock/:id', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.updateMedicament);
router.delete('/stock/:id', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.deleteMedicament);
router.get('/medicament/:id', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.getMedicamentById);

// =========================
// 📋 PRESCRIPTION VALIDATION
// =========================
router.get('/prescriptions', authMiddleware, requireRole('pharmacien', 'pharmacie'), pharmacieController.getPendingValidations);
router.put('/valider/:id', authMiddleware, requireRole('pharmacien', 'pharmacie'), pharmacieController.validatePrescription);

// =========================
// 💡 CLINICAL DECISION SUPPORT
// =========================
router.get('/alternatives/:drugId', authMiddleware, pharmacieController.getAlternatives);
router.get('/alerts/expiry', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.getExpiryAlerts);
router.get('/alerts/stock', authMiddleware, requireRole(...PHARMA_ROLES), pharmacieController.getLowStockAlerts);

module.exports = router;