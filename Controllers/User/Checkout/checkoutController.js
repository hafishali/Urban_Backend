const Checkout = require('../../../Models/User/CheckoutModel');
const Address = require('../../../Models/User/AddressModel');
const Cart = require('../../../Models/User/CartModel');
const Product = require('../../../Models/Admin/ProductModel'); 
const { checkout } = require('../../../Routes/Admin/Invoice/invoiceRoute');
// Create Checkout
exports.createCheckout = async (req, res) => {
  const { userId, addressId } = req.body;

  try {
    // Fetch the user's cart
    const cart = await Cart.findOne({ userId }).populate('items.productId', 'title price color size');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty or not found" });
    }

    // Validate shipping address
    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== userId) {
      return res.status(404).json({ message: "Invalid shipping address" });
    }

    // Calculate total price
    const totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    if (totalPrice <= 0) {
      return res.status(400).json({ message: "Invalid total price" });
    }

    // Create checkout record
    const checkout = new Checkout({
      userId,
      cartId: cart._id,
      cartItems: cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.price,
        color: item.color, // Include color from product
        size: item.size,   // Include size from product
      })),
      addressId: address._id,
      totalPrice,
    });

    await checkout.save();

    // Optionally clear the cart after checkout
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

// Get Checkout by ID
exports.getCheckoutById = async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id)
      .populate('userId', 'name email') // Populate user info
      .populate('addressId', 'name number address landmark city landmark state addressType') // Populate address details
      .populate({
        path: 'cartItems.productId', 
        model: 'Products', 
        select: 'title offerPrice description images color size', 
      });

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    res.status(200).json({ checkout });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get All Checkouts for a User
exports.getUserCheckouts = async (req, res) => {
  try {
    const checkouts = await Checkout.find({ userId: req.user.userId })
      .populate('shippingAddress') // Populate address details
      .populate({
        path: 'cartItems.productId',
        model: 'Products',
        select: 'title offerPrice description color size', // Include color and size
      });

    res.status(200).json({ checkouts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// delete checkout
exports.deletCheckout = async (req, res) => {
  try {
    const deletedCheckout = await Checkout.findByIdAndDelete(req.params.id);
    if (!deletedCheckout) {
      return res.status(404).json({ message: "checkout details not found" });
    }
    res.status(200).json({ message: "checkout deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};