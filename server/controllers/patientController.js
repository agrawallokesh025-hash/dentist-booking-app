const db = require('../models/db');
const smsService = require('../services/smsService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const login = (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Instantly return a secure JWT for the patient so they can access their history
    const token = jwt.sign(
        { phone, role: 'Patient' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
};

const getPatientHistory = (req, res) => {
    // Requires verifyToken middleware (Patient role)
    const phone = req.user.phone;
    
    db.all("SELECT * FROM Appointments WHERE patientId IN (SELECT id FROM Patients WHERE phone = ?) ORDER BY date DESC", [phone], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
};

module.exports = {
    login,
    getPatientHistory
};
