const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Database Connection (Supabase/PostgreSQL)
console.log("DB URL Check (Redacted):", process.env.DATABASE_URL ? "URL is set" : "URL is UNDEFINED");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Supabase works better with this for local/cloud flexibility
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
        console.log('Database initialized successfully (Supabase/PostgreSQL).');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

initDb();

// API Routes

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is healthy!', dbType: 'PostgreSQL (Supabase)' });
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
            dbType: 'PostgreSQL (Supabase)'
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

// Middleware to log requests (helpful for debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Handle React routing, return all requests to React app
// Using middleware as a catch-all to avoid Express 5 wildcard issues
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
