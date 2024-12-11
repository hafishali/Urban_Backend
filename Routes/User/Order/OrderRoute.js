const express = require('express');
const router = express.Router();
const orderController = require('../../../Controllers/User/Order/orderController');

// Place an order
router.post('/create', orderController.placeOrder);

// Get orders for a user
router.get('/view/:userId', orderController.getUserOrders);

// Get order details by ID
router.get('/orders/:orderId', orderController.getOrderById);

module.exports = router;
