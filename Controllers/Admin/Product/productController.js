const Product = require('../../../Models/Admin/ProductModel');

// Add a new product
exports.addProduct = async (req, res) => {
  try {
    const imagePaths = req.files ? req.files.map((file) => file.path) : []; 
    const newProduct = new Product({
      ...req.body, 
      images: imagePaths,
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
    const existingImages = product.images || [];
    const newImages = req.files ? req.files.map((file) => file.path) : [];
    if (existingImages.length + newImages.length > 5) {
      return res.status(400).json({ message: "Cannot have more than 5 images for a product" });
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        images: [...existingImages, ...newImages],
      },
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