const express = require("express");
const router = express.Router();
const deliveryFeeController = require("../../../Controllers/Admin/DeliveryFee/deliveryFeeController");

// Admin routes
router.post("/add", deliveryFeeController.addDeliveryFee); 
router.get("/view", deliveryFeeController.getDeliveryFees); 
router.patch("/update/:id", deliveryFeeController.updateDeliveryFee); 
router.delete("/delete/:id", deliveryFeeController.deleteDeliveryFee); 

module.exports = router;