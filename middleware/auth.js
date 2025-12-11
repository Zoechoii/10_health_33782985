// Check login status
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        const baseUrl = req.baseUrl || '';
        res.redirect(baseUrl + '/login');
    }
}

// Prevent already logged-in users from accessing login/register pages
function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        const baseUrl = req.baseUrl || '';
        return res.redirect(baseUrl + '/dashboard');
    } else {
        return next();
    }
}

module.exports = {
    requireAuth,
    redirectIfAuthenticated
};

