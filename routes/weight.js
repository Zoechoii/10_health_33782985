const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// weight management page
router.get('/weight', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // get all weight records
        const [weightRecords] = await pool.execute(
            'SELECT * FROM weight_records WHERE user_id = ? ORDER BY record_date DESC',
            [userId]
        );

        // get goals
        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
            [userId]
        );

        const error = req.query.error === 'add_failed' ? 'An error occurred while adding weight.' :
                     req.query.error === 'delete_failed' ? 'An error occurred while deleting weight.' :
                     req.query.error === 'goal_invalid' ? 'Please enter target weight.' :
                     req.query.error === 'goal_failed' ? 'An error occurred while setting goal.' : null;
        
        const success = req.query.success || null;

        res.render('weight', {
            username: req.session.username,
            weightRecords,
            goal: goals[0] || null,
            error,
            success
        });
    } catch (error) {
        console.error('Weight page error:', error);
        res.status(500).send('Server error occurred.');
    }
});

// add weight record
router.post('/weight/add', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { weight, record_date } = req.body;

        if (!weight || !record_date) {
            const [weightRecords] = await pool.execute(
                'SELECT * FROM weight_records WHERE user_id = ? ORDER BY record_date DESC',
                [userId]
            );
            const [goals] = await pool.execute(
                'SELECT * FROM goals WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
                [userId]
            );
            return res.render('weight', {
                username: req.session.username,
                weightRecords,
                goal: goals[0] || null,
                error: 'Please enter weight and date.',
                success: null
            });
        }

        await pool.execute(
            'INSERT INTO weight_records (user_id, weight, record_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE weight = ?',
            [userId, weight, record_date, weight]
        );

        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/weight?success=added');
    } catch (error) {
        console.error('Add weight error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/weight?error=add_failed');
    }
});

// delete weight record
router.post('/weight/delete/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = req.params.id;

        await pool.execute(
            'DELETE FROM weight_records WHERE id = ? AND user_id = ?',
            [recordId, userId]
        );

        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/weight?success=deleted');
    } catch (error) {
        console.error('Delete weight error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/weight?error=delete_failed');
    }
});

// set goal
router.post('/weight/goal', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { target_weight, target_date } = req.body;
        const baseUrl = req.baseUrl || '';

        if (!target_weight) {
            return res.redirect(baseUrl + '/weight?error=goal_invalid');
        }

        const [existingGoals] = await pool.execute(
            'SELECT * FROM goals WHERE user_id = ?',
            [userId]
        );

        if (existingGoals.length > 0) {
            await pool.execute(
                'UPDATE goals SET target_weight = ?, target_date = ? WHERE user_id = ?',
                [target_weight, target_date || null, userId]
            );
        } else {
            await pool.execute(
                'INSERT INTO goals (user_id, target_weight, target_date) VALUES (?, ?, ?)',
                [userId, target_weight, target_date || null]
            );
        }

        res.redirect(baseUrl + '/weight?success=goal_set');
    } catch (error) {
        console.error('Set goal error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/weight?error=goal_failed');
    }
});

module.exports = router;

