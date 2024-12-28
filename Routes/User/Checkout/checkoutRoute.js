const express = require('express');
const router = express.Router();
const checkoutController = require('../../../Controllers/User/Checkout/checkoutController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')

// Create a new checkout
router.post('/checkout', jwtVerify(['user']),  checkoutController.createCheckout);

// Get a checkout by ID
router.get('/checkout/:id', jwtVerify(['user']), checkoutController.getCheckoutById);

// Get all checkouts for a user
router.get('/checkout',jwtVerify(['user']), checkoutController.getUserCheckouts);
// delete checkout
router.delete('/delete/:id',jwtVerify(['user']), checkoutController.deletCheckout);

module.exports = router;
