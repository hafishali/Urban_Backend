const crypto = require("crypto");
const Order=require('../Models/User/OrderModel')

exports.handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.Razorpay_Secret;

  const receivedSignature = req.headers["x-razorpay-signature"];
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");
    console.log(generatedSignature);
  if (receivedSignature !== generatedSignature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  const event = req.body;

  try {
    if (event.event === "payment.captured") {
      const paymentId = event.payload.payment.entity.id;
      const razorpayOrderId = event.payload.payment.entity.order_id;

      // Update Payment Status in Database
      const order = await Order.findOne({ razorpayOrderId });

      if (order) {
        order.paymentStatus = "completed";
        await order.save();

        console.log(`Order ${order.orderId} payment status updated to completed.`);
      } else {
        console.error("Order not found for Razorpay Order ID:", razorpayOrderId);
      }
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error handling Razorpay webhook:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
