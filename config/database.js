const mysql = require('mysql2/promise');
require('dotenv').config();

// Handle empty password
const password = process.env.HEALTH_PASSWORD && process.env.HEALTH_PASSWORD.trim() !== '' 
    ? process.env.HEALTH_PASSWORD 
    : undefined;

// Create pool without database to allow database creation
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

// Pool for general connections
const adminPool = mysql.createPool(poolConfig);

// Pool for database connections
const poolConfigWithDb = {
    ...poolConfig,
    database: process.env.HEALTH_DATABASE || 'health'
};

const pool = mysql.createPool(poolConfigWithDb);

// Initialize database and create tables if needed
async function initializeDatabase() {
    try {
        const connection = await adminPool.getConnection();
        
        const dbName = process.env.HEALTH_DATABASE || 'health';
        const [databases] = await connection.execute(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
            [dbName]
        );
        
        if (databases.length === 0) {
            await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        }
        
        connection.release();
        
        const dbConnection = await pool.getConnection();
        
        const [tables] = await dbConnection.execute(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
            [dbName]
        );
        
        const [favoriteFoodsTable] = await dbConnection.execute(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorite_foods'`,
            [dbName]
        );
        
        if (tables.length === 0) {
            await dbConnection.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    salt VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await dbConnection.execute(`
                CREATE TABLE IF NOT EXISTS weight_records (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    weight DECIMAL(5,2) NOT NULL,
                    record_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_date (user_id, record_date)
                )
            `);
            
            await dbConnection.execute(`
                CREATE TABLE IF NOT EXISTS goals (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    target_weight DECIMAL(5,2),
                    target_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            
            await dbConnection.execute(`
                CREATE TABLE IF NOT EXISTS supplements (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    supplement_name VARCHAR(100) NOT NULL,
                    dosage VARCHAR(50),
                    frequency VARCHAR(50),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            
            await dbConnection.execute(`
                CREATE TABLE IF NOT EXISTS favorite_foods (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    fdc_id INT NOT NULL,
                    food_name VARCHAR(255) NOT NULL,
                    nutrition_data JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_user_food (user_id, fdc_id)
                )
            `);
        } else {
            // Create favorite_foods table if missing
            if (favoriteFoodsTable.length === 0) {
                await dbConnection.execute(`
                    CREATE TABLE IF NOT EXISTS favorite_foods (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        fdc_id INT NOT NULL,
                        food_name VARCHAR(255) NOT NULL,
                        nutrition_data JSON,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_user_food (user_id, fdc_id)
                    )
                `);
            }
        }
        
        dbConnection.release();
        
    } catch (error) {
        console.error('Database initialization error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Please check your MySQL username and password in .env file');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please make sure MySQL server is running');
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Initialize on load
initializeDatabase();

module.exports = pool;


