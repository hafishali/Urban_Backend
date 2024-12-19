const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
      size: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to update `updatedAt`
invoiceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
