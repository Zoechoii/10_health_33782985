const express = require('express');
const router = express.Router();

// home page
router.get('/home', (req, res) => {
    res.render('home', { 
        username: req.session?.username || null,
        loggedIn: !!req.session?.userId 
    });
});

module.exports = router;


