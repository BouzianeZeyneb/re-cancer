const express = require('express');
const router = express.Router();
const parametresController = require('../controllers/parametresController');

router.get('/', parametresController.getParametres);
router.post('/', parametresController.createParametre);
router.put('/:id', parametresController.updateParametre);
router.delete('/:id', parametresController.deleteParametre);

module.exports = router;
