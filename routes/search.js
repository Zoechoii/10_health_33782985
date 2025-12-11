const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// search page
router.get('/search', requireAuth, async (req, res) => {
    const query = req.query.q || '';
    let results = {
        users: [],
        supplements: [],
        weightRecords: [],
        goals: []
    };

    if (query.trim()) {
        try {
            const userId = req.session.userId;
            const queryLower = query.toLowerCase().trim();
            
            // determine search category
            let searchCategory = 'all';
            let actualSearchTerm = query;
            
            if (queryLower.startsWith('weight') || queryLower === 'weight') {
                searchCategory = 'weight';
                actualSearchTerm = query.replace(/^weight\s*/i, '').trim() || '%';
            } else if (queryLower.startsWith('supplement') || queryLower === 'supplement') {
                searchCategory = 'supplement';
                actualSearchTerm = query.replace(/^supplement\s*/i, '').trim() || '%';
            } else if (queryLower.startsWith('goal') || queryLower === 'goal') {
                searchCategory = 'goal';
                actualSearchTerm = query.replace(/^goal\s*/i, '').trim() || '%';
            }
            
            const searchTerm = `%${actualSearchTerm}%`;

            if (searchCategory === 'all' || searchCategory === 'supplement') {
                const [supplements] = await pool.execute(
                    `SELECT * FROM supplements 
                     WHERE user_id = ? 
                     AND (supplement_name LIKE ? OR dosage LIKE ? OR frequency LIKE ? OR notes LIKE ?)
                     ORDER BY created_at DESC`,
                    [userId, searchTerm, searchTerm, searchTerm, searchTerm]
                );
                results.supplements = supplements;
            }

            if (searchCategory === 'all' || searchCategory === 'weight') {
                const [weightRecords] = await pool.execute(
                    `SELECT * FROM weight_records 
                     WHERE user_id = ? 
                     AND weight LIKE ?
                     ORDER BY record_date DESC`,
                    [userId, searchTerm]
                );
                results.weightRecords = weightRecords;
            }

            if (searchCategory === 'all' || searchCategory === 'goal') {
                const [goals] = await pool.execute(
                    `SELECT * FROM goals 
                     WHERE user_id = ? 
                     AND target_weight LIKE ?`,
                    [userId, searchTerm]
                );
                results.goals = goals;
            }

        } catch (error) {
            console.error('Search error:', error);
        }
    }

    res.render('search', {
        username: req.session.username,
        query: query,
        results: results,
        hasResults: (results.supplements && results.supplements.length > 0) || 
                   (results.weightRecords && results.weightRecords.length > 0) || 
                   (results.goals && results.goals.length > 0)
    });
});

module.exports = router;


