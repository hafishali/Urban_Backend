const Product = require('../../../Models/Admin/ProductModel');

// Add a new product
exports.addProduct = async (req, res) => {
    try {
      const imagePaths = req.files.map((file) => file.path); 
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

// Update a product by ID
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
