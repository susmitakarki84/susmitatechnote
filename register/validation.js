/**
 * Validation Utilities for Registration System
 * Contains email and password validation functions
 */

/**
 * Validates email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates password strength
 * Requirements: Minimum 8 characters, at least one uppercase, one lowercase, one number
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

module.exports = {
    validateEmail,
    validatePassword
};
