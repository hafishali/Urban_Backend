const express = require('express');
const router = express.Router();
const orderController = require('../../../Controllers/User/Order/orderController');
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


// intiate an order
router.post('/create', jwtVerify(['user']), orderController.initiateOrder);

// place an order
router.post('/confirm', jwtVerify(['user']), orderController.placeOrder)

// Get orders for a user
router.get('/view/:userId', jwtVerify(['user']), orderController.getUserOrders);

// Get order details by ID
router.get('/orders/:orderId', jwtVerify(['user','admin']), orderController.getOrderById);




module.exports = router;
