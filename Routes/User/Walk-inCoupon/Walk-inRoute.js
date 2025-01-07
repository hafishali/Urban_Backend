const express = require('express');
const W_CouponController = require('../../../Controllers/User/Walk-in Coupon/WalkinCouponcontroller');
const jwtVerify=require('../../../Middlewares/jwtMiddleware')
const router = express.Router();

// Add product to wishlist
router.post('/create/:userId', jwtVerify(['user']),W_CouponController.createCoupen);

// Get wishlist by user ID
router.get('/view/:userId', jwtVerify(['user']),W_CouponController.getCoupenbyId);


module.exports = router;