const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.Razorpay_keyID, 
  key_secret: process.env.Razorpay_Secret, 
});

module.exports = razorpayInstance;
