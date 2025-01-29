const Order = require('../../../Models/User/OrderModel');
const Address = require('../../../Models/User/AddressModel');
const Product = require('../../../Models/Admin/ProductModel');
const generateNumericOrderId = require('../../../utils/generateNumericOrderId');
const Cart = require('../../../Models/User/CartModel')
const Checkout=require('../../../Models/User/CheckoutModel')
const Coupon=require('../../../Models/Admin/CouponModel');
const mongoose=require('mongoose')
const razorpay = require('../../../config/RazorpayInstance');

// Place an order
// exports.placeOrder = async (req, res) => {
//   const { userId, addressId, products, paymentMethod } = req.body;

//   try {
//     // Validate address
//     const address = await Address.findById(addressId);
//     if (!address || address.userId.toString() !== userId) {
//       return res.status(404).json({ message: "Invalid address ID or address does not belong to the user" });
//     }

//     // Validate products and calculate total price
//     let totalPrice = 0;
//     const validatedProducts = [];
//     for (const product of products) {
//       const productData = await Product.findById(product.productId);
//       if (!productData) {
//         return res.status(404).json({ message: `Product with ID ${product.productId} not found` });
//       }

//       if (!product.color || !product.size) {
//         return res.status(400).json({ message: `Color and size are required for product ID ${product.productId}` });
//       }

//       // Check stock availability
//       if (productData.stock < product.quantity) {
//         return res.status(400).json({ message: `Insufficient stock for product ID ${product.productId}` });
//       }

//       // Deduct stock
//       productData.stock -= product.quantity;
//       await productData.save();

//       validatedProducts.push({
//         productId: productData._id,
//         quantity: product.quantity,
//         price: productData.offerPrice, // Assuming offerPrice is used for calculations
//         color: product.color, // Include color
//         size: product.size,   // Include size
//       });

//       totalPrice += product.quantity * productData.offerPrice;
//     }

//     // Generate unique numeric order ID
//     const orderId = await generateNumericOrderId();

//     // Create the order
//     const order = new Order({
//       orderId, // Unique numeric ID
//       userId,
//       addressId,
//       products: validatedProducts,
//       totalPrice,
//       paymentMethod,
//     });

//     await order.save();

//     res.status(201).json({ message: "Order placed successfully", order });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
exports.placeOrder = async (req, res) => {
  const { userId, addressId, paymentMethod, deliveryCharge, checkoutId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const checkout = await Checkout.findById(checkoutId)
      .populate("cartItems.productId")
      .populate({
        path: "coupen",
        model: "Coupon",
        select: "discountValue discountType code title",
      });

    if (!checkout) throw new Error("Checkout not found");
    if (!checkout.cartItems || checkout.cartItems.length === 0) throw new Error("No products found in the checkout");

    const validatedProducts = [];
    let totalPrice = 0;

    for (const cartItem of checkout.cartItems) {
      const productData = cartItem.productId;
      if (!productData) throw new Error(`Product with ID ${cartItem.productId} not found`);

      const selectedColor = productData.colors.find((color) => color.color === cartItem.color);
      if (!selectedColor) throw new Error(`Invalid color '${cartItem.color}' for product '${productData.title}'`);

      const selectedSize = selectedColor.sizes.find((size) => size.size === cartItem.size);
      if (!selectedSize) throw new Error(`Invalid size '${cartItem.size}' for product '${productData.title}'`);

      if (selectedSize.stock < cartItem.quantity)
        throw new Error(`Insufficient stock for product '${productData.title}'`);

      selectedSize.stock -= cartItem.quantity;
      productData.totalStock -= cartItem.quantity;
      productData.orderCount += cartItem.quantity;

      productData.markModified("colors");
      validatedProducts.push({
        productId: productData._id,
        quantity: cartItem.quantity,
        price: productData.offerPrice,
        color: cartItem.color,
        size: cartItem.size,
      });

      totalPrice += cartItem.quantity * productData.offerPrice;
      await productData.save({ session });
    }

    let finalPayableAmount = checkout.discountedPrice + deliveryCharge;

    if (paymentMethod === "UPI") {
      // Razorpay Order Creation
      const razorpayOrder = await razorpay.orders.create({
        amount: finalPayableAmount * 100,
        currency: "INR",
        receipt: `order_rcptid_${Date.now()}`,
      });
      const orderId = await generateNumericOrderId();
      // Save Razorpay Order
      const order = new Order({
        userId,
        addressId,
        products: validatedProducts,
        totalPrice,
        discountedAmount: checkout.discountedPrice,
        deliveryCharge,
        finalPayableAmount,
        paymentMethod: "UPI",
        paymentStatus: "pending",
        razorpayOrderId: razorpayOrder.id,
      });

      await order.save({ session });
      await Cart.deleteOne({ userId }).session(session);
      await Checkout.deleteOne({ _id: checkoutId }).session(session);
      await session.commitTransaction();
      session.endSession();

      // Send Razorpay Order Details to Frontend
      return res.status(201).json({
        message: "Order created. Proceed to payment.",
        razorpayOrderId: razorpayOrder.id,
        amount: finalPayableAmount * 100,
        currency: "INR",
      });
    } else if (paymentMethod === "Cash on Delivery") {
      // Save COD Order
      const order = new Order({
        userId,
        addressId,
        products: validatedProducts,
        totalPrice,
        discountedAmount: checkout.discountedPrice,
        deliveryCharge,
        finalPayableAmount,
        paymentMethod: "Cash on Delivery",
        paymentStatus: "pending",
      });

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      // Respond with COD Success
      return res.status(201).json({ message: "Order created successfully with Cash on Delivery." });
    }

    throw new Error("Invalid payment method");
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error placing order:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get orders by user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId })
      .populate('addressId')
      .populate({
        path: 'products.productId',
        model: 'Products',
        select: 'title offerPrice description images'
      });

    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get order details by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('addressId')
      .populate({
        path: 'products.productId',
        model: 'Products',
        select: 'title offerPrice description images'
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ order });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


