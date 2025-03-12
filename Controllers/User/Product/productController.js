const Product = require('../../../Models/Admin/ProductModel');
const Wishlist=require('../../../Models/User/WishlistModel')

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
      const { userId } = req.query; // Get userId from query params

      // Fetch all products
      const products = await Product.find()
          .populate('category')
          .populate('subcategory')
          .sort({ createdAt: -1 });

      let wishlistItems = [];

      if (userId) {
          // Fetch wishlist items for the logged-in user
          const wishlist = await Wishlist.findOne({ userId });

          if (wishlist) {
              wishlistItems = wishlist.items.map(item => item.productId.toString());
          }
      }

      // Add `isInWishlist` field to each product
      const updatedProducts = products.map(product => ({
          ...product.toObject(),
          isInWishlist: wishlistItems.includes(product._id.toString())
      }));

      res.status(200).json(updatedProducts);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

  
  // Get a single product by ID
  exports.getProductById = async (req, res) => {
    try {
        const { userId } = req.query; // Get userId from query params

        // Fetch the product by ID
        const product = await Product.findById(req.params.id)
            .populate('category')
            .populate('subcategory');

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let isInWishlist = false;

        if (userId) {
            // Check if the product exists in the user's wishlist
            const wishlist = await Wishlist.findOne({ userId, "items.productId": product._id });

            if (wishlist) {
                isInWishlist = true;
            }
        }

        // Add isInWishlist field to the response
        res.status(200).json({ ...product.toObject(), isInWishlist });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};



exports.getProductsByCategoryId = async (req, res) => {
  try {
      const { userId } = req.query; // Get userId from query params
      const categoryId = req.params.categoryId; // Category ID from the URL parameters

      // Find products by category ID
      const products = await Product.find({ category: categoryId })
          .populate('category')
          .populate('subcategory').lean()

      if (products.length === 0) {
          return res.status(404).json({ message: "No products found in this category" });
      }

      if (userId) {
          // Fetch the user's wishlist to check for wishlisted products
          const wishlist = await Wishlist.findOne({ userId });
          console.log(wishlist)
          if (wishlist) {
              const wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
              

              // Add isInWishlist flag to each product
              products.forEach(product => {
                  product.isInWishlist = wishlistedProductIds.has(product._id.toString());
              });
          }
      }

      res.status(200).json(products);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};


  // Get all products by category ID and subcategory ID
// Get products by category and subcategory with wishlist check
exports.getProductsByCategoryAndSubcategoryId = async (req, res) => {
  try {
      const { categoryId, subcategoryId } = req.params;
      const { userId } = req.query; // Get userId from query params

      // Find products by category and subcategory IDs
      const products = await Product.find({ category: categoryId, subcategory: subcategoryId })
          .populate('category')
          .populate('subcategory');

      if (products.length === 0) {
          return res.status(404).json({ message: "No products found in this category and subcategory" });
      }

      if (userId) {
          const wishlist = await Wishlist.findOne({ userId });

          if (wishlist) {
              const wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
              products.forEach(product => {
                  product.isInWishlist = wishlistedProductIds.has(product._id.toString());
              });
          }
      }

      res.status(200).json(products);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

// Search products by title with wishlist check
exports.searchProductsByName = async (req, res) => {
  try {
      const { name, userId } = req.query; // Get search term and userId
      const products = await Product.find({ title: { $regex: name, $options: 'i' } }) // Case-insensitive search
          .populate('category')
          .populate('subcategory');

      if (products.length === 0) {
          return res.status(404).json({ message: "No products found matching the search criteria" });
      }

      if (userId) {
          const wishlist = await Wishlist.findOne({ userId });

          if (wishlist) {
              const wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
              products.forEach(product => {
                  product.isInWishlist = wishlistedProductIds.has(product._id.toString());
              });
          }
      }

      res.status(200).json(products);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

// Get similar products with wishlist check
exports.getSimilarProducts = async (req, res) => {
  try {
      const { productId } = req.params;
      const { userId } = req.query;

      const referenceProduct = await Product.findById(productId);
      if (!referenceProduct) {
          return res.status(404).json({ message: "Reference product not found" });
      }

      const query = {
          category: referenceProduct.category,
          subcategory: referenceProduct.subcategory,
          _id: { $ne: referenceProduct._id },
          $or: [
              { 'colors.color': { $in: referenceProduct.colors.map(colorObj => colorObj.color) } },
              { 'features.material': referenceProduct.features.material },
              { manufacturerBrand: referenceProduct.manufacturerBrand }
          ]
      };

      const similarProducts = await Product.find(query)
          .populate('category')
          .populate('subcategory').lean();

      if (similarProducts.length === 0) {
          return res.status(404).json({ message: "No similar products found" });
      }

      if (userId) {
          const wishlist = await Wishlist.findOne({ userId });
          console.log(wishlist)

          if (wishlist) {
              const wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
              similarProducts.forEach(product => {
                  product.isInWishlist = wishlistedProductIds.has(product._id.toString());
              });
          }
      }

      res.status(200).json(similarProducts);
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

