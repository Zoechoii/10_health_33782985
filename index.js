const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';



// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Trust proxy for correct protocol/host detection (for reverse proxies)
app.set('trust proxy', true);

// Session (must be before baseUrl middleware to access req.session)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: 'auto', // Auto-detect secure based on protocol (works with reverse proxies)
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax', // Works with reverse proxies
        httpOnly: true
    },
    name: 'sessionId' // Explicit session name
}));

// Helper function to get base path from request
function getBasePath(req) {
    // First, check if base path is already stored in session
    if (req.session && req.session.basePath) {
        return req.session.basePath;
    }
    
    // Check multiple sources for base path
    const sources = [
        req.originalUrl,
        req.url,
        req.path,
        req.headers['x-forwarded-uri'] || req.headers['x-original-uri'],
        req.headers['referer'] || req.headers['referrer']
    ];
    
    for (const source of sources) {
        if (source && typeof source === 'string') {
            // Extract path from full URL if it's a referer header
            let pathToCheck = source;
            if (source.startsWith('http://') || source.startsWith('https://')) {
                try {
                    const url = new URL(source);
                    pathToCheck = url.pathname;
                } catch (e) {
                    // If URL parsing fails, try to extract path manually
                    const match = source.match(/https?:\/\/[^\/]+(\/usr\/426[^\s?]*)/);
                    if (match) {
                        pathToCheck = match[1].split('?')[0].split('#')[0];
                    }
                }
            }
            
            if (pathToCheck.startsWith('/usr/426')) {
                const basePath = '/usr/426';
                // Store in session for future requests
                if (req.session) {
                    req.session.basePath = basePath;
                }
                return basePath;
            }
        }
    }
    
    return '';
}

// Middleware to set baseUrl on request object for all requests
app.use((req, res, next) => {
    req.baseUrl = getBasePath(req);
    next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route - render home page directly (before other routes to avoid conflicts)
app.get('/', (req, res) => {
    res.render('home', { 
        username: req.session?.username || null,
        loggedIn: !!req.session?.userId 
    });
});

// Routes - load first
try {
    const homeRoutes = require('./routes/home');
    const aboutRoutes = require('./routes/about');
    const searchRoutes = require('./routes/search');
    const authRoutes = require('./routes/auth');
    const dashboardRoutes = require('./routes/dashboard');
    const weightRoutes = require('./routes/weight');
    const supplementRoutes = require('./routes/supplements');
    const nutritionRoutes = require('./routes/nutrition');

    if (!homeRoutes || !aboutRoutes || !searchRoutes || !authRoutes || !dashboardRoutes || !weightRoutes || !supplementRoutes || !nutritionRoutes) {
        console.error('Error: One or more route modules failed to load');
    }

    // Register all routes first
    app.use('/', authRoutes);
    app.use('/', homeRoutes);
    app.use('/', aboutRoutes);
    app.use('/', searchRoutes);
    app.use('/', dashboardRoutes);
    app.use('/', weightRoutes);
    app.use('/', supplementRoutes);
    app.use('/', nutritionRoutes);
} catch (error) {
    console.error('Error loading routes:', error);
    process.exit(1);
}

// 404 handler
app.use((req, res) => {
    // Ignore common browser auto-requests (favicon, common CSS names, etc.)
    const ignoredPaths = ['/favicon.ico', '/main.css', '/style.css', '/app.css', '/common.css'];
    if (ignoredPaths.includes(req.url)) {
        return res.status(404).end();
    }
    
    res.status(404).send(`404 - Page not found: ${req.url}`);
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
});


