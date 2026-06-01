const db = require('../models/db');
const smsService = require('../services/smsService');

const createAppointment = (req, res) => {
    const { firstName, lastName, email, phone, service, date, time, notes } = req.body;

    // 1. Ensure Patient Exists
    db.get('SELECT id FROM Patients WHERE phone = ?', [phone], (err, patient) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (patient) {
            insertAppointment(patient.id);
        } else {
            db.run(
                'INSERT INTO Patients (firstName, lastName, email, phone) VALUES (?, ?, ?, ?)',
                [firstName, lastName, email, phone],
                function (insertErr) {
                    if (insertErr) return res.status(500).json({ error: 'Failed to create patient' });
                    insertAppointment(this.lastID);
                }
            );
        }
    });

    function insertAppointment(patientId) {
        db.run(
            'INSERT INTO Appointments (patientId, service, date, time, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
            [patientId, service, date, time, notes, 'Pending'],
            async function (err) {
                if (err) return res.status(500).json({ error: 'Failed to book appointment' });

                // Trigger booking SMS
                await smsService.sendAppointmentConfirmation(phone, { service, date, time });

                res.status(201).json({ message: 'Appointment booked successfully', appointmentId: this.lastID });
            }
        );
    }
};

const getAllAppointments = (req, res) => {
    // Requires verifyToken and requireStaff
    const query = `
        SELECT a.*, p.firstName, p.lastName, p.phone, p.email 
        FROM Appointments a 
        JOIN Patients p ON a.patientId = p.id 
        ORDER BY a.createdAt DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
};

const updateStatus = (req, res) => {
    // Requires verifyToken and requireStaff
    const { id } = req.params;
    const { status } = req.body;

    db.run('UPDATE Appointments SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update status' });
        
        // Fetch phone and details to send SMS
        db.get('SELECT a.date, p.phone FROM Appointments a JOIN Patients p ON a.patientId = p.id WHERE a.id = ?', [id], async (fetchErr, apt) => {
            if (!fetchErr && apt) {
                await smsService.sendStatusUpdate(apt.phone, status, { date: apt.date });
            }
            res.json({ message: 'Status updated successfully' });
        });
    });
};

module.exports = {
    createAppointment,
    getAllAppointments,
    updateStatus
};
