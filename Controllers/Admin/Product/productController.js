const Product = require('../../../Models/Admin/ProductModel');

// Add a new product
exports.addProduct = async (req, res) => {
  try {
    // Process uploaded image paths
    const imagePaths = req.files ? req.files.map((file) => file.path) : [];
    
    // Robust colors parsing with fallback and validation
    let colors = [];
    try {
      colors = typeof req.body.colors === "string" 
        ? JSON.parse(req.body.colors) 
        : (req.body.colors || []);
    } catch (parseError) {
      return res.status(400).json({
        error: "Invalid colors format",
        details: parseError.message
      });
    }

    // Validate colors structure
    const validatedColors = colors.map(color => ({
      color: color.color || '',
      sizes: (color.sizes || []).map(size => ({
        size: size.size || '',
        stock: parseInt(size.stock || 0, 10)
      }))
    }));

    // Calculate total stock from sizes
    const totalStock = validatedColors.reduce((total, color) => 
      total + color.sizes.reduce((colorTotal, size) => colorTotal + size.stock, 0)
    , 0);

    // Create the new product
    const newProduct = new Product({
      ...req.body,
      images: imagePaths,
      colors: validatedColors,
      totalStock,
    });

    const savedProduct = await newProduct.save();

    // Respond with success message
    res.status(201).json({
      message: "Product added successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    
    // More detailed error response
    res.status(400).json({
      error: "Product creation failed",
      details: error.message,
      validationErrors: error.errors ? Object.keys(error.errors) : []
    });
  }
};

 
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

// Update a product by ID with image handling
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingImages = product.images || [];
    const newImages = req.files ? req.files.map((file) => file.path) : [];
    if (existingImages.length + newImages.length > 5) {
      return res.status(400).json({ message: "Cannot have more than 5 images for a product" });
    }

    const updatedProductData = {
      ...req.body,
      images: [...existingImages, ...newImages],
    };

    if (req.body.colors && Array.isArray(req.body.colors)) {
      const updatedColors = req.body.colors.map(color => {
        if (color.sizes && Array.isArray(color.sizes)) {
          const updatedSizes = color.sizes.map(size => ({
            size: size.size,
            stock: size.stock,
          }));
          return {
            color: color.color,
            sizes: updatedSizes,
          };
        }
        return color;
      });

      // Calculate total stock
      const totalStock = updatedColors.reduce((total, color) => {
        const colorStock = color.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0);
        return total + colorStock;
      }, 0);

      updatedProductData.colors = updatedColors;
      updatedProductData.totalStock = totalStock; // Update total stock
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updatedProductData,
      { new: true } // Return the updated document
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