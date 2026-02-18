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
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false // Required for Aiven/Managed DBs
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
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

initDb();

// Routes

/**
 * @route POST /register
 * @desc Register a new user
 */
app.post('/register', async (req, res) => {
    const { userId, username, password, email, phone } = req.body;

    // Simple validation
    if (!userId || !username || !password || !email) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE id = $1 OR email = $2', [userId, email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User ID or Email already registered.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store user
        await pool.query(
            'INSERT INTO users (id, username, password, email, phone) VALUES ($1, $2, $3, $4, $5)',
            [userId, username, hashedPassword, email, phone]
        );

        res.status(201).json({ message: 'Registration successful!' });
    } catch (err) {
        console.error('Registration Error:', err.message);
        if (err.message.includes('password authentication failed') || err.message.includes('Connection terminated')) {
            return res.status(500).json({ message: 'Database connection failed. Please check your DB_PASSWORD in the .env file.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

/**
 * @route POST /login
 * @desc Login a user
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    try {
        // Fetch user from DB
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Success
        res.status(200).json({
            message: 'Login successful!',
            redirect: 'https://movie-flix-beta-blond.vercel.app/'
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        if (err.message.includes('password authentication failed') || err.message.includes('Connection terminated')) {
            return res.status(500).json({ message: 'Database connection failed. Please check your DB_PASSWORD in the .env file.' });
        }
        res.status(500).json({ message: 'Server error during login.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
