const express = require('express');
const addressController = require('../../../Controllers/User/Address/addressController')
const router = express.Router();
const jwtVerify=require('../../../Middlewares/jwtMiddleware')

// Add a new address
router.post('/add', jwtVerify(['user']), addressController.addAddress);

// Get all addresses for a user
router.get('/view/:userId', jwtVerify(['user']), addressController.getAddressesByUserId);

// Update an address by ID
router.patch('/update/:id', jwtVerify(['user']), addressController.updateAddress);

// Delete an address by ID
router.delete('/delete/:id', jwtVerify(['user']), addressController.deleteAddress);

module.exports = router;