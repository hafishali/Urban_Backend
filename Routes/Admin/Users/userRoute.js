const express = require('express');
const router = express.Router();
const userController = require('../../../Controllers/Admin/Users/userController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


// Get user profile
router.get('/view/:userId', userController.getProfile);

router.get('/view-all', userController.getAllUsers);

// // Update user profile
// router.patch('/update/:userId',jwtVerify(['admin']),  userController.updateProfile);

// toggle user
router.patch('/toggle/:userId', jwtVerify(['admin']), userController.toggleUserStatus)

// delete user
router.delete('/delete/:userId',jwtVerify(['admin']), userController.deleteUser)
// search user
router.get('/search',jwtVerify(['admin']), userController.searchUsers);

module.exports = router;
