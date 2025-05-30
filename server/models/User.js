// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Keep bcrypt here if you want to use it for pre-save hooks or instance methods

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    passwordHash: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optional: Add a pre-save hook to hash password before saving (more secure)
// UserSchema.pre('save', async function(next) {
//     if (this.isModified('passwordHash')) { // Only hash if password was changed
//         const saltRounds = 10;
//         this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
//     }
//     next();
// });

// Optional: Add a method to compare passwords (for login)
// UserSchema.methods.comparePassword = async function(candidatePassword) {
//     return bcrypt.compare(candidatePassword, this.passwordHash);
// };


module.exports = mongoose.model('User', UserSchema);
