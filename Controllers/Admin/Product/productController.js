const Product = require('../../../Models/Admin/ProductModel');

// Add a new product
exports.addProduct = async (req, res) => {
  try {
    const imagePaths = req.files ? req.files.map((file) => file.path) : []; 
    
    // Calculate total stock
    const colors = req.body.colors || [];
    let totalStock = 0;

    colors.forEach(color => {
      if (color.sizes) {
        color.sizes.forEach(size => {
          totalStock += parseInt(size.stock || 0, 10);
        });
      }
    });

    const newProduct = new Product({
      ...req.body,
      images: imagePaths,
      totalStock, // Set calculated stock
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ message: "Product added successfully", product: savedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

 

// Get all products with optional filtering by category
exports.getAllProducts = async (req, res) => {
  try {
    const { category } = req.query; // Expect categories as a comma-separated string

    const filter = {};
    if (category) {
      const categoryArray = category.split(','); // Convert comma-separated string to an array
      filter.category = { $in: categoryArray }; // Filter by multiple categories
    }

    const products = await Product.find(filter)
      .populate('category')
      .populate('subcategory');

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

// Update a product by ID with image handling
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get existing images and handle file uploads
    const existingImages = product.images || [];
    const newImages = req.files ? req.files.map((file) => file.path) : [];
    if (existingImages.length + newImages.length > 5) {
      return res.status(400).json({ message: "Cannot have more than 5 images for a product" });
    }

    // Update product details (text fields, features, etc.)
    const updatedProductData = {
      ...req.body,
      images: [...existingImages, ...newImages],
    };

    // Update colors, sizes, and stock
    if (req.body.colors && Array.isArray(req.body.colors)) {
      const updatedColors = req.body.colors.map(color => {
        // For each color, make sure sizes and stock are present
        if (color.sizes && Array.isArray(color.sizes)) {
          const updatedSizes = color.sizes.map(size => {
            // Ensure that each size has the correct stock value
            return {
              size: size.size,
              stock: size.stock,
            };
          });
          return {
            color: color.color,
            sizes: updatedSizes,
          };
        }
        return color;
      });

      // Calculate total stock based on the updated color/size stock values
      const totalStock = updatedColors.reduce((total, color) => {
        const colorStock = color.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0);
        return total + colorStock;
      }, 0);

      // Add the total stock to the product data
      updatedProductData.stock = totalStock;
      updatedProductData.colors = updatedColors;
    }

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updatedProductData,
      { new: true }
    );

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Delete a specific image by name
exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params; 
    const { imageName } = req.body; 
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const updatedImages = product.images.filter((img) => {
      const imgFileName = img.split("\\").pop().split("/").pop(); 
      return imgFileName !== imageName;
    });
    if (updatedImages.length === product.images.length) {
      return res.status(400).json({ message: "Image not found in product" });
    }
    product.images = updatedImages;
    await product.save();
    res.status(200).json({ message: "Image deleted successfully", images: product.images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};