const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/request-otp', patientController.requestOtp);
router.post('/verify-otp', patientController.verifyOtp);
router.get('/history', verifyToken, patientController.getPatientHistory);

module.exports = router;
