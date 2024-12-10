const express = require('express');
const router = express.Router();
const profileController = require('../../../Controllers/User/Profile/profileController');
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


// Get user profile
router.get('/view', jwtVerify(['user']), profileController.getProfile);

// Update user profile
router.patch('/update', jwtVerify(['user']), profileController.updateProfile);

module.exports = router;