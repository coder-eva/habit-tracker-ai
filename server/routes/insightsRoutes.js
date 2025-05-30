// server/routes/insightsRoutes.js
const express = require('express');
const router = express.Router(); // Create a new router instance
const mongoose = require('mongoose'); // Needed for ObjectId validation

// Import Mongoose Habit model
const Habit = require('../models/Habit');

// GET /api/insights - Get insights for a specific user
router.get('/', async (req, res) => {
    const { userId } = req.query;

    // Input Validation
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required for insights.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    try {
        const habits = await Habit.find({ userId: userId });

        const insights = habits.map(habit => {
            const normalizedCompletionDates = habit.completionDates
                .map(date => {
                    const d = new Date(date);
                    d.setHours(0, 0, 0, 0);
                    return d;
                })
                .sort((a, b) => a.getTime() - b.getTime());

            const totalCompletions = normalizedCompletionDates.length;

            let longestStreak = 0;
            let currentStreak = 0;
            if (totalCompletions > 0) {
                currentStreak = 1;
                longestStreak = 1;

                for (let i = 1; i < totalCompletions; i++) {
                    const prevDate = new Date(normalizedCompletionDates[i - 1]);
                    const currDate = new Date(normalizedCompletionDates[i]);

                    const diffTime = currDate.getTime() - prevDate.getTime();
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);

                    if (diffDays === 1) {
                        currentStreak++;
                    } else if (diffDays > 1) {
                        currentStreak = 1;
                    }
                    longestStreak = Math.max(longestStreak, currentStreak);
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                const lastCompleted = normalizedCompletionDates[normalizedCompletionDates.length - 1];
                if (lastCompleted && (lastCompleted.getTime() === today.getTime() || lastCompleted.getTime() === yesterday.getTime())) {
                    let actualCurrentStreak = 0;
                    let tempDate = today;
                    for (let i = normalizedCompletionDates.length - 1; i >= 0; i--) {
                        const completionDay = normalizedCompletionDates[i];
                        if (completionDay.getTime() === tempDate.getTime()) {
                            actualCurrentStreak++;
                            tempDate.setDate(tempDate.getDate() - 1);
                        } else if (completionDay.getTime() < tempDate.getTime()) {
                            break;
                        }
                    }
                    longestStreak = Math.max(longestStreak, actualCurrentStreak);
                }
            }


            const dayOfWeekCounts = new Array(7).fill(0);
            normalizedCompletionDates.forEach(date => {
                dayOfWeekCounts[date.getDay()]++;
            });
            const mostConsistentDayIndex = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const mostConsistentDay = days[mostConsistentDayIndex] || 'N/A';
            const mostConsistentDayCount = Math.max(...dayOfWeekCounts);


            return {
                habitId: habit._id,
                name: habit.name,
                totalCompletions: totalCompletions,
                longestStreak: longestStreak,
                mostConsistentDay: mostConsistentDay,
                mostConsistentDayCount: mostConsistentDayCount,
            };
        });

        console.log(`Generated insights for ${insights.length} habits for user: ${userId}`);
        res.status(200).json(insights);

    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ message: 'Internal server error during insights generation.', error: error.message });
    }
});

// GET /api/habits/:id/completion-data - Get completion data for a specific habit for charting
router.get('/:id/completion-data', async (req, res) => {
    const habitId = req.params.id;
    const { userId } = req.query;

    // Input Validation
    if (!mongoose.Types.ObjectId.isValid(habitId)) {
        return res.status(400).json({ message: 'Invalid Habit ID format.' });
    }
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    try {
        const habit = await Habit.findOne({ _id: habitId, userId: userId });

        if (!habit) {
            return res.status(404).json({ message: 'Habit not found or does not belong to this user.' });
        }

        const dataPoints = [];
        const labels = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedDatesNormalized = habit.completionDates.map(date => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        });

        for (let i = 29; i >= 0; i--) {
            const day = new Date(today);
            day.setDate(today.getDate() - i);
            day.setHours(0, 0, 0, 0);

            labels.push(day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            const isCompleted = completedDatesNormalized.includes(day.getTime());
            dataPoints.push(isCompleted ? 1 : 0);
        }

        console.log(`Generated completion data for habit ${habitId} for the last 30 days.`);
        res.status(200).json({
            labels: labels,
            data: dataPoints
        });

    } catch (error) {
        console.error('Error generating completion data:', error);
        res.status(500).json({ message: 'Internal server error during data generation.', error: error.message });
    }
});

module.exports = router; // Export the router
