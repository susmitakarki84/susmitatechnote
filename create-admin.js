const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');
const AuthUser = require('./register/authSchema');

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await AuthUser.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);
            await mongoose.disconnect();
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin1234@ADMIN', 10);

        // Create admin user
        const adminUser = new AuthUser({
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully!');
        console.log('Email:', adminUser.email);
        console.log('Password: admin123');
        console.log('Role:', adminUser.role);

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdminUser();