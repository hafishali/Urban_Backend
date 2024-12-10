const express = require('express');
const wishlistController = require('../../../Controllers/User/Wishlist/wishlistController');
const router = express.Router();

// Add product to wishlist
router.post('/add', wishlistController.addToWishlist);

// Get wishlist by user ID
router.get('/view/:userId', wishlistController.getWishlistByUserId);

// Remove product from wishlist
router.delete('/remove', wishlistController.removeFromWishlist);

// Clear wishlist
router.delete('/clear/:userId', wishlistController.clearWishlist);

module.exports = router;