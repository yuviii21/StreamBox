const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Database Setup
// NOTE: Vercel uses ephemeral storage. SQLite data will NOT persist after a redeploy on Vercel.
const dbPath = process.env.DATABASE_PATH || '/tmp/database.sqlite';
const db = new Database(dbPath);

// Initialize Database Table
const initDb = () => {
    try {
        db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT
            );
        `).run();
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};

// Routes

app.get('/api', (req, res) => {
    res.json({ message: 'Auth API is working!', dbType: 'SQLite' });
});

// Diagnostic endpoint to check DB connection
app.get('/api/db-check', (req, res) => {
    try {
        const row = db.prepare('SELECT date("now") as date').get();
        res.status(200).json({
            message: 'Database connection successful!',
            date: row.date,
            dbType: 'SQLite'
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
        initDb(); // Ensure table exists
        const { userId, username, password, email, phone } = req.body;

        if (!userId || !username || !password || !email) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        // Check if user already exists
        const userExists = db.prepare('SELECT * FROM users WHERE id = ? OR email = ?').get(userId, email);
        if (userExists) {
            return res.status(400).json({ message: 'User ID or Email already registered.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store user
        db.prepare(
            'INSERT INTO users (id, username, password, email, phone) VALUES (?, ?, ?, ?, ?)'
        ).run(userId, username, hashedPassword, email, phone);

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
        initDb(); // Ensure table exists
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide both username and password.' });
        }

        // Fetch user from DB
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(username);

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
