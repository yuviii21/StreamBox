const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

// FORCE SSL BYPASS for Aiven self-signed certificates
// This is the most robust way to solve "self-signed certificate in certificate chain" on Vercel
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log DB Connection Config for debugging
const getEnvStatus = () => ({
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
    DB_USER: process.env.DB_USER ? 'SET' : 'MISSING',
    DB_NAME: process.env.DB_NAME ? 'SET' : 'MISSING',
});

// Database Connection Factory
const getPool = () => {
    // If DATABASE_URL is provided, use it directly (preferred)
    if (process.env.DATABASE_URL) {
        console.log('Using DATABASE_URL for connection');
        return new Pool({
            connectionString: process.env.DATABASE_URL.trim(),
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    // Fallback to individual components
    const status = getEnvStatus();
    const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT']
        .filter(k => !process.env[k]);

    if (missing.length > 0) {
        throw new Error(`MISSING_ENV_VARS: ${missing.join(', ')} (or DATABASE_URL). Please add them exactly in Vercel Settings.`);
    }

    // Force string and trim to avoid whitespace issues from copy-paste
    const user = String(process.env.DB_USER).trim();
    const password = String(process.env.DB_PASSWORD).trim();
    const host = String(process.env.DB_HOST).trim();
    const port = String(process.env.DB_PORT).trim();
    const database = String(process.env.DB_NAME).trim();

    // Use Connection String format which is more robust
    const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;

    return new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });
};

let pool;
try {
    pool = getPool();
} catch (e) {
    console.error('Initial Pool Error:', e.message);
}

// Initialize Database Table (Helper function)
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50)
            );
        `);
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

// Routes

app.get('/api', (req, res) => {
    res.json({ message: 'Auth API is working!', status: 'Running as Vercel Serverless Function' });
});

// Diagnostic endpoint to check DB connection
app.get('/api/db-check', async (req, res) => {
    try {
        if (!pool) pool = getPool();
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.status(200).json({
            message: 'Database connection successful!',
            time: result.rows[0].now,
            host: process.env.DB_HOST,
            user: process.env.DB_USER
        });
    } catch (err) {
        console.error('DB Check Error:', err.message);
        res.status(500).json({
            message: 'Database connection failed.',
            error: err.message,
            tip: err.message.includes('MISSING_ENV_VARS')
                ? 'Please add the missing variables in Vercel Settings.'
                : 'Check your Aiven IP allowlisting (0.0.0.0/0).'
        });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        if (!pool) pool = getPool();
        await initDb(); // Ensure table exists
        const { userId, username, password, email, phone } = req.body;

        if (!userId || !username || !password || !email) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const userExists = await pool.query('SELECT * FROM users WHERE id = $1 OR email = $2', [userId, email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User ID or Email already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (id, username, password, email, phone) VALUES ($1, $2, $3, $4, $5)',
            [userId, username, hashedPassword, email, phone]
        );

        res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({
            message: 'Registration failed at the database level.',
            error: err.message,
            code: err.code,
            tip: 'If this is a timeout, ensure Aiven allows 0.0.0.0/0 in Network Access.'
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        if (!pool) pool = getPool();
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide both username and password.' });
        }

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        res.status(200).json({
            message: 'Login successful!',
            redirect: 'https://movie-flix-beta-blond.vercel.app/'
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({
            message: 'Server error during login.',
            error: err.message,
            tip: err.message.includes('MISSING_ENV_VARS')
                ? 'Please add the missing variables in Vercel Settings.'
                : 'Check your database connection.'
        });
    }
});

// Export the app for Vercel
module.exports = app;
