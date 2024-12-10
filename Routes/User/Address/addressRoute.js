const express = require('express');
const addressController = require('../../../Controllers/User/Address/addressController')
const router = express.Router();

// Add a new address
router.post('/add', addressController.addAddress);

// Get all addresses for a user
router.get('/view/:userId', addressController.getAddressesByUserId);

// Update an address by ID
router.put('/update/:id', addressController.updateAddress);

// Delete an address by ID
router.delete('/delete/:id', addressController.deleteAddress);

module.exports = router;