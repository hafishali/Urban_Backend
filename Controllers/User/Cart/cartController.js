const Cart = require('../../../Models/User/CartModel');
const Product = require('../../../Models/Admin/ProductModel');
const Coupon = require('../../../Models/Admin/CouponModel');

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, color, size } = req.body;

    if (!userId || !productId || !quantity || !color || !size) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if the product with the same color and size already exists in the cart
    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.color === color &&
        item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.offerPrice, // Use `offerPrice` from the product schema
        color,
        size,
        features: product.features, // Add product features to the cart item
      });
    }

    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get cart for a user with product details
exports.getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'category subcategory', select: 'name title' }, // Include category and subcategory details
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Filter out items with null productId
    cart.items = cart.items.filter(item => item.productId !== null);

    const enrichedCart = cart.items.map((item) => {
      return {
        ...item.toObject(),
        features: item.productId?.features || {}, // Include features in the response
      };
    });

    await cart.save(); // Save changes to remove null items permanently
    res.status(200).json({ ...cart.toObject(), items: enrichedCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Remove an item from cart
// Remove an item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId, color, size } = req.body;

    if (!userId || !productId || !color || !size) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Debugging: Log cart items before removal
    console.log("Cart Items Before Removal:", JSON.stringify(cart.items, null, 2));
    console.log("Remove Request Data:", { productId, color, size });

    // Remove the specific item by matching all fields
    const filteredItems = cart.items.filter(
      (item) =>
        item.productId.toString() !== productId ||
        item.color !== color ||
        item.size !== size
    );

    // Check if the item was removed
    if (filteredItems.length === cart.items.length) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items = filteredItems;

    // Debugging: Log cart items after removal
    console.log("Cart Items After Removal:", JSON.stringify(cart.items, null, 2));

    // Save the updated cart
    await cart.save();
    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
    console.error("Error removing item from cart:", error.message);
    res.status(500).json({ error: error.message });
  }
};



// Update item quantity in cart
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity, color, size } = req.body;

    // Validate request body
    if (!userId || !productId || !quantity || !color || !size) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    console.log("Cart Items:", JSON.stringify(cart.items, null, 2));
    console.log("Request Data:", { productId, color, size, quantity });

    const item = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.color === color &&
        item.size === size
    );

    if (!item) {
      return res.status(400).json({ message: "Product not found in cart" });
    }

    // Update quantity or remove item if quantity is 0 or less
    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) =>
          item.productId.toString() !== productId ||
          item.color !== color ||
          item.size !== size
      );
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).json({ error: error.message });
  }
};



// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// apply coupon
exports.applyCouponToCart = async (req, res) => {
  try {
    const { userId, couponCode } = req.body;

    // Validate input
    if (!userId || !couponCode) {
      return res.status(400).json({ message: "User ID and coupon code are required" });
    }

    // Fetch the cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if the coupon is already applied to the cart
    if (cart.coupon) {
      const appliedCoupon = await Coupon.findById(cart.coupon);
      if (appliedCoupon && appliedCoupon.code === couponCode) {
        return res.status(400).json({ message: "Coupon already applied to this cart" });
      }
    }

    // Fetch the coupon
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Validate coupon
    const currentDate = new Date();
    if (
      coupon.status !== "active" ||
      currentDate < coupon.startDate ||
      currentDate > coupon.endDate
    ) {
      return res.status(400).json({ message: "Coupon is not active or expired" });
    }

    // Apply coupon discount to total price
    const previousTotal = cart.totalPrice;
    const discountValue = coupon.discountValue;
    let discountedPrice = cart.totalPrice;

    if (coupon.discountType === "percentage") {
      discountedPrice -= (cart.totalPrice * coupon.discountValue) / 100;
    } else if (coupon.discountType === "amount") {
      discountedPrice -= coupon.discountValue;
    }

    // Ensure total price is not negative
    discountedPrice = Math.max(discountedPrice, 0);

    // Update cart with discounted price and applied coupon
    cart.totalPrice = discountedPrice;
    cart.coupon = coupon._id; // Save coupon reference

    await cart.save();

    res.status(200).json({
      message: "Coupon applied successfully",
      cart: {
        ...cart.toObject(),
        appliedCoupon: coupon.code, // Include applied coupon in response
      },
      originalAmount: previousTotal,
      discountValue: discountValue,
    });
  } catch (error) {
    res.status(500).json({ message: "Error applying coupon", error: error.message });
  }
};
