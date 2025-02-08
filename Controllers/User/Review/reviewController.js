const Review = require("../../../Models/User/ReviewModel");
const Order = require("../../../Models/User/OrderModel");
const Product = require("../../../Models/Admin/ProductModel");

// Add Review
exports.addReview = async (req, res) => {
  const { userId, productId, rating, message } = req.body;
  const image = req.fileUrl

  try {
    const order = await Order.findOne({
      userId,
      "products.productId": productId,
      status: "Delivered", 
    });

    if (!order) {
      return res.status(403).json({
        message: "You can only review products you have purchased and received.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = new Review({
      userId,
      productId,
      rating,
      message,
      image,
    });

    await review.save();

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Reviews for a Product
exports.getReviewsByProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const reviews = await Review.find({ productId }).populate("userId", "name").sort({createdAt:-1})
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
