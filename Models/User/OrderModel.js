const mongoose = require('mongoose');
const Invoice=require('../../Models/Admin/InvoiceModel')

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
  totalPrice: { type: Number, required: true, min: 0 },
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
  deliveryDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return value >= this.createdAt;
      },
      message: 'Delivery date cannot be before order creation date.',
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


orderSchema.post('save', async function (doc, next) {
  try {
    // Populate userId and addressId fields
    await doc.populate({ path: 'userId', select: 'name phone' });
    await doc.populate({ path: 'addressId', select: 'address city state' });

    // Check if an invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ paymentId: `PAY-${doc.orderId}` });
    if (existingInvoice) {
      return next(); // Skip invoice creation if already exists
    }

    // Generate the invoice
    const invoice = new Invoice({
      paymentId: `PAY-${doc.orderId}`, // Generate a payment ID
      userId: doc.userId._id,
      customerName: doc.userId.name, // Get populated name
      customerMobile: doc.userId.phone, // Get populated phone
      address: doc.addressId, // Address already populated
      products: doc.products.map(product => ({
        productId: product.productId, // Ensure productId is valid
        size: product.size,
        price: product.price,
        quantity: product.quantity,
      })),
      totalAmount: doc.totalPrice,
      status: doc.status,
    });

    // Save the invoice
    await invoice.save();
    console.log(`Invoice created for order ID: ${doc._id}`);
    next();
  } catch (error) {
    console.error(`Error creating invoice for order ID: ${doc._id}`, error);
    next(error); // Pass the error to the next middleware
  }
});




const Order = mongoose.model('Order', orderSchema);
module.exports = Order;