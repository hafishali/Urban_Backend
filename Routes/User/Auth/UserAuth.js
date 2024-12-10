const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const userController = require('../../../Controllers/User/Auth/userAuth');
// require('../../../config/passportConfigGoogle')
// user register
router.post('/register', userController.register);
// user login
router.post('/login', userController.login);
// Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// Google Login Callback
router.get('/google/callback', userController.googleLoginCallback);
// facebook login
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// Facebook Login Callback
router.get('/facebook/callback', userController.facebookLoginCallback);
module.exports = router;