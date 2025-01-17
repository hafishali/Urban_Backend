const Product = require('../../../Models/Admin/ProductModel');


// Get all products
exports.getAllProducts = async (req, res) => {
    try {
      const products = await Product.find().populate('category').populate('subcategory');
      res.status(200).json(products);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
  // Get a single product by ID
  exports.getProductById = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('category').populate('subcategory');
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };


  exports.getProductsByCategoryId = async (req, res) => {
    try {
      const categoryId = req.params.categoryId; // Category ID from the URL parameters
      
      // Find products by category ID
      const products = await Product.find({ category: categoryId }).populate('category').populate('subcategory');
      
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found in this category" });
      }
  
      res.status(200).json(products);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get all products by category ID and subcategory ID
exports.getProductsByCategoryAndSubcategoryId = async (req, res) => {
    try {
      const { categoryId, subcategoryId } = req.params; // Category and Subcategory ID from the URL parameters
      
      // Find products by category and subcategory IDs
      const products = await Product.find({ category: categoryId, subcategory: subcategoryId })
        .populate('category')
        .populate('subcategory');
      
      if (products.length === 0) {
        return res.status(404).json({ message: "No products found in this category and subcategory" });
      }
  
      res.status(200).json(products);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

// Search products by title
exports.searchProductsByName = async (req, res) => {
  try {
    const { name } = req.query; // Get the search term from query parameters
    const products = await Product.find({ title: { $regex: name, $options: 'i' } }) // Case-insensitive search
      .populate('category')
      .populate('subcategory');

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found matching the search criteria" });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// similar products

exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;   
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
      .populate('subcategory');

    if (similarProducts.length === 0) {
      return res.status(404).json({ message: "No similar products found" });
    }

    res.status(200).json(similarProducts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

