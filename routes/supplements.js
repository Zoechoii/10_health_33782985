const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// supplements management page
router.get('/supplements', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [supplements] = await pool.execute(
            'SELECT * FROM supplements WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        const error = req.query.error === 'add_failed' ? 'An error occurred while adding supplement.' :
                     req.query.error === 'update_failed' ? 'An error occurred while updating supplement.' :
                     req.query.error === 'delete_failed' ? 'An error occurred while deleting supplement.' :
                     req.query.error === 'update_invalid' ? 'Please enter supplement name.' : null;
        
        const success = req.query.success || null;

        res.render('supplements', {
            username: req.session.username,
            supplements,
            error,
            success
        });
    } catch (error) {
        console.error('Supplements page error:', error);
        res.status(500).send('Server error occurred.');
    }
});

// add supplement
router.post('/supplements/add', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { supplement_name, dosage, frequency, notes } = req.body;

        if (!supplement_name) {
            const [supplements] = await pool.execute(
                'SELECT * FROM supplements WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            return res.render('supplements', {
                username: req.session.username,
                supplements,
                error: 'Please enter supplement name.',
                success: null
            });
        }

        await pool.execute(
            'INSERT INTO supplements (user_id, supplement_name, dosage, frequency, notes) VALUES (?, ?, ?, ?, ?)',
            [userId, supplement_name, dosage || null, frequency || null, notes || null]
        );

        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/supplements?success=added');
    } catch (error) {
        console.error('Add supplement error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/supplements?error=add_failed');
    }
});

// update supplement
router.post('/supplements/update/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const supplementId = req.params.id;
        const { supplement_name, dosage, frequency, notes } = req.body;
        const baseUrl = req.baseUrl || '';

        if (!supplement_name) {
            return res.redirect(baseUrl + '/supplements?error=update_invalid');
        }

        await pool.execute(
            'UPDATE supplements SET supplement_name = ?, dosage = ?, frequency = ?, notes = ? WHERE id = ? AND user_id = ?',
            [supplement_name, dosage || null, frequency || null, notes || null, supplementId, userId]
        );

        res.redirect(baseUrl + '/supplements?success=updated');
    } catch (error) {
        console.error('Update supplement error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/supplements?error=update_failed');
    }
});

// delete supplement
router.post('/supplements/delete/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const supplementId = req.params.id;

        await pool.execute(
            'DELETE FROM supplements WHERE id = ? AND user_id = ?',
            [supplementId, userId]
        );

        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/supplements?success=deleted');
    } catch (error) {
        console.error('Delete supplement error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/supplements?error=delete_failed');
    }
});

module.exports = router;

