const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getLabRequestsByPatient, getPendingLabRequests, createLabRequest, uploadLabResult } = require('../controllers/labRequestsController');
const { verifyToken } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/patient/:patient_id', verifyToken, getLabRequestsByPatient);
router.get('/pending', verifyToken, getPendingLabRequests);
router.post('/', verifyToken, createLabRequest);
router.put('/:id/results', verifyToken, upload.single('result_file'), uploadLabResult);

module.exports = router;
