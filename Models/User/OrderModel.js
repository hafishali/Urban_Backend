const mongoose = require('mongoose');
const Invoice=require('../../Models/Admin/InvoiceModel')
const crypto = require('crypto'); 

const orderSchema = new mongoose.Schema({
  orderId: { type: Number,required: true  ,unique: true }, // Unique numeric order ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId:{type:String},
  razorpayPaymentId:{type:String},
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
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid'],
  },

  TrackId:{
    type:String
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Processing', 'In-Transist', 'invoice_generated','Delivered', 'Cancelled'],
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
orderSchema.statics.generateOrderId = async function () {
  const lastOrder = await this.findOne().sort({ orderId: -1 }).limit(1);
  const lastOrderId = lastOrder ? lastOrder.orderId : 0;
  return lastOrderId + 1;
};

// Generate orderId before validation
orderSchema.pre('validate', async function (next) {
  if (!this.orderId) {
    try {
      const orderId = await this.constructor.generateOrderId();
      this.orderId = orderId;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Update updatedAt on save
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


const generateUniqueInvoiceNumber = async () => {
  while (true) {
    const prefix = "2025UB"; // Your desired prefix
    const randomPart = Array.from({ length: 10 }, () => crypto.randomInt(0, 10)).join('');
    const invoiceNumber = `${prefix}${randomPart}`;

    const existingInvoice = await Invoice.findOne({ invoice_Number: invoiceNumber });
    if (!existingInvoice) return invoiceNumber; // Return if unique
  }
};


const createInvoiceForOrder = async (order) => {
  try {
    // Populate necessary fields for the invoice
    const updatedOrder = await Order.findById(order._id)
      .populate({ path: "userId", select: "name phone" })
      .populate({ path: "addressId", select: "address city state number" });
      console.log(updatedOrder)

    if (!updatedOrder || updatedOrder.status !== "invoice_generated") return;

    const existingInvoice = await Invoice.findOne({ order_id: updatedOrder._id });
    if (existingInvoice) {
      console.log(`Invoice already exists for Order ID: ${updatedOrder._id}`);
      return; 
    }

    const uniqueInvoiceNumber = await generateUniqueInvoiceNumber();

    const invoice = new Invoice({
      invoice_Number: uniqueInvoiceNumber, 
      userId: updatedOrder.userId._id,
      order_id:updatedOrder._id,
      customerName: updatedOrder.userId.name,
      customerMobile: updatedOrder.addressId?.number || updatedOrder.userId?.phone,
      address: updatedOrder.addressId,
      products: updatedOrder.products.map(product => ({
        productId: product.productId,
        size: product.size,
        price: product.price,
        quantity: product.quantity,
      })),
      SubTotalAmount: updatedOrder.totalPrice,
      Delivery_Charge: updatedOrder.deliveryCharge,
      Discounted_Amount: updatedOrder.discountedAmount,
      totalAmount: updatedOrder.finalPayableAmount,
      payment_method: updatedOrder.paymentMethod,
      status: updatedOrder.paymentStatus,
    });

    await invoice.save();
    console.log(` Invoice created for Order ID: ${updatedOrder._id}`);
  } catch (error) {
    console.error(` Error creating invoice for Order ID: ${order._id}`, error);
  }
};


// POST-SAVE HOOK (Handles Single Order Save)
orderSchema.post("findOneAndUpdate", async function (doc, next) {
  await createInvoiceForOrder(doc);
  next();
});

// POST-UPDATE-MANY HOOK (Handles Bulk Order Updates)
orderSchema.post("updateMany", async function (doc, next) {
  try {
    const query = this.getQuery(); // Gets the filter used in updateMany()
    const updatedOrders = await Order.find(query);

    // Process only orders where status is "invoice_generated"
    const ordersToInvoice = updatedOrders.filter(order => order.status === "invoice_generated");

    await Promise.all(ordersToInvoice.map(order => createInvoiceForOrder(order)));

    next();
  } catch (error) {
    console.error(`Error processing bulk invoice creation`, error);
    next(error);
  }
});





const Order = mongoose.model('Order', orderSchema);
module.exports = Order;