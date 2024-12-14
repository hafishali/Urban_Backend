const mongoose = require("mongoose");

const deliveryFeeSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
  },
  deliveryFee: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model("DeliveryFee", deliveryFeeSchema);
