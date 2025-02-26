const Product = require('../../../Models/Admin/ProductModel');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');


const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
    },
});


// Add a new product
  exports.addProduct = async (req, res) => {
    try {
      
      const imageUrls = req.fileUrls || [];
      console.log(imageUrls)
      if (!req.body.product_Code) {
        return res.status(400).json({ error: "Product Code is required." });
      }
      const existingProduct = await Product.findOne({ product_Code: req.body.product_Code });

      if (existingProduct) {
        return res.status(400).json({
          error: "A product with the same Product Code already exists.",
        });
      }

      // Step 2: Parse and validate colors with robust error handling
      let colors = [];
      try {
        colors = typeof req.body.colors === "string" 
          ? JSON.parse(req.body.colors) 
          : (req.body.colors || []);
      } catch (parseError) {
        return res.status(400).json({
          error: "Invalid colors format",
          details: parseError.message,
        });
      }

      // Validate colors structure
      const validatedColors = colors.map((color) => ({
        color: color.color || "",
        sizes: (color.sizes || []).map((size) => ({
          size: size.size || "",
          stock: parseInt(size.stock || 0, 10),
        })),
      }));

      // Step 3: Calculate total stock
      const totalStock = validatedColors.reduce(
        (total, color) =>
          total +
          color.sizes.reduce((colorTotal, size) => colorTotal + size.stock, 0),
        0
      );

      const newProduct = new Product({
        ...req.body,
        images: imageUrls, 
        colors: validatedColors,
        totalStock,
      });

      const savedProduct = await newProduct.save();

      res.status(201).json({
        message: "Product added successfully",
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error adding product:", error);

      // Detailed error response
      res.status(400).json({
        error: "Product creation failed",
        details: error.message,
        validationErrors: error.errors ? Object.keys(error.errors) : [],
      });
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
      .populate('subcategory').sort({createdAt:-1})

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
// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     const existingImages = product.images || [];
//     const newImages = req.files ? req.files.map((file) => file.path) : [];
//     if (existingImages.length + newImages.length > 5) {
//       return res.status(400).json({ message: "Cannot have more than 5 images for a product" });
//     }

//     const updatedProductData = {
//       ...req.body,
//       images: [...existingImages, ...newImages],
//     };

//     if (req.body.colors && Array.isArray(req.body.colors)) {
//       const updatedColors = req.body.colors.map(color => {
//         if (color.sizes && Array.isArray(color.sizes)) {
//           const updatedSizes = color.sizes.map(size => ({
//             size: size.size,
//             stock: size.stock,
//           }));
//           return {
//             color: color.color,
//             sizes: updatedSizes,
//           };
//         }
//         return color;
//       });

//       // Calculate total stock
//       const totalStock = updatedColors.reduce((total, color) => {
//         const colorStock = color.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0);
//         return total + colorStock;
//       }, 0);

//       updatedProductData.colors = updatedColors;
//       updatedProductData.totalStock = totalStock; // Update total stock
//     }
//     const updatedProduct = await Product.findByIdAndUpdate(
//       req.params.id,
//       updatedProductData,
//       { new: true } // Return the updated document
//     );
//     res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingImages = product.images || [];
    const newImages = req.fileUrls || [];
    if (existingImages.length + newImages.length > 5) {
      return res.status(400).json({ message: "Cannot have more than 5 images for a product" });
    }

    const updatedProductData = {
      ...req.body,
      images: [...existingImages, ...newImages],
    };

    // Ensure `colors` field is parsed correctly
    if (req.body.colors) {
      let parsedColors;

      // Attempt to parse colors (handles case where it is a JSON string)
      try {
        parsedColors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : req.body.colors;
      } catch (err) {
        return res.status(400).json({ message: "Invalid colors format" });
      }

      if (Array.isArray(parsedColors)) {
        const updatedColors = parsedColors.map((color) => {
          if (color.sizes && Array.isArray(color.sizes)) {
            const updatedSizes = color.sizes.map((size) => ({
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

        // Calculate total stock from all colors and sizes
        const totalStock = updatedColors.reduce((total, color) => {
          const colorStock = color.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0);
          return total + colorStock;
        }, 0);

        updatedProductData.totalStock = totalStock; // Update total stock in the product data
        updatedProductData.colors = updatedColors;
      }
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

    // Find the product in the database
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Prevent deletion if only one image remains and at least one is required
    if (product.images.length === 1 && product.images.includes(imageName)) {
      return res
        .status(400)
        .json({ message: 'At least one product image is required' });
    }

    // Filter out the image to be deleted from the images array
    const updatedImages = product.images.filter((img) => img !== imageName);

    if (updatedImages.length === product.images.length) {
      return res.status(400).json({ message: 'Image not found in product' });
    }

    // Update the product's images array
    product.images = updatedImages;

    // Prepare S3 delete params
    const imageUrl = imageName; // The image URL passed in the request body
    const fileName = imageUrl.split('/').pop(); // Extract file name from the URL
    const imageKey = `Products/${fileName}`;

    // Define the delete command for S3
    const params = {
      Bucket: process.env.BUCKET_NAME, // Your S3 bucket name
      Key: imageKey, // Key of the image to delete (path in the bucket)
    };

    // Execute the delete command to remove the image from S3
    const deleteCommand = new DeleteObjectCommand(params);
    const response = await s3.send(deleteCommand);
    console.log('Delete Response:', response); // Optional: Log the S3 delete response

    // Save the updated product to the database
    await product.save();

    // Send response back to the client
    res.status(200).json({ message: 'Image deleted successfully', images: product.images });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: error.message });
  }
};






exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;  // Extract product ID from the request params
    
    // Find the product and retrieve all the image URLs
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Step 1: Delete all product images from S3
    for (const imageUrl of product.images) {
      const fileName = imageUrl.split('/').pop();  // Extract file name from image URL
      const imageKey = `Products/${fileName}`;  // Assuming images are stored under 'Products' in your S3 bucket

      // Step 2: Prepare S3 delete params
      const params = {
        Bucket: process.env.BUCKET_NAME,  // Your S3 bucket name
        Key: imageKey,  // Key of the image to delete (path in the bucket)
      };

      // Step 3: Delete the image from S3
      const deleteCommand = new DeleteObjectCommand(params);
      await s3.send(deleteCommand);  // Send the delete command to S3
      console.log(`Deleted image: ${imageKey}`);
    }

    // Step 4: Delete the product from the database
    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product and associated images deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(400).json({ error: error.message });
  }
};


// filter products
exports.filterProductsByCategoryId = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'No category IDs provided for filtering' });
    }
    const filteredProducts = await Product.find({
      category: { $in: categoryIds }
    });
    res.status(200).json({
      message: 'Products filtered successfully',
      products: filteredProducts,
    });
  } catch (error) {
    console.error('Error filtering products by category ID:', error);
    res.status(500).json({
      message: 'Failed to filter products',
      error: error.message,
    });
  }
};