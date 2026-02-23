require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const FormData = require('form-data');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Import registration components
const { registerUser } = require('./register/registerRoutes');
const AuthUser = require('./register/authSchema');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Supabase Configuration
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

// ================= CREATE UPLOADS FOLDER (Optional - for temporary storage) =================
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ================= MIDDLEWARE =================
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));

// Serve index.html as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ================= LOGIN ATTEMPT TRACKING =================
const loginAttempts = new Map(); // key: email, value: { attempts: number, lockoutUntil: Date }

// Custom login limiter middleware
const loginLimiter = (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const attemptData = loginAttempts.get(normalizedEmail);
    const now = Date.now();

    // Check if user is still locked out
    if (attemptData && attemptData.lockoutUntil > now) {
        const remainingTime = Math.ceil((attemptData.lockoutUntil - now) / 1000);
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.',
            lockoutTime: remainingTime,
            attempts: attemptData.attempts
        });
    }

    // Reset attempts if lockout period has passed
    if (attemptData && attemptData.lockoutUntil <= now) {
        loginAttempts.delete(normalizedEmail);
    }

    next();
};

// Function to increment login attempts
const incrementLoginAttempts = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const attemptData = loginAttempts.get(normalizedEmail) || { attempts: 0, lockoutUntil: null };

    attemptData.attempts++;

    // Lockout after 5 failed attempts for 200 seconds
    if (attemptData.attempts >= 5) {
        attemptData.lockoutUntil = Date.now() + 200 * 1000; // 200 seconds lockout
    }

    loginAttempts.set(normalizedEmail, attemptData);
};

// Function to reset login attempts (on successful login)
const resetLoginAttempts = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    loginAttempts.delete(normalizedEmail);
};

// ================= MONGODB CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Error:', err.message));

// ================= SCHEMAS =================

// Regular User Schema (for user management)
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    joined: { type: Date, default: Date.now }
}));

// User Upload Model
const UserUpload = require('./models/UserUpload');

// Material Schema - UPDATED to store ImgBB URL instead of local path
const Material = mongoose.model('Material', new mongoose.Schema({
    title: String,
    type: String,
    semester: String,
    subject: String,
    description: String,
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
}));

// Token Blacklist Schema (for logout)
const TokenBlacklist = mongoose.model('TokenBlacklist', new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
}));

// ================= JWT MIDDLEWARE =================

// Verify JWT token
async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Check if token is blacklisted
        const blacklisted = await TokenBlacklist.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ success: false, message: 'Token has been invalidated' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

// ================= MULTER CONFIG - UPDATED to use memory storage =================
const storage = multer.memoryStorage(); // Store in memory instead of disk
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// ================= AUTHENTICATION ROUTES =================

// 📝 REGISTER (using modular registration route)
app.post('/api/register', registerUser);

// 🔐 LOGIN (ADMIN ONLY)
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Find user
        const user = await AuthUser.findOne({ email: normalizedEmail });

        // If user doesn't exist
        if (!user) {
            incrementLoginAttempts(normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            incrementLoginAttempts(normalizedEmail);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user role is NOT admin - redirect to index.html
        if (user.role !== 'admin') {
            incrementLoginAttempts(normalizedEmail);
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.',
                redirect: '/index.html'
            });
        }

        // Reset attempt count on successful login
        resetLoginAttempts(normalizedEmail);

        // Generate JWT token (only for admin)
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: {
                email: user.email,
                id: user._id,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// 🚪 LOGOUT
app.post('/api/logout', verifyToken, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);

        // Decode token to get expiration
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);

        // Add token to blacklist
        const blacklistedToken = new TokenBlacklist({
            token: token,
            expiresAt: expiresAt
        });

        await blacklistedToken.save();

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
});

// ================= USER MANAGEMENT ROUTES (ADMIN ONLY) =================

// 📋 GET ALL USERS
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        // Only allow superadmin and admin to access user list
        if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const users = await AuthUser.find({}, '-password').sort({ createdAt: -1 });
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching users'
        });
    }
});

