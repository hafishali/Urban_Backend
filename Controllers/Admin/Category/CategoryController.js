const Category = require('../../../Models/Admin/CategoryModel')
const fs = require('fs');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');


const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use your AWS access key
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Use your AWS secret key
    },
});

// create a new category
exports.createCategory = async (req, res) => {
    const { name, description, isActive } = req.body;

    // Check if an image is uploaded
    if (!req.file) {
        return res.status(400).json({ message: 'Category image is required' });
    }

    try {
        // Get the S3 URL from the uploaded file
        const imageUrl = req.fileUrl; // Multer-S3 provides the `location` property for the file URL

        // Create a new category with the provided data
        const newCategory = new Category({
            name,
            image: imageUrl, // Save the S3 URL instead of a filename
            isActive: isActive === undefined ? true : isActive,
            description,
        });

        // Save the category to the database
        await newCategory.save();

        // Respond with success
        res.status(201).json({
            message: 'Category created successfully',
            category: newCategory
        });
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({
            message: 'Error creating category',
            error: err.message
        });
    }
};
// get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({createdAt:-1})

        const categoriesWithImageUrl = categories.map((category) => ({
            id: category._id,
            name: category.name,
            isActive: category.isActive,
            description: category.description,
            imageUrl: category.image
        }))
        res.status(200).json(categoriesWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
}

// get a category by Id
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        // find the category by Id
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Construct the category with an image URL
        const categoryWithImageUrl = {
            id: category._id,
            name: category.name,
            isActive: category.isActive,
            description: category.description,
            imageUrl: category.image
        };

        res.status(200).json(categoryWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching category', error: err.message });
    }
}

// update category
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  try {
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Update name and description if provided
    if (name) category.name = name;
    if (description) category.description = description;

    // Toggle or set isActive if provided
    if (isActive !== undefined) {
      category.isActive = isActive === 'true' || isActive === true; // Convert to boolean
    }

    // Handle image update
    if (req.fileUrl) {
      // Extract old image info before updating
      const oldImageUrl = category.image;
      const oldFileName = oldImageUrl ? oldImageUrl.split('/').pop() : null;

      // Update the new image
      category.image = req.fileUrl;

      // Delete the old image from S3 if it exists
      if (oldFileName) {
        const oldImageKey = `Categories/${oldFileName}`;
        const deleteParams = {
          Bucket: process.env.BUCKET_NAME,
          Key: oldImageKey,
        };

        try {
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3.send(deleteCommand);
          console.log(`Old image deleted from S3: ${oldImageKey}`);
        } catch (err) {
          console.error(`Error deleting old image from S3: ${err.message}`);
        }
      }
    }

    // Save the updated category
    await category.save();

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (err) {
    console.error(`Error updating category: ${err.message}`);
    res.status(500).json({ message: 'Error updating category', error: err.message });
  }
};

// delete category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const imageUrl = category.image; // Full URL from the database
        const fileName = imageUrl.split('/').pop(); // Extract the file name
        const imageKey = `Categories/${fileName}`;
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: imageKey,
        };

        console.log("Params:", params); // Debugging: Log params to verify

        // Send the delete command to S3
        const deleteCommand = new DeleteObjectCommand(params);
        const response = await s3.send(deleteCommand);

        console.log("Delete Response:", response); // Debugging: Log response from S3

        // Delete the category from the database
        await Category.findByIdAndDelete(id);

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ message: 'Error deleting category', error: err.message });
    }
};

// search category by name
exports.searchCategory = async (req, res) => {
    const { name } = req.query;

    try {
        // build the query dynamically
        const query = {};
        if (name) {
            query.name = { $regex: name, $options: 'i' }; // Case-insensitive regex
        }

        const categories = await Category.find(query);

        // Add image URLs to the response
        const categoriesWithImageUrl = categories.map((category) => ({
            id: category._id,
            name: category.name,
            isActive: category.isActive,
            description: category.description,
            imageUrl: category.image
        }));

        res.status(200).json(categoriesWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error searching categories', error: err.message });
    }
};