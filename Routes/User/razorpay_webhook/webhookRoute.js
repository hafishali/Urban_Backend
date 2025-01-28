const express = require("express");
const { handleRazorpayWebhook } = require("../../../config/razorpayWebhook");

const router = express.Router();

// Webhook Route
router.post("/webhook/razorpay", handleRazorpayWebhook);

module.exports = router;
