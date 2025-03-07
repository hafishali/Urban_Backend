const mongoose = require('mongoose');
const Invoice=require('../../Models/Admin/InvoiceModel')
const Counter=require('../../Models/User/CounterModel')
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
  deliveryMail:{type:Boolean,default:false},
  dispatchMail:{type:Boolean,default:false},
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


orderSchema.pre("validate", async function (next) {
  if (!this.orderId) {
   
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: "orderId" },  // Ensure _id is used correctly
        { $inc: { sequenceValue: 1 } }, 
        { new: true, upsert: true, setDefaultsOnInsert: true } // Ensure default values
      );

      if (!counter) {
        return next(new Error("Counter document not found or created"));
      }

      this.orderId = counter.sequenceValue;
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  // Determine Financial Year (April - March)
  const financialYear =
    now.getMonth() + 1 >= 4
      ? `${String(currentYear).slice(2)}-${String(nextYear).slice(2)}`
      : `${String(currentYear - 1).slice(2)}-${String(currentYear).slice(2)}`;
  const prefix = `URO${financialYear}`; // Example: URO24-25
  const counterId = `invoice_${financialYear}`;
  
  try {
    // Use a single atomic operation with upsert
    const counter = await Counter.findOneAndUpdate(
      { _id: counterId },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true } // This creates the document if it doesn't exist
    );
    
    // Ensure the sequence is 7 digits long
    const formattedNumber = String(counter.sequenceValue).padStart(7, '0');
    return `${prefix}${formattedNumber}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    throw error;
  }
};






const createInvoiceForOrder = async (order) => {
  try {
    // Fetch order details with population
    const updatedOrder = await Order.findById(order._id)
      .populate({ path: "userId", select: "name phone" })
      .populate({ path: "addressId", select: "address city state number" });

    // 🔹 Check if order exists
    if (!updatedOrder) {
      console.error(`❌ Order not found for ID: ${order._id}`);
      return;
    }

    // 🔹 Ensure order status is correct
    if (updatedOrder.status !== "invoice_generated") {
      console.warn(`⚠️ Order ${updatedOrder._id} does not have status "invoice_generated"`);
      return;
    }

    // 🔹 Ensure userId is not null
    if (!updatedOrder.userId) {
      console.error(`❌ Order ${updatedOrder._id} has no associated user`);
      return;
    }

    // 🔹 Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ order_id: updatedOrder._id });
    if (existingInvoice) {
      console.log(`✅ Invoice already exists for Order ID: ${updatedOrder._id}`);
      return;
    }

    // Generate invoice number
    const uniqueInvoiceNumber = await generateUniqueInvoiceNumber();

    // Create invoice
    const invoice = new Invoice({
      invoice_Number: uniqueInvoiceNumber, 
      userId: updatedOrder.userId._id,
      order_id: updatedOrder._id,
      customerName: updatedOrder.userId.name,
      customerMobile: updatedOrder.addressId?.number || updatedOrder.userId?.phone,
      address: updatedOrder.addressId || {}, // Ensure no null error
      products: updatedOrder.products?.map(product => ({
        productId: product?.productId || null,
        size: product?.size || null,
        price: product?.price || 0,
        quantity: product?.quantity || 1,
      })) || [],
      SubTotalAmount: updatedOrder.totalPrice || 0,
      Delivery_Charge: updatedOrder.deliveryCharge || 0,
      Discounted_Amount: updatedOrder.discountedAmount || 0,
      totalAmount: updatedOrder.finalPayableAmount || 0,
      payment_method: updatedOrder.paymentMethod || "unknown",
      status: updatedOrder.paymentStatus || "pending",
    });

    await invoice.save();
    console.log(`✅ Invoice created for Order ID: ${updatedOrder._id}`);
  } catch (error) {
    console.error(`❌ Error creating invoice for Order ID: ${order._id}`, error);
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