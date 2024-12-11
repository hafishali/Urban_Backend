const Order = require('../../../Models/User/OrderModel');
const Address = require('../../../Models/User/AddressModel');
const Product = require('../../../Models/Admin/ProductModel');

// Place an order
exports.placeOrder = async (req, res) => {
  const { userId, addressId, products, paymentMethod } = req.body;

  try {
    // Validate address
    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== userId) {
      return res.status(404).json({ message: "Invalid address ID or address does not belong to the user" });
    }

    // Validate products and calculate total price
    let totalPrice = 0;
    const validatedProducts = [];
    for (const product of products) {
      const productData = await Product.findById(product.productId);
      if (!productData) {
        return res.status(404).json({ message: `Product with ID ${product.productId} not found` });
      }

      if (!product.color || !product.size) {
        return res.status(400).json({ message: `Color and size are required for product ID ${product.productId}` });
      }

      validatedProducts.push({
        productId: productData._id,
        quantity: product.quantity,
        price: productData.offerPrice, // Assuming offerPrice is used for calculations
        color: product.color, // Include color
        size: product.size,   // Include size
      });

      totalPrice += product.quantity * productData.offerPrice;
    }

    // Create the order
    const order = new Order({
      userId,
      addressId,
      products: validatedProducts,
      totalPrice,
      paymentMethod,
    });

    await order.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
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