// ➕ CREATE NEW USER
app.post('/api/users', verifyToken, async (req, res) => {
    try {
        // Only allow superadmin and admin to create users
        if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const { email, password, role = 'user' } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Admin can only create users with 'user' role
        if (role !== 'user') {
            return res.status(403).json({
                success: false,
                message: 'You can only create users with "user" role'
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

        // Hash password with bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user (default role is user)
        const newUser = new AuthUser({
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'user' // Always create as user role
        });

        await newUser.save();

        // Return user without password
        const userWithoutPassword = await AuthUser.findById(newUser._id).select('-password');

        res.status(201).json({
            success: true,
            message: 'User created successfully!',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during user creation'
        });
    }
});

// ✏️ UPDATE USER ROLE
app.put('/api/users/:id/role', verifyToken, async (req, res) => {
    try {
        // Role update is disabled - users cannot change roles
        return res.status(403).json({
            success: false,
            message: 'Role update is disabled. Please contact superadmin for role changes.'
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during role update'
        });
    }
});

// 🔄 CHANGE USER PASSWORD
app.put('/api/users/:id/password', verifyToken, async (req, res) => {
    try {
        // Only allow superadmin, admin, or the user themselves to change password
        const userId = req.params.id;
        const { newPassword } = req.body;

        const user = await AuthUser.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Admin can only change password for users with 'user' role
        if (user.role !== 'user' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'You can only manage passwords for users with "user" role'
            });
        }

        // Hash new password directly (admin doesn't need old password)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await AuthUser.findByIdAndUpdate(
            userId,
            { password: hashedPassword }
        );

        res.json({
            success: true,
            message: 'Password changed successfully!'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password change'
        });
    }
});

// 🗑 DELETE USER
app.delete('/api/users/:id', verifyToken, async (req, res) => {
    try {
        // Only allow superadmin and admin to delete users
        if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const userId = req.params.id;

        // Check if target user exists
        const targetUser = await AuthUser.findById(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Admin can only delete users with 'user' role
        if (targetUser.role !== 'user') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete users with "user" role'
            });
        }

        // Prevent deleting yourself
        if (req.user.userId === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const deletedUser = await AuthUser.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during user deletion'
        });
    }
});

// ================= PROTECTED ROUTES =================

