const mysql = require('mysql2/promise');
require('dotenv').config();

// handle empty password
const password = process.env.HEALTH_PASSWORD && process.env.HEALTH_PASSWORD.trim() !== '' 
    ? process.env.HEALTH_PASSWORD 
    : undefined;

// create pool without database to allow database creation
const poolConfig = {
    host: process.env.HEALTH_HOST || 'localhost',
    user: process.env.HEALTH_USER || 'health_app',
    password: password,
    port: process.env.HEALTH_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
};

// pool for general connections
const adminPool = mysql.createPool(poolConfig);

// pool for database connections
const poolConfigWithDb = {
    ...poolConfig,
    database: process.env.HEALTH_DATABASE || 'health'
};

const pool = mysql.createPool(poolConfigWithDb);

// check if database exists on load
async function checkDatabase() {
    try {
        const connection = await adminPool.getConnection();
        
        const dbName = process.env.HEALTH_DATABASE || 'health';
        const [databases] = await connection.execute(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
            [dbName]
        );
        
        if (databases.length === 0) {
            console.warn(`⚠️  Database '${dbName}' not found. Please run: mysql -u ${process.env.HEALTH_USER || 'health_app'} -p < database/create_db.sql`);
        }
        
        connection.release();
        
    } catch (error) {
        console.error('Database check error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Please check your MySQL username and password in .env file');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please make sure MySQL server is running');
        }
    }
}

// check on load
checkDatabase();

module.exports = pool;


