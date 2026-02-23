# Registration System

This folder contains all components related to the user registration system.

## File Structure

```
register/
├── index.html          # Registration page HTML
├── register.css        # Registration page styles
├── register.js         # Client-side registration logic
├── validation.js       # Email and password validation utilities
├── authSchema.js       # MongoDB schema for authentication
├── registerRoutes.js   # Server-side registration API endpoint
└── README.md           # This file
```

## Components

### Frontend Files

#### `index.html`
- Registration form with email, password, and confirm password fields
- Password requirements display
- Link to login page
- Responsive design

#### `register.css`
- Complete styling for registration page
- Gradient background
- Form styling with focus states
- Success/error message styles
- Responsive layout

#### `register.js`
- Form submission handling
- Client-side password matching validation
- API communication
- Loading states
- Error handling
- Auto-redirect after successful registration

### Backend Files

#### `validation.js`
- `validateEmail(email)`: Validates email format using regex
- `validatePassword(password)`: Validates password strength
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

#### `authSchema.js`
- MongoDB schema for storing user authentication data
- Fields:
  - `email`: String (required, unique, lowercase, trimmed)
  - `password`: String (required, hashed)
  - `createdAt`: Date (auto-generated)

#### `registerRoutes.js`
- `registerUser(req, res)`: Handles user registration
  - Input validation
  - Email format validation
  - Password strength validation
  - Duplicate email checking
  - Password hashing with bcrypt (10 salt rounds)
  - User creation in MongoDB

## Integration with Server

To integrate this registration system with your Express server:

```javascript
// In server.js
const { registerUser } = require('./register/registerRoutes');

// Registration endpoint
app.post('/api/register', registerUser);
```

## Security Features

1. **Password Hashing**: Uses bcrypt with 10 salt rounds
2. **Email Normalization**: Converts to lowercase and trims whitespace
3. **Input Validation**: Server-side validation for all inputs
4. **Duplicate Prevention**: Checks for existing emails before registration
5. **Error Messages**: Generic messages to prevent user enumeration

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

## API Endpoint

### POST /api/register

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! You can now login."
}
```

**Error Responses:**

- **400 Bad Request** - Missing fields, invalid email, or weak password
- **409 Conflict** - Email already registered
- **500 Internal Server Error** - Server error

## Dependencies

- `bcrypt`: Password hashing
- `mongoose`: MongoDB ODM
- `express`: Web framework

## Usage

1. Navigate to `/register/index.html` or `/register/`
2. Enter email and password (meeting requirements)
3. Confirm password
4. Click "Register"
5. Upon success, automatically redirected to login page

## Testing

To test the registration system:

1. Start the server: `node server.js`
2. Open browser: `http://localhost:5000/register/`
3. Fill in the form with valid credentials
4. Submit and verify success message
5. Check MongoDB for new user entry
6. Verify password is hashed in database

## Notes

- All passwords are hashed before storage
- Email addresses are stored in lowercase
- Duplicate emails are prevented at database level
- Client-side validation provides immediate feedback
- Server-side validation ensures data integrity
