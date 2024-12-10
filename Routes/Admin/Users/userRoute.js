const express = require('express');
const router = express.Router();
const userController = require('../../../Controllers/Admin/Users/userController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


// Get user profile
router.get('/view', userController.getProfile);

router.get('/view-all', userController.getAllUsers);

// Update user profile
router.patch('/update',  userController.updateProfile);

// suspend user
router.patch('/suspend/:userId', jwtVerify(['admin']), userController.suspendUser)
// active user
router.patch('/active/:userId', jwtVerify(['admin']), userController.activeUser)
// delete user
router.delete('/delete/:userId',jwtVerify(['admin']), userController.deleteUser)
// search user
router.get('/search',jwtVerify(['admin']), userController.searchUsers);

module.exports = router;
