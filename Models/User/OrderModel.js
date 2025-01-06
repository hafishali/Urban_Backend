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
  TrackId:{
    type:String
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Processing', 'In-Transist', 'Delivered', 'Cancelled'],
  },
  discountedAmount:{
    type:Number
  },
  finalPayableAmount:{
    type:Number
  },
  coupen:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
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
    await doc.populate({ path: 'userId', select: 'name phone' });
    await doc.populate({ path: 'addressId', select: 'address city state' });

    const generateUniqueInvoiceNumber = async () => {
      while (true) {
        const randomPart = Array.from({ length: 16 }, () => crypto.randomInt(0, 10)).join('');
        const existingInvoice = await Invoice.findOne({ invoice_Number: randomPart });
        if (!existingInvoice) {
          return randomPart; // Return the unique number if no match is found
        }
        // Loop continues if a duplicate is found
      }
    };

    const uniqueInvoiceNumber = await generateUniqueInvoiceNumber();

    const invoice = new Invoice({
      invoice_Number: uniqueInvoiceNumber, // Unique 16-digit invoice number
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
      SubTotalAmount: doc.totalPrice,
      Delivery_Charge: doc.deliveryCharge,
      Discounted_Amount: doc.discountedAmount,
      totalAmount: doc.finalPayableAmount,
      payment_method: doc.paymentMethod,
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