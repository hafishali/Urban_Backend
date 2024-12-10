const Checkout = require('../../../Models/User/CheckoutModel');
const Address = require('../../../Models/User/AddressModel');
const Cart = require('../../../Models/User/CartModel')
const Product = require('../../../Models/Admin/ProductModel'); // Adjust the path as necessary


exports.createCheckout = async (req, res) => {
  const { userId, cartId, addressId, totalPrice, couponCode } = req.body;

  try {
    // Fetch cart items using cartId
    const cart = await Cart.findById(cartId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty or not found" });
    }

    // Validate shipping address
    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== userId) {
      return res.status(404).json({ message: "Invalid shipping address" });
    }

    // Validate total price
    const calculatedTotalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    if (totalPrice <= 0 || totalPrice !== calculatedTotalPrice) {
      return res.status(400).json({ message: "Invalid total price" });
    }

    // Create checkout
    const checkout = new Checkout({
      userId,
      cartId, // Include cartId in the checkout
      cartItems: cart.items, // Use items from the cart
      shippingAddress: addressId,
      totalPrice,
      couponCode: couponCode || null, // Add coupon code if provided
    });

    await checkout.save();

    // // Optionally clear the cart after checkout
    // cart.items = [];
    // cart.totalPrice = 0;
    // await cart.save();

    res.status(201).json({
      message: "Checkout created successfully",
      checkout,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
;
  

exports.getCheckoutById = async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id)
      .populate('userId', 'name email') // Populate user info
      .populate('shippingAddress') // Populate address details
      .populate({
        path: 'cartItems.productId', // Populate the product details in the cartItems
        model: 'Products', // Ensure the correct model name is used (Products)
        select: 'title offerPrice description images' // Select relevant fields from the Product model
      });

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    res.status(200).json({ checkout });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};





exports.getUserCheckouts = async (req, res) => {
  try {
    const checkouts = await Checkout.find({ userId: req.user.userId })
      .populate('shippingAddress'); // Populate address details

    res.status(200).json({ checkouts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
