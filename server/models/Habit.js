// server/models/Habit.js
const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    frequency: {
        type: String,
        required: true,
        default: 'daily'
    },
    completionDates: {
        type: [Date],
        default: []
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Habit', HabitSchema);
