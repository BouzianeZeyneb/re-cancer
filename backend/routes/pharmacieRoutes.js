const express = require('express');
const router = express.Router();
const pharmacieController = require('../controllers/pharmacieController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// =========================
// 📊 STATS & DASHBOARD
// =========================
router.get('/stats', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.getPharmacyStats);
router.get('/stats/advanced', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.getAdvancedStats);

// =========================
// 📦 STOCK MANAGEMENT
// =========================
router.get('/stock', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.getStocks);
router.post('/stock', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.createMedicament);
router.put('/stock/:id', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.updateMedicament);
router.delete('/stock/:id', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.deleteMedicament);
router.get('/medicament/:id', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.getMedicamentById);

// =========================
// 📋 PRESCRIPTION VALIDATION
// =========================
router.get('/prescriptions', authMiddleware, requireRole('pharmacien'), pharmacieController.getPendingValidations);
router.put('/valider/:id', authMiddleware, requireRole('pharmacien'), pharmacieController.validatePrescription);

// =========================
// 💡 CLINICAL DECISION SUPPORT
// =========================
router.get('/alternatives/:drugId', authMiddleware, pharmacieController.getAlternatives);
router.get('/alerts/expiry', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.getExpiryAlerts);
router.get('/alerts/stock', authMiddleware, requireRole('pharmacien', 'admin'), pharmacieController.getLowStockAlerts);

module.exports = router;