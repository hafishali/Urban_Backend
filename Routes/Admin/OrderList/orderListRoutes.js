const express = require('express');
const router = express.Router();
const AdminOrderController = require('../../../Controllers/Admin/Order/adminOrderController')


// Get all products
router.get('/get', AdminOrderController.getAllOrder);

// Route for updating the status of an order
router.patch('/:orderId/status', AdminOrderController.updateOrderStatus);


module.exports = router;