const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, requireStaff } = require('../middleware/authMiddleware');

router.post('/book', appointmentController.createAppointment);
router.get('/all', verifyToken, requireStaff, appointmentController.getAllAppointments);
router.put('/:id/status', verifyToken, requireStaff, appointmentController.updateStatus);

module.exports = router;
