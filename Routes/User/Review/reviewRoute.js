const express = require('express');
const router = express.Router();
const ReviewController = require('../../../Controllers/User/Review/reviewController')
const multer=require('../../../Middlewares/multerMiddleware')


router.post("/add", multer.single('image'), ReviewController.addReview); // Add review
router.get("/:productId", ReviewController.getReviewsByProduct); // Get reviews by product

module.exports = router;