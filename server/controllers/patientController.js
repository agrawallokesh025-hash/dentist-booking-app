const db = require('../models/db');
const smsService = require('../services/smsService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const requestOtp = (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    db.run(
        "INSERT INTO Otps (phone, code, expiresAt) VALUES (?, ?, ?)",
        [phone, otpCode, expiresAt],
        async function (err) {
            if (err) return res.status(500).json({ error: 'Failed to generate OTP' });

            // Call modular SMS Service
            try {
                await smsService.sendOtp(phone, otpCode);
                res.json({ message: 'OTP sent successfully', phone, devOtp: otpCode });
            } catch (smsErr) {
                console.error(smsErr);
                res.status(500).json({ error: 'Failed to send SMS' });
            }
        }
    );
};

const verifyOtp = (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code are required' });

    const now = new Date().toISOString();

    db.get(
        "SELECT * FROM Otps WHERE phone = ? AND code = ? AND verified = 0 AND expiresAt > ? ORDER BY id DESC LIMIT 1",
        [phone, code, now],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!row) return res.status(401).json({ error: 'Invalid or expired OTP' });

            // Mark OTP as verified
            db.run("UPDATE Otps SET verified = 1 WHERE id = ?", [row.id]);

            // Return a secure JWT for the patient so they can access their history
            const token = jwt.sign(
                { phone, role: 'Patient' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({ message: 'Verified successfully', token });
        }
    );
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
    requestOtp,
    verifyOtp,
    getPatientHistory
};
