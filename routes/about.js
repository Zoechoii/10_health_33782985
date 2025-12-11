const express = require('express');
const router = express.Router();

// About page
router.get('/about', (req, res) => {
    res.render('about', { 
        username: req.session?.username || null,
        loggedIn: !!req.session?.userId 
    });
});

module.exports = router;


