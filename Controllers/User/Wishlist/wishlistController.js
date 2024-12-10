const Wishlist = require('../../../Models/User/WishlistModel');
const Product = require('../../../Models/Admin/ProductModel');

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    const isAlreadyInWishlist = wishlist.items.some((item) => item.productId.toString() === productId);

    if (isAlreadyInWishlist) {
      return res.status(400).json({ message: "Product is already in the wishlist" });
    }

    wishlist.items.push({ productId });
    await wishlist.save();

    res.status(200).json({ message: "Product added to wishlist", wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's wishlist
exports.getWishlistByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ userId }).populate('items.productId');
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const updatedItems = wishlist.items.filter((item) => item.productId.toString() !== productId);

    if (updatedItems.length === wishlist.items.length) {
      return res.status(400).json({ message: "Product not found in wishlist" });
    }

    wishlist.items = updatedItems;
    await wishlist.save();

    res.status(200).json({ message: "Product removed from wishlist", wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({ message: "Wishlist cleared successfully", wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
