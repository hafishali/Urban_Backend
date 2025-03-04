const express = require('express');
const router = express.Router();
const AdminOrderController = require('../../../Controllers/Admin/Orders/orderController')
const jwtVerify = require('../../../Middlewares/jwtMiddleware')

// Get all products
router.get('/get', jwtVerify(['admin']),AdminOrderController.getAllOrder);

// Route for updating the status of an order
router.patch('/:orderId/edit', jwtVerify(['admin']), AdminOrderController.updateOrderStatus);

// filter
router.get('/filter',  jwtVerify(['admin']),AdminOrderController.filterOrders);

router.patch('/edit/status',jwtVerify(['admin']), AdminOrderController.bulkUpdateOrderStatus)

router.get('/user/orders/:userId',  jwtVerify(['admin']),AdminOrderController.ordersByUser);

module.exports = router;