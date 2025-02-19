const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Unique identifier (orderId, invoice_YY-YY)
  sequenceValue: { type: Number, default: 0 }, // Auto-incrementing number
});

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
