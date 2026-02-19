// FORCE SSL BYPASS for Aiven/Supabase if needed (MUST BE FIRST LINE)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
console.log("DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":****@") : "undefined");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize Database Table
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
    res.json({ message: 'Auth API is working!', dbType: 'PostgreSQL' });
});

// Diagnostic endpoint to check DB connection
app.get('/api/db-check', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.status(200).json({
            message: 'Database connection successful!',
            time: result.rows[0].now,
            dbType: 'PostgreSQL'
        });
    } catch (err) {
        console.error('DB Check Error:', err.message);
        res.status(500).json({
            message: 'Database connection failed.',
            error: err.message
        });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        await initDb();
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
            error: err.message
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        await initDb();
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
            error: err.message
        });
    }
});

// Export the app for Vercel
module.exports = app;
