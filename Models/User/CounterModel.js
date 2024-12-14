const mongoose = require('mongoose');
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Name of the counter (e.g., "orderId")
  seq: { type: Number, default: 0 }, // Sequence number
});
const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;