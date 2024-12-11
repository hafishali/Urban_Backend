const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      color: { type: String, required: true }, // New field for color
      size: { type: String, required: true },  // New field for size
    }
  ],
  totalPrice: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['Cash on Delivery', 'Credit Card', 'UPI', 'Net Banking'] 
  },
  status: { 
    type: String, 
    default: 'Pending', 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the `updatedAt` field automatically on document updates
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
