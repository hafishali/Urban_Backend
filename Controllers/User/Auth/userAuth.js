const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../../Models/User/UserModel');
const passport = require('passport');
const NodeCache = require('node-cache');
const otpGenerator = require('otp-generator');
const Coupon=require('../../../Models/User/WalkinCoupen')
const axios = require('axios');

const cache = new NodeCache({ stdTTL: 300 });  
const api_key=process.env.FACTOR_API_KEY

// sending otp for registration
exports.register = async (req, res) => {
    const { name, phone, password,email, isWalkIn } = req.body; 

    try {
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ msg: 'Phone number already exists' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        
      

       
        cache.set(phone, { name, phone,email ,password: hashedPassword, otp, isWalkIn });

        
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN/OTP1`);
        if (response.data.Status !== 'Success') {
            return res.status(500).json({ message: 'Failed to send OTP. Try again later.' });
        }

        console.log(`OTP ${otp} sent to phone: ${phone}`); 
        

        return res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};


// verify otp and register a user
exports.verifyOTP = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        // Retrieve stored data from cache
        const cachedData = cache.get(phone);
        if (!cachedData) {
            return res.status(400).json({ message: 'OTP invalid or expired' });
        }

        // Verify the OTP with 2Factor API
        const response = await axios.get(`https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`);
        if (response.data.Status !== 'Success') {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // Save the user to MongoDB
        const newUser = new User({
            name: cachedData.name,
            phone: cachedData.phone,
            password: cachedData.password,
            email:cachedData.email
        });
        const savedUser = await newUser.save(); // Ensure the user is fully saved
        console.log(savedUser)

        let newCoupon = null;
        if (cachedData.isWalkIn) {
            const couponCode = `WALK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
            newCoupon = new Coupon({
                code: couponCode,
                userId: savedUser._id, // Use the saved user's _id
            });
            await newCoupon.save();
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: savedUser._id, role: savedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Delete the temporary data from cache
        cache.del(phone);

        return res.status(201).json({
            message: 'User registered successfully',
            user: { name: savedUser.name, phone: savedUser.phone, userId: savedUser._id },
            coupon: newCoupon ? newCoupon.code : null, // Check if newCoupon exists
            token,
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};




// Login a user
exports.login = async (req, res) => {
    const { phone, password } = req.body;

    try {
        const user = await User.findOne({ phone });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const coupon = await Coupon.findOne({ userId: user._id });

        res.status(200).json({
            message: 'User logged in successfully',
            userId: user._id, // Added userId
            phone: user.phone,
            token: token,
            coupon // Included coupon in response
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};



// otp for forget passsword
exports.sendForgotPasswordOTP = async (req, res) => {
    const { phone } = req.body;

    try {
       
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User with this phone number does not exist' });
        }

        
        const response = await axios.get(
            `https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN/OTP1`
        );

        if (response.data.Status !== 'Success') {
            return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
        }

        
        

        return res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// verify otp for password reset
exports.verifyForgotPasswordOTP = async (req, res) => {
    const { phone, otp } = req.body;

    try {
        const response = await axios.get(
            `https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`
        );

        if (response.data.Status !== 'Success') {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }
        const tempToken = jwt.sign(
            { phone },
            process.env.JWT_SECRET,
            { expiresIn: '5m' } 
        );
        
        return res.status(200).json({ 
            message: 'OTP verified successfully. Use the token to reset password.', 
            tempToken 
        });       
         
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// reset password after verification
exports.resetPassword = async (req, res) => {
    const { tempToken, newPassword } = req.body;

    try {
        
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        const phone = decoded.phone;

        
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

       
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        
        await User.updateOne({ phone }, { password: hashedPassword });

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired. Please try again.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Invalid token.' });
        }

        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Google Login Callback
exports.googleLoginCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err) {
            // return res.status(500).json({ message: 'Authentication failed', error: err.message });
            return res.redirect('https://urbaan.in/login-user?error=Authentication%20Failed');

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
            // res.status(200).json({
            //     message: 'Google login successful',
            //     token,
            //     user: {
            //         name: user.name,
            //         userId:user._id,
            //         email: user.email,
            //         role: user.role,
            //     },
            // });
            res.redirect(`https://urbaan.in/?Token=${token}&role=${user.role}&userId=${user._id}&name=${encodeURIComponent(user.name)}`);

        } catch (error) {
            // res.status(500).json({ message: 'Server error', error: error.message });
            console.log(error)
            return res.redirect('https://urbaan.in/login-user/login?error=Server%20Error');

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


