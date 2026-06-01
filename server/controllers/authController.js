const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const login = (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.get('SELECT * FROM Users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    });
};

const changePassword = (req, res) => {
    // Requires verifyToken middleware
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    db.get('SELECT password FROM Users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'Database error' });

        const valid = bcrypt.compareSync(oldPassword, user.password);
        if (!valid) return res.status(401).json({ error: 'Old password incorrect' });

        const newHash = bcrypt.hashSync(newPassword, 10);
        db.run('UPDATE Users SET password = ? WHERE id = ?', [newHash, userId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Failed to update password' });
            res.json({ message: 'Password updated successfully' });
        });
    });
};

const changeUsername = (req, res) => {
    const { newUsername } = req.body;
    const userId = req.user.id;

    if (!newUsername) {
        return res.status(400).json({ error: 'New username required' });
    }

    db.get('SELECT * FROM Users WHERE username = ? AND id != ?', [newUsername, userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        if (user) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        db.run('UPDATE Users SET username = ? WHERE id = ?', [newUsername, userId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Failed to update username' });
            res.json({ message: 'Username updated successfully' });
        });
    });
};

module.exports = {
    login,
    changePassword,
    changeUsername
};
