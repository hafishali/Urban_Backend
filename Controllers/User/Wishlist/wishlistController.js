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

    const itemIndex = wishlist.items.findIndex((item) => item.productId.toString() === productId);

    let isInWishlist = false;

    if (itemIndex > -1) {
      // If product is already in wishlist, remove it
      wishlist.items.splice(itemIndex, 1);
    } else {
      // If product is not in wishlist, add it
      wishlist.items.push({ productId });
      isInWishlist = true;
    }

    await wishlist.save();
    res.status(200).json({
      message: isInWishlist ? "Product added to wishlist" : "Product removed from wishlist",
      isInWishlist, // This will help in UI update
      wishlist,
    });
   

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's wishlist
exports.getWishlistByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: 'items.productId',
      populate: [
        { path: 'category' },  // Populate category
        { path: 'subcategory' } // Populate subcategory
      ],
    });

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
