const express = require('express');
const router = express.Router();
const CouponController = require('../../../Controllers/Admin/Coupon/couponController');
const jwtVerify = require('../../../Middlewares/jwtMiddleware')

// create new coupon
router.post('/create', jwtVerify(['admin']), CouponController.createCoupon)

// get all coupon
router.get('/list', jwtVerify(['user','admin']), CouponController.getCoupons)

// get a coupon by id
router.get('/:id', CouponController.getCouponById)

// update a coupon
router.patch('/update/:id', jwtVerify, CouponController.updateCoupon)

// delete a coupon
router.delete('/delete/:id', jwtVerify, CouponController.deleteCoupon)

module.exports = router;
 