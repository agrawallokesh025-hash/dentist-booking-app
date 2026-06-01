require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files (the existing LuxeSmile site)
app.use(express.static(path.join(__dirname, '../site/public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// Catch-all route to serve index.html for frontend routing or unknown paths
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../site/public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`LuxeSmile Production Backend running on http://localhost:${PORT}`);
});

module.exports = app;
