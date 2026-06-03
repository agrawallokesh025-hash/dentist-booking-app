require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

// Trust reverse proxy (e.g. Render/Heroku load balancers) so rate limiting can read the correct IP
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled so CDN scripts (Tailwind/FontAwesome) work easily
}));

// Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15, // Limit each IP to 15 login/OTP attempts
    message: { error: 'Too many attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/patients/send-otp', authLimiter);

// General Middleware
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
