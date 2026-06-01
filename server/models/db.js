const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Users Table (Admins, Receptionists)
        db.run(`CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'Receptionist', -- 'Owner' or 'Receptionist'
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Patients Table
        db.run(`CREATE TABLE IF NOT EXISTS Patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE,
            firstName TEXT,
            lastName TEXT,
            email TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Appointments Table
        db.run(`CREATE TABLE IF NOT EXISTS Appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER,
            service TEXT,
            date TEXT,
            time TEXT,
            status TEXT DEFAULT 'Pending',
            notes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patientId) REFERENCES Patients(id)
        )`);

        // OTP Verification Table
        db.run(`CREATE TABLE IF NOT EXISTS Otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            code TEXT,
            expiresAt DATETIME,
            verified BOOLEAN DEFAULT 0
        )`);

        // Seed initial Owner admin if none exists
        db.get("SELECT * FROM Users WHERE username = 'admin'", (err, row) => {
            if (!row) {
                const hash = bcrypt.hashSync('password123', 10);
                db.run("INSERT INTO Users (username, password, role) VALUES (?, ?, ?)", ['admin', hash, 'Owner']);
                console.log('Default Owner admin created (admin/password123)');
            }
        });
    });
}

module.exports = db;
