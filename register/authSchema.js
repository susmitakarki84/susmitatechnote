/**
 * Authentication User Schema
 * MongoDB schema for storing user authentication data
 */

const mongoose = require('mongoose');

const AuthUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'user'],
        default: 'user',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for faster email lookups
AuthUserSchema.index({ email: 1 });

const AuthUser = mongoose.model('AuthUser', AuthUserSchema);

module.exports = AuthUser;
