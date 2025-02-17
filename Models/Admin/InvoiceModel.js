const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoice_Number: { type:String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_id:{type: mongoose.Schema.Types.ObjectId, ref: 'orders', required: true},
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
  SubTotalAmount: { type: Number, required: true },
  Delivery_Charge:{ type: Number },
  Discounted_Amount:{ type: Number },
  totalAmount: { type: Number, required: true },
  payment_method:{ type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Unpaid', 'Refund'],
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
