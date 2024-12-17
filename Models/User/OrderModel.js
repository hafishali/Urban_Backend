const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  orderId: { type: Number, required: true, unique: true }, // Unique numeric order ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      color: { type: String, required: true },
      size: { type: String, required: true },
    },
  ],
  totalPrice: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash on Delivery', 'Credit Card', 'UPI', 'Net Banking'],
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
  },
  deliveryDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;