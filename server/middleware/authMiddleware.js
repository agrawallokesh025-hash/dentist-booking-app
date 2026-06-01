const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only_luxesmile_2026';

/**
 * Middleware to verify JWT token in Authorization header
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"
    if (!token) {
        return res.status(403).json({ error: 'Token format invalid' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        
        req.user = decoded; // { id, username, role }
        next();
    });
};

/**
 * Middleware to restrict access to Owners only
 */
const requireOwner = (req, res, next) => {
    if (req.user && req.user.role === 'Owner') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Owner role required' });
    }
};

/**
 * Middleware to restrict access to specific roles (Owner or Receptionist)
 */
const requireStaff = (req, res, next) => {
    if (req.user && (req.user.role === 'Owner' || req.user.role === 'Receptionist')) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden: Staff role required' });
    }
};

module.exports = {
    verifyToken,
    requireOwner,
    requireStaff,
    JWT_SECRET
};
