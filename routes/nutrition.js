const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { searchFoods, getFoodDetails, formatNutritionInfo, getCommonNutrients } = require('../utils/usda');

// nutrition search page
router.get('/nutrition', requireAuth, async (req, res) => {
    try {
        const query = req.query.q || '';
        let searchResults = [];
        let foodDetails = null;
        let nutritionInfo = null;
        let commonNutrients = null;
        let error = null;

        if (query.trim()) {
            try {
                const searchData = await searchFoods(query, 20);
                searchResults = searchData.foods || [];

                const fdcId = req.query.fdcId;
                if (fdcId) {
                    const details = await getFoodDetails(parseInt(fdcId));
                    foodDetails = details;
                    nutritionInfo = formatNutritionInfo(details);
                    commonNutrients = getCommonNutrients(nutritionInfo);
                }
            } catch (err) {
                console.error('Nutrition search error:', err);
                error = 'Failed to search for foods. Please try again.';
            }
        }

        const success = req.query.success === 'saved' ? 'saved' : null;

        res.render('nutrition', {
            username: req.session.username,
            query: query,
            searchResults: searchResults,
            foodDetails: foodDetails,
            nutritionInfo: nutritionInfo,
            commonNutrients: commonNutrients,
            error: error,
            success: success
        });
    } catch (error) {
        console.error('Nutrition page error:', error);
        res.status(500).send('Server error occurred.');
    }
});

// save favorite food
router.post('/nutrition/save', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { fdcId, foodName, nutritionData } = req.body;
        const baseUrl = req.baseUrl || '';

        if (!fdcId || !foodName) {
            return res.redirect(baseUrl + '/nutrition?error=invalid_data');
        }

        const [existing] = await pool.execute(
            'SELECT * FROM favorite_foods WHERE user_id = ? AND fdc_id = ?',
            [userId, fdcId]
        );

        if (existing.length > 0) {
            return res.redirect(baseUrl + '/nutrition?error=already_saved');
        }

        await pool.execute(
            'INSERT INTO favorite_foods (user_id, fdc_id, food_name, nutrition_data) VALUES (?, ?, ?, ?)',
            [userId, fdcId, foodName, JSON.stringify(nutritionData || {})]
        );

        res.redirect(baseUrl + '/nutrition?success=saved&q=' + encodeURIComponent(req.body.query || ''));
    } catch (error) {
        console.error('Save food error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/nutrition?error=save_failed');
    }
});

// get saved favorite foods
router.get('/nutrition/favorites', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const [favorites] = await pool.execute(
            'SELECT * FROM favorite_foods WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        const success = req.query.success === 'deleted' ? 'deleted' : null;
        const error = req.query.error === 'delete_failed' ? 'delete_failed' : null;

        res.render('nutrition-favorites', {
            username: req.session.username,
            favorites: favorites,
            success: success,
            error: error
        });
    } catch (error) {
        console.error('Favorites page error:', error);
        res.status(500).send('Server error occurred.');
    }
});

// delete favorite food
router.post('/nutrition/favorites/delete/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const favoriteId = req.params.id;

        await pool.execute(
            'DELETE FROM favorite_foods WHERE id = ? AND user_id = ?',
            [favoriteId, userId]
        );

        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/nutrition/favorites?success=deleted');
    } catch (error) {
        console.error('Delete favorite error:', error);
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/nutrition/favorites?error=delete_failed');
    }
});

// get food details API (JSON)
router.get('/nutrition/api/details/:fdcId', requireAuth, async (req, res) => {
    try {
        const fdcId = parseInt(req.params.fdcId);
        const details = await getFoodDetails(fdcId);
        const nutritionInfo = formatNutritionInfo(details);
        const commonNutrients = getCommonNutrients(nutritionInfo);

        res.json({
            success: true,
            foodDetails: {
                fdcId: details.fdcId,
                description: nutritionInfo.description,
                brandOwner: nutritionInfo.brandOwner,
                ingredients: nutritionInfo.ingredients
            },
            commonNutrients: commonNutrients
        });
    } catch (error) {
        console.error('Get food details API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch food details'
        });
    }
});

module.exports = router;

