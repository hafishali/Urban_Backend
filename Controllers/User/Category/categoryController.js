const mongoose = require('mongoose')
const Category = require('../../../Models/Admin/CategoryModel')
const Product = require('../../../Models/Admin/ProductModel')

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();

        const categoriesWithImageUrl = categories.map((category) => ({
            id: category._id,
            name: category.name,
            description: category.description,
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${category.image}`
        }))
        res.status(200).json(categoriesWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
}

// get a category by Id
 
exports.getCategoryById = async (req, res)=> {
    const { id } = req.params;

    try {
        // find the category by Id
        const category = await Category.findById(id);

        if(!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

         // Construct the category with an image URL
        const categoryWithImageUrl = {
            id: category._id,
            name: category.name,
            description: category.description,
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${category.image}`
        };

        res.status(200).json(categoryWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching category', error: err.message });
    }
}



//filter category
exports.filterCategories = async (req, res) => {
    try {
        const { size, minPrice, maxPrice, categoryId, categoryName } = req.query;

        // Build the aggregation pipeline
        const pipeline = [];

        // Match by category ID if provided
        if (categoryId) {
            pipeline.push({
                $match: { category: new mongoose.Types.ObjectId(categoryId) },
            });
        }
        if (categoryName) {
            const category = await Category.findOne({ name: categoryName });
            if (category) {
                pipeline.push({
                    $match: { category: category._id },
                });
            } else {
                return res.status(404).json({ message: 'Category not found' });
            }
        }

        // Match by price range
        if (minPrice || maxPrice) {
            pipeline.push({
                $match: {
                    offerPrice: {
                        ...(minPrice ? { $gte: parseFloat(minPrice) } : {}),
                        ...(maxPrice ? { $lte: parseFloat(maxPrice) } : {}),
                    },
                },
            });
        }

        // Match by size
        if (size) {
            pipeline.push({
                $match: {
                    colors: {
                        $elemMatch: {
                            sizes: {
                                $elemMatch: { size: size },
                            },
                        },
                    },
                },
            });
        }

        // Lookup to fetch category details
        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryDetails',
            },
        });

        // Unwind the category details array
        pipeline.push({
            $unwind: '$categoryDetails',
        });

        // Group products by category
        pipeline.push({
            $group: {
                _id: '$categoryDetails._id',
                name: { $first: '$categoryDetails.name' },
                description: { $first: '$categoryDetails.description' },
                imageUrl: { $first: '$categoryDetails.image' },
                products: { $push: '$$ROOT' },
            },
        });

        const filteredCategories = await Product.aggregate(pipeline);

        // Add image URL to category
        const response = filteredCategories.map(category => ({
            id: category._id,
            name: category.name,
            description: category.description,
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${category.imageUrl}`,
            products: category.products,
        }));

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ message: 'Error filtering categories', error: err.message });
    }
};
