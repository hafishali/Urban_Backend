const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../../Models/User/UserModel');
const passport = require('passport');

// register a new user
exports.register = async (req,res) => {
    const { name, phone, password } = req.body;
    try {
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ msg: 'Phone number already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            phone,
            password: hashedPassword,
        });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id, role:newUser.role }, process.env.JWT_SECRET, { expiresIn: '1d'});
        return res.status(201).json({
            message: 'User registered successfully',
            user: { name: newUser.name, phone: newUser.phone },
            token,
        });
    } catch (err) {
        res.status(500).json({ message: "server error", error: err.message})
    }
}
// Login a user
exports.login = async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Include userId in the response
        res.status(200).json({ 
            message: 'User logged in successfully', 
            userId: user._id, // Added userId
            phone: user.phone, 
            token: token 
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Google Login Callback
exports.googleLoginCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Authentication failed', error: err.message });
        }
        try {
            // Check if a user with this email exists
            const existingUser = await User.findOne({ email: user.email });
            if (existingUser) {
                user = existingUser; // Link to existing user
            } else {
                // Create a new user if not found
                user = await User.create({
                    name: user.name,
                    email: user.email,
                    googleId: user.id,
                });
            }
            // Generate JWT token
            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.status(200).json({
                message: 'Google login successful',
                token,
                user: {
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    })(req, res, next);
};
// Facebook Login Callback
exports.facebookLoginCallback = (req, res, next) => {
    passport.authenticate('facebook', { session: false }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Authentication failed', error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        // Generate a JWT token for the user
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Send the response with token and user info
        res.status(200).json({
            message: 'Facebook login successful',
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    })(req, res, next);
};
