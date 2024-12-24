const express = require('express');
const cartController = require('../../../Controllers/User/Cart/cartController')
const router = express.Router();
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


// Cart routes

router.post('/add', jwtVerify(['user']), cartController.addToCart);
router.get('/view-cart/:userId', jwtVerify(['user']), cartController.getCartByUserId);
router.delete('/remove', jwtVerify(['user']), cartController.removeFromCart);
router.patch('/update', jwtVerify(['user']), cartController.updateCartItemQuantity);
router.delete('/clear/:userId', jwtVerify(['user']), cartController.clearCart);

router.post('/applyCoupon',jwtVerify(['user']),cartController.applyCouponToCart)


module.exports = router;
// mnb