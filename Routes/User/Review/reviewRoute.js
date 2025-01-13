const express = require('express');
const router = express.Router();
const ReviewController = require('../../../Controllers/User/Review/reviewController')
const multerMiddleware =require('../../../Middlewares/multerMiddleware')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')



router.post("/add",  jwtVerify(['user']),multerMiddleware.upload.single('image'), multerMiddleware.uploadToS3Middleware, ReviewController.addReview); // Add review
router.get("/:productId", ReviewController.getReviewsByProduct); // Get reviews by product

module.exports = router;