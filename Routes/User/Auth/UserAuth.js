const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const userController = require('../../../Controllers/User/Auth/userAuth');
// require('../../../config/passportConfigGoogle')

// user register with otp verification
router.post('/register', userController.register);
// otp verficiation for saving to db
router.post('/register/verify-otp', userController.verifyOTP);
// user login
router.post('/login', userController.login);
// otp for password reset
router.post('/forgot-password/send-otp', userController.sendForgotPasswordOTP)
// otp verfication for password reset
router.post('/forgot-password/verify-otp', userController.verifyForgotPasswordOTP);
// reset password after verification
router.patch('/forgot-password/reset-password', userController.resetPassword);
// Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Google Login Callback
router.get('/google/callback', userController.googleLoginCallback);
// facebook login
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// Facebook Login Callback
router.get('/facebook/callback', userController.facebookLoginCallback);
module.exports = router;