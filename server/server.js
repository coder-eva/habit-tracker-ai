// server/server.js

// Load environment variables from .env file at the very top
require('dotenv').config();

// Import the Express.js framework
const express = require('express');
// Import the 'path' module to work with file and directory paths
const path = require('path');

// Import database connection function
const connectDB = require('./db/connection');

// NEW: Import route modules
const authRoutes = require('./routes/authRoutes');
const habitRoutes = require('./routes/habitRoutes');
const insightsRoutes = require('./routes/insightsRoutes');


// Create an Express application instance
const app = express();

// Define the port the server will listen on.
const PORT = process.env.PORT || 3000;

// --- MongoDB Connection ---
// Call the connectDB function to establish database connection
connectDB();


// --- Express Middleware ---
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '../client')));

// --- Routes for Serving HTML Pages ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'register.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'dashboard.html'));
});

app.get('/insights.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'insights.html'));
});

// --- NEW: Use imported API Routes ---
app.use('/', authRoutes); // For /register and /login (no /api prefix)
app.use('/api/habits', habitRoutes); // All habit routes will be prefixed with /api/habits
app.use('/api/insights', insightsRoutes); // All insights routes will be prefixed with /api/insights


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Open your browser and navigate to the address above.');
});
