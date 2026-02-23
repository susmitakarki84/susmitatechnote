/**
 * Registration Form Logic
 * Client-side JavaScript for handling registration form submission
 */

const API_BASE_URL = 'http://localhost:5000';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const message = document.getElementById('message');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const registerBtn = registerForm.querySelector('.register-btn');

/**
 * Handle form submission
 */
registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Clear previous messages
    message.classList.remove('show', 'success', 'error');

    // Validate passwords match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    // Disable button during registration
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage(data.message, 'success');

            // Clear form
            registerForm.reset();

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Connection error. Please check if the server is running.', 'error');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register';
    }
});

/**
 * Display message to user
 * @param {string} text - Message text
 * @param {string} type - Message type ('success' or 'error')
 */
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message show ${type}`;
}

/**
 * Real-time password validation feedback (optional enhancement)
 */
passwordInput.addEventListener('input', function () {
    const password = this.value;

    // You can add visual feedback here for password requirements
    // For example, highlighting which requirements are met
});

/**
 * Confirm password matching feedback (optional enhancement)
 */
confirmPasswordInput.addEventListener('input', function () {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    // You can add visual feedback here for password matching
    // For example, showing a checkmark when passwords match
});
