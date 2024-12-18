const Cart = require('../../../Models/User/CartModel');
const Product = require('../../../Models/Admin/ProductModel');

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
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId, color, size } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove the specific item
    cart.items = cart.items.filter(
      (item) =>
        item.productId &&
        (item.productId.toString() !== productId ||
        item.color !== color ||
        item.size !== size)
    );

    // Save the updated cart
    await cart.save();
    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
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
