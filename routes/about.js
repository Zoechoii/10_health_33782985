const express = require('express');
const router = express.Router();

// about page
router.get('/about', (req, res) => {
    res.render('about', { 
        username: req.session?.username || null,
        loggedIn: !!req.session?.userId 
    });
});

module.exports = router;


