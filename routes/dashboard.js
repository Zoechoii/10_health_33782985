const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [weightRecords] = await pool.execute(
            'SELECT * FROM weight_records WHERE user_id = ? ORDER BY record_date DESC LIMIT 7',
            [userId]
        );

        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
            [userId]
        );

        const [supplements] = await pool.execute(
            'SELECT * FROM supplements WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.render('dashboard', {
            username: req.session.username,
            weightRecords: weightRecords.reverse(),
            goal: goals[0] || null,
            supplements
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Server error occurred.');
    }
});

module.exports = router;

