// server/db/connection.js
const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        console.error('Error: MONGODB_URI is not defined in environment variables.');
        // In a real application, you might throw an error or exit process here
        // For development, we'll just log and let the app try to start (though it won't connect)
        process.exit(1); // Exiting the process is generally better for critical connection errors
    }

    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if connection fails
    }
};

module.exports = connectDB;
