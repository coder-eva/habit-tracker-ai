// server/routes/habitRoutes.js
const express = require('express');
const router = express.Router(); // Create a new router instance
const mongoose = require('mongoose'); // Needed for ObjectId validation

// Import Mongoose Habit model
const Habit = require('../models/Habit');

// POST /api/habits - Create a new habit
router.post('/', async (req, res) => {
    const { name, description, frequency, userId } = req.body;

    // Input Validation
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Habit name is required.' });
    }
    if (name.trim().length < 3) {
        return res.status(400).json({ message: 'Habit name must be at least 3 characters long.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to create a habit.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) { // Added validation for userId
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }
    const validFrequencies = ['daily', 'weekly', 'custom'];
    if (frequency && !validFrequencies.includes(frequency)) {
        return res.status(400).json({ message: 'Invalid frequency provided.' });
    }

    try {
        const newHabit = new Habit({
            name: name.trim(),
            description: description ? description.trim() : '',
            frequency: frequency || 'daily',
            userId,
            completionDates: []
        });

        await newHabit.save();
        console.log('New habit created:', newHabit.name, 'for user:', newHabit.userId);
        res.status(201).json({ message: 'Habit created successfully!', habit: newHabit });

    } catch (error) {
        console.error('Error creating habit:', error);
        res.status(500).json({ message: 'Internal server error during habit creation.', error: error.message });
    }
});

// GET /api/habits - Get all habits for a specific user
router.get('/', async (req, res) => {
    const { userId } = req.query;

    // Input Validation
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to fetch habits.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    try {
        const habits = await Habit.find({ userId: userId }).sort({ createdAt: -1 });
        console.log(`Fetched ${habits.length} habits for user: ${userId}`);
        res.status(200).json(habits);

    } catch (error) {
        console.error('Error fetching habits:', error);
        res.status(500).json({ message: 'Internal server error during habit fetching.', error: error.message });
    }
});

// PUT /api/habits/:id - Update an existing habit
router.put('/:id', async (req, res) => {
    const habitId = req.params.id;
    const { name, description, frequency, userId } = req.body;

    // Input Validation
    if (!mongoose.Types.ObjectId.isValid(habitId)) {
        return res.status(400).json({ message: 'Invalid Habit ID format.' });
    }
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: 'Habit name is required for update.' });
    }
    if (name.trim().length < 3) {
        return res.status(400).json({ message: 'Habit name must be at least 3 characters long.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required for update.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }
    const validFrequencies = ['daily', 'weekly', 'custom'];
    if (frequency && !validFrequencies.includes(frequency)) {
        return res.status(400).json({ message: 'Invalid frequency provided.' });
    }

    try {
        const updatedHabit = await Habit.findOneAndUpdate(
            { _id: habitId, userId: userId },
            { name: name.trim(), description: description ? description.trim() : undefined, frequency: frequency },
            { new: true, runValidators: true }
        );

        if (!updatedHabit) {
            return res.status(404).json({ message: 'Habit not found or does not belong to this user.' });
        }

        console.log('Habit updated:', updatedHabit.name, 'ID:', updatedHabit._id);
        res.status(200).json({ message: 'Habit updated successfully!', habit: updatedHabit });

    } catch (error) {
        console.error('Error updating habit:', error);
        res.status(500).json({ message: 'Internal server error during habit update.', error: error.message });
    }
});

// DELETE /api/habits/:id - Delete a habit
router.delete('/:id', async (req, res) => {
    const habitId = req.params.id;
    const { userId } = req.body;

    // Input Validation
    if (!mongoose.Types.ObjectId.isValid(habitId)) {
        return res.status(400).json({ message: 'Invalid Habit ID format.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required for deletion.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    try {
        const deletedHabit = await Habit.findOneAndDelete({ _id: habitId, userId: userId });

        if (!deletedHabit) {
            return res.status(404).json({ message: 'Habit not found or does not belong to this user.' });
        }

        console.log('Habit deleted:', deletedHabit.name, 'ID:', deletedHabit._id);
        res.status(200).json({ message: 'Habit deleted successfully!', habit: deletedHabit });

    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ message: 'Internal server error during habit deletion.', error: error.message });
    }
});

// PUT /api/habits/:id/track - Mark a habit as done
router.put('/:id/track', async (req, res) => {
    const habitId = req.params.id;
    const { userId } = req.body;

    // Input Validation
    if (!mongoose.Types.ObjectId.isValid(habitId)) {
        return res.status(400).json({ message: 'Invalid Habit ID format.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required for tracking.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    try {
        const habit = await Habit.findOne({ _id: habitId, userId: userId });

        if (!habit) {
            return res.status(404).json({ message: 'Habit not found or does not belong to this user.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alreadyCompletedToday = habit.completionDates.some(date => {
            const completionDate = new Date(date);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === today.getTime();
        });

        if (alreadyCompletedToday) {
            return res.status(200).json({ message: 'Habit already marked as done today!', habit });
        }

        habit.completionDates.push(today);
        await habit.save();

        console.log(`Habit '${habit.name}' (${habitId}) marked as done for user ${userId}.`);
        res.status(200).json({ message: 'Habit marked as done successfully!', habit });

    } catch (error) {
        console.error('Error tracking habit:', error);
        res.status(500).json({ message: 'Internal server error during tracking.', error: error.message });
    }
});

module.exports = router; // Export the router
