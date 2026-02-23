const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'wrongpassword';

async function testBruteForce() {
    console.log('Testing brute force protection...');
    console.log('--------------------------------');

    for (let i = 1; i <= 6; i++) {
        console.log(`Attempt ${i}:`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD
                })
            });

            const data = await response.json();

            console.log(`Status: ${response.status}`);
            console.log(`Message: ${data.message}`);
            if (data.lockoutTime) {
                console.log(`Lockout time: ${data.lockoutTime} seconds`);
            }

            console.log('--------------------------------');

            // If locked out, wait for the lockout time
            if (data.lockoutTime) {
                console.log(`Waiting ${data.lockoutTime} seconds before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, data.lockoutTime * 1000));
                console.log('--------------------------------');
            }

        } catch (error) {
            console.error('Error:', error.message);
            console.log('--------------------------------');
        }
    }

    console.log('Test completed!');
}

testBruteForce();
