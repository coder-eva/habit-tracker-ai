// server/routes/authRoutes.js
const express = require('express');
const router = express.Router(); // Create a new router instance
const bcrypt = require('bcryptjs');
const validator = require('validator'); // For email validation

// Import Mongoose User model
const User = require('../models/User');

// POST /register - Handles user registration
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    console.log('Registration attempt received:');
    console.log('  Username:', username);
    console.log('  Email:', email);

    // Input Validation
    if (!username || !email || !password || !confirmPassword) {
        console.log('Registration failed: All fields are required.');
        return res.status(400).json({ message: 'All fields are required.' });
    }
    if (username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long.' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (password !== confirmPassword) {
        console.log('Registration failed: Passwords do not match.');
        return res.status(400).json({ message: 'Passwords do not match.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username }] });
        if (existingUser) {
            console.log('Registration failed: User already exists for email/username:', email, username);
            return res.status(409).json({ message: 'User with that email or username already exists.' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            email: email.toLowerCase(),
            passwordHash
        });

        const savedUser = await newUser.save();
        console.log('User registered successfully:', savedUser.username, 'ID:', savedUser._id);
        res.status(201).json({ message: 'Registration successful! Please log in.', userId: savedUser._id });

    } catch (error) {
        console.error('Error during registration:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User with that email or username already exists.' });
        }
        res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
    }
});

// POST /login - Handles user login
router.post('/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    // Input Validation
    if (!usernameOrEmail || !password) {
        return res.status(400).json({ message: 'Username/Email and password are required.' });
    }

    try {
        const user = await User.findOne({
            $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail }]
        });

        if (!user) {
            console.log('Login failed: User not found for:', usernameOrEmail);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            console.log('Login failed: Incorrect password for user:', user.username);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log('User logged in:', user.username);
        res.status(200).json({ message: 'Login successful!', userId: user._id, username: user.username });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error during login.', error: error.message });
    }
});

module.exports = router; // Export the router
