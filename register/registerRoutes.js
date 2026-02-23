/**
 * Registration API Routes
 * Handles user registration with bcrypt password hashing
 */

const bcrypt = require('bcrypt');
const AuthUser = require('./authSchema');
const { validateEmail, validatePassword } = require('./validation');

/**
 * Register a new user
 * POST /api/register
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerUser(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate password strength
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
            });
        }

        // Check if user already exists
        const existingUser = await AuthUser.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password with bcrypt (10 salt rounds)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new AuthUser({
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Registration successful! You can now login.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
}

module.exports = {
    registerUser
};
