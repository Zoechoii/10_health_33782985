const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { generateSalt, hashPassword, verifyPassword } = require('../utils/password');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Register page
router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('register', { error: null });
});

// Register handler
router.post('/register', redirectIfAuthenticated, async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
        return res.render('register', { error: 'Please fill in all fields.' });
    }

    if (password !== confirmPassword) {
        return res.render('register', { error: 'Passwords do not match.' });
    }

    // Password validation: at least 8 characters, one lowercase, one uppercase, one number, one special character
    if (password.length < 8) {
        return res.render('register', { error: 'Password must be at least 8 characters long.' });
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
    
    if (!hasLowerCase || !hasUpperCase || !hasNumber || !hasSpecialChar) {
        return res.render('register', { 
            error: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.' 
        });
    }

    try {
        // Check for duplicates
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.render('register', { error: 'Username or email is already in use.' });
        }

        const salt = generateSalt();
        const passwordHash = await hashPassword(password, salt);

        await pool.execute(
            'INSERT INTO users (username, email, password_hash, salt) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, salt]
        );

        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'An error occurred during registration.' });
    }
});

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
    const registered = req.query.registered === 'true';
    res.render('login', { 
        error: null, 
        registered: registered,
        title: 'Login - YakTime'
    });
});

// Login handler
router.post('/login', redirectIfAuthenticated, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('login', { error: 'Please enter username and password.', registered: false });
    }

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.render('login', { error: 'Invalid username or password.', registered: false });
        }

        const user = users[0];
        const isValid = await verifyPassword(password, user.password_hash, user.salt);

        if (!isValid) {
            return res.render('login', { error: 'Invalid username or password.', registered: false });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login.', registered: false });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/login');
    });
});

module.exports = router;

