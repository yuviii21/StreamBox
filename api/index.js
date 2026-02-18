const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log DB Connection Config for debugging (Redacted)
console.log('API Initializing with DB_HOST:', process.env.DB_HOST || 'MISSING');
console.log('DB_USER:', process.env.DB_USER || 'MISSING');
console.log('DB_NAME:', process.env.DB_NAME || 'MISSING');
console.log('DB_PORT:', process.env.DB_PORT || 'MISSING');

if (!process.env.DB_PASSWORD) {
    console.error('CRITICAL: DB_PASSWORD is not set in environment variables!');
}

// Database Connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
});

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

// Diagnostic endpoint to check DB connection
app.get('/api/db-check', async (req, res) => {
    try {
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
            tip: 'Check your Vercel Environment Variables and Aiven IP allowlisting.'
        });
    }
});

app.post('/api/register', async (req, res) => {
    try {
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
        console.error('Registration Error:', err.message);
        res.status(500).json({
            message: 'Registration failed.',
            error: err.message
        });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    try {
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
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Export the app for Vercel
module.exports = app;
