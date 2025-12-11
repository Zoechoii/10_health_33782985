const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// initialize database from SQL file
async function initializeDatabaseFromSQL() {
    try {
        const password = process.env.HEALTH_PASSWORD && process.env.HEALTH_PASSWORD.trim() !== '' 
            ? process.env.HEALTH_PASSWORD 
            : undefined;

        const connection = await mysql.createConnection({
            host: process.env.HEALTH_HOST || 'localhost',
            user: process.env.HEALTH_USER || 'health_app',
            password: password,
            port: process.env.HEALTH_PORT || 3306,
            multipleStatements: true
        });

        const sqlFilePath = path.join(__dirname, 'database', 'create_db.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        await connection.query(sqlContent);
        await connection.end();

        console.log('Database initialized from create_db.sql');
    } catch (error) {
        console.error('Database initialization error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Please check your MySQL username and password in .env file');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please make sure MySQL server is running');
        }
    }
}

// initialize database on startup
initializeDatabaseFromSQL();



// middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// trust proxy for reverse proxy
app.set('trust proxy', true);

// session setup (must be before baseUrl middleware)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: 'auto', // auto-detect based on protocol
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax', // works with reverse proxy
        httpOnly: true
    },
    name: 'sessionId' // session cookie name
}));

// get base path from request
function getBasePath(req) {
    // use stored base path from session if available
    if (req.session && req.session.basePath) {
        return req.session.basePath;
    }
    
    // check multiple sources for base path
    const sources = [
        req.originalUrl,
        req.url,
        req.path,
        req.headers['x-forwarded-uri'] || req.headers['x-original-uri'],
        req.headers['referer'] || req.headers['referrer']
    ];
    
    for (const source of sources) {
        if (source && typeof source === 'string') {
            // extract path from full URL if it's a referer header
            let pathToCheck = source;
            if (source.startsWith('http://') || source.startsWith('https://')) {
                try {
                    const url = new URL(source);
                    pathToCheck = url.pathname;
                } catch (e) {
                    // if URL parsing fails, extract path manually
                    const match = source.match(/https?:\/\/[^\/]+(\/usr\/426[^\s?]*)/);
                    if (match) {
                        pathToCheck = match[1].split('?')[0].split('#')[0];
                    }
                }
            }
            
            if (pathToCheck.startsWith('/usr/426')) {
                const basePath = '/usr/426';
                // store in session for future requests
                if (req.session) {
                    req.session.basePath = basePath;
                }
                return basePath;
            }
        }
    }
    
    return '';
}

// middleware to set baseUrl on all requests
app.use((req, res, next) => {
    req.baseUrl = getBasePath(req);
    next();
});

// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// static files
app.use(express.static(path.join(__dirname, 'public')));

// root route - render home page (before other routes to avoid conflicts)
app.get('/', (req, res) => {
    res.render('home', { 
        username: req.session?.username || null,
        loggedIn: !!req.session?.userId 
    });
});

// load routes
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

    // register all routes
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
    // ignore common browser auto-requests (favicon, CSS, etc.)
    const ignoredPaths = ['/favicon.ico', '/main.css', '/style.css', '/app.css', '/common.css'];
    if (ignoredPaths.includes(req.url)) {
        return res.status(404).end();
    }
    
    res.status(404).send(`404 - Page not found: ${req.url}`);
});

// start server
app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
});


