const express = require('express');
const cartController = require('../../../Controllers/User/Cart/cartController')
const router = express.Router();

// Cart routes
router.post('/add', cartController.addToCart);
router.get('/view-cart/:userId', cartController.getCartByUserId);
router.delete('/remove', cartController.removeFromCart);
router.patch('/update', cartController.updateCartItemQuantity);
router.delete('/clear/:userId', cartController.clearCart);
router.post('/applyCoupon',cartController.applyCouponToCart)

module.exports = router;
// mnb