const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/login', patientController.login);
router.get('/history', verifyToken, patientController.getPatientHistory);

module.exports = router;