// 📤 UPLOAD MATERIAL (Protected) - UPDATED to upload to Supabase Storage
app.post('/upload-material', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { title, type, semester, subject, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Validate file type (only PDF allowed)
        if (file.mimetype !== 'application/pdf') {
            return res.status(400).json({ message: 'Only PDF files are allowed!' });
        }

        // Generate unique filename to avoid duplicates
        const uniqueFileName = `${Date.now()}-${file.originalname}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .upload(uniqueFileName, file.buffer, {
                contentType: 'application/pdf',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ message: 'Failed to upload file to storage' });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .getPublicUrl(uniqueFileName);

        const fileUrl = urlData.publicUrl;
        const fileName = file.originalname;

        // Save to database with Supabase URL
        const newMaterial = new Material({
            title,
            type,
            semester,
            subject,
            description,
            fileName: fileName,
            fileUrl: fileUrl  // Store Supabase URL instead of local path
        });

        await newMaterial.save();

        res.status(201).json({
            message: "Material uploaded successfully!",
            fileUrl: fileUrl,
            fileName: fileName
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(400).json({ message: error.message });
    }
});

// 📚 FETCH MATERIALS (Protected)
app.get('/materials', verifyToken, async (req, res) => {
    try {
        const materials = await Material.find().sort({ uploadedAt: -1 });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: "Error fetching materials" });
    }
});

// ✏️ UPDATE MATERIAL (Protected)
app.put('/materials/:id', verifyToken, async (req, res) => {
    try {
        const materialId = req.params.id;
        const updateData = req.body;

        const updatedMaterial = await Material.findByIdAndUpdate(
            materialId,
            updateData,
            { new: true }
        );

        if (!updatedMaterial) {
            return res.status(404).json({ message: "Material not found" });
        }

        res.json({
            message: "Material updated successfully",
            material: updatedMaterial
        });
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ message: "Error updating material" });
    }
});

// 🗑 DELETE MATERIAL (Protected)
app.delete('/materials/:id', verifyToken, async (req, res) => {
    try {
        const materialId = req.params.id;
        const deletedMaterial = await Material.findByIdAndDelete(materialId);

        if (!deletedMaterial) {
            return res.status(404).json({ message: "Material not found" });
        }

        res.json({ message: "Material deleted successfully" });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ message: "Error deleting material" });
    }
});

// ================= USER UPLOAD MANAGEMENT ROUTES =================

// 📥 GET ALL PENDING USER UPLOADS (ADMIN ONLY)
app.get('/api/user-uploads/pending', verifyToken, async (req, res) => {
    try {
        const pendingUploads = await UserUpload.find({ status: 'pending' }).sort({ uploadedAt: -1 });
        res.json(pendingUploads);
    } catch (error) {
        console.error('Error fetching pending uploads:', error);
        res.status(500).json({ message: "Error fetching pending uploads" });
    }
});

// 📥 GET ALL USER UPLOADS (ADMIN ONLY)
app.get('/api/user-uploads', verifyToken, async (req, res) => {
    try {
        const uploads = await UserUpload.find().sort({ uploadedAt: -1 });
        res.json(uploads);
    } catch (error) {
        console.error('Error fetching uploads:', error);
        res.status(500).json({ message: "Error fetching uploads" });
    }
});

// ✅ APPROVE USER UPLOAD (ADMIN ONLY)
app.put('/api/user-uploads/:id/approve', verifyToken, async (req, res) => {
    try {
        const uploadId = req.params.id;
        const updatedUpload = await UserUpload.findByIdAndUpdate(
            uploadId,
            { status: 'approved' },
            { new: true }
        );

        if (!updatedUpload) {
            return res.status(404).json({ message: "Upload not found" });
        }

        res.json({
            message: "Upload approved successfully",
            upload: updatedUpload
        });
    } catch (error) {
        console.error('Error approving upload:', error);
        res.status(500).json({ message: "Error approving upload" });
    }
});

// ❌ REJECT USER UPLOAD (ADMIN ONLY)
app.put('/api/user-uploads/:id/reject', verifyToken, async (req, res) => {
    try {
        const uploadId = req.params.id;
        const updatedUpload = await UserUpload.findByIdAndUpdate(
            uploadId,
            { status: 'rejected' },
            { new: true }
        );

        if (!updatedUpload) {
            return res.status(404).json({ message: "Upload not found" });
        }

        res.json({
            message: "Upload rejected successfully",
            upload: updatedUpload
        });
    } catch (error) {
        console.error('Error rejecting upload:', error);
        res.status(500).json({ message: "Error rejecting upload" });
    }
});

// ⏳ SET TO PENDING (ADMIN ONLY)
app.put('/api/user-uploads/:id/pending', verifyToken, async (req, res) => {
    try {
        const uploadId = req.params.id;
        const updatedUpload = await UserUpload.findByIdAndUpdate(
            uploadId,
            { status: 'pending' },
            { new: true }
        );

        if (!updatedUpload) {
            return res.status(404).json({ message: "Upload not found" });
        }

        res.json({
            message: "Upload status set to pending",
            upload: updatedUpload
        });
    } catch (error) {
        console.error('Error setting to pending:', error);
        res.status(500).json({ message: "Error setting to pending" });
    }
});

// ✏️ UPDATE USER UPLOAD (ADMIN ONLY)
app.put('/api/user-uploads/:id', verifyToken, async (req, res) => {
    try {
        const uploadId = req.params.id;
        const updateData = req.body;

        const updatedUpload = await UserUpload.findByIdAndUpdate(
            uploadId,
            updateData,
            { new: true }
        );

        if (!updatedUpload) {
            return res.status(404).json({ message: "Upload not found" });
        }

        res.json({
            message: "Upload updated successfully",
            upload: updatedUpload
        });
    } catch (error) {
        console.error('Error updating upload:', error);
        res.status(500).json({ message: "Error updating upload" });
    }
});

// 🗑 DELETE USER UPLOAD (ADMIN ONLY)
app.delete('/api/user-uploads/:id', verifyToken, async (req, res) => {
    try {
        const uploadId = req.params.id;
        const deletedUpload = await UserUpload.findByIdAndDelete(uploadId);

        if (!deletedUpload) {
            return res.status(404).json({ message: "Upload not found" });
        }

        res.json({ message: "Upload deleted successfully" });
    } catch (error) {
        console.error('Error deleting upload:', error);
        res.status(500).json({ message: "Error deleting upload" });
    }
});

// ================= USER MANAGEMENT ROUTES =================

// 👤 ADD USER
app.post('/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: "Email already exists" });
    }
});

// 👥 GET ALL USERS (PROTECTED)
app.get('/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find().sort({ joined: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// 👥 GET ALL USERS - Alias for /api/users (PROTECTED)
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find().sort({ joined: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// ✏️ UPDATE USER (PROTECTED)
app.put('/users/:id', verifyToken, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, password },
            { new: true }
        );
        res.json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: "Error updating user" });
    }
});

// 🗑 DELETE USER (PROTECTED)
app.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(400).json({ message: "Error deleting user" });
    }
});

// ================= CLEANUP EXPIRED TOKENS =================
// Run cleanup every hour
setInterval(async () => {
    try {
        await TokenBlacklist.deleteMany({ expiresAt: { $lt: new Date() } });
        console.log('🧹 Cleaned up expired tokens');
    } catch (error) {
        console.error('Error cleaning up tokens:', error);
    }
}, 60 * 60 * 1000); // 1 hour

// ================= START SERVER =================
app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));