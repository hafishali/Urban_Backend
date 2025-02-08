const mongoose = require('mongoose')
const Category = require('../../../Models/Admin/CategoryModel')
const Product = require('../../../Models/Admin/ProductModel')

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({createdAt:-1})

        const categoriesWithImageUrl = categories.map((category) => ({
            id: category._id,
            name: category.name,
            description: category.description,
            imageUrl: category.image
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
            imageUrl: category.image
        };

        res.status(200).json(categoryWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching category', error: err.message });
    }
}



//filter category
exports.filterCategories = async (req, res) => {
    try {
        const { size, minPrice, maxPrice, material, categoryId, subcategoryId } = req.query;

        if (!categoryId) {
            return res.status(400).json({ message: 'Category ID is required' });
        }

        // Build the aggregation pipeline
        const pipeline = [];

        // First stage: Match products by category ID
        pipeline.push({
            $match: { category: new mongoose.Types.ObjectId(categoryId) }
        });

        // Match by subcategory if provided
        if (subcategoryId) {
            pipeline.push({
                $match: { subcategory: new mongoose.Types.ObjectId(subcategoryId) }
            });
        }

        // Match by material if provided
        if (material) {
            pipeline.push({
                $match: { material: material }
            });
        }

        // Match by price range
        if (minPrice || maxPrice) {
            pipeline.push({
                $match: {
                    offerPrice: {
                        ...(minPrice ? { $gte: parseFloat(minPrice) } : {}),
                        ...(maxPrice ? { $lte: parseFloat(maxPrice) } : {})
                    }
                }
            });
        }

        // Match by size
        if (size) {
            pipeline.push({
                $match: {
                    colors: {
                        $elemMatch: {
                            sizes: {
                                $elemMatch: { size: size }
                            }
                        }
                    }
                }
            });
        }

        // Lookup to fetch category details
        pipeline.push({
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        });

        // Lookup to fetch subcategory details
        pipeline.push({
            $lookup: {
                from: 'subcategories',
                localField: 'subcategory',
                foreignField: '_id',
                as: 'subcategoryDetails'
            }
        });

        // Unwind the category details array
        pipeline.push({
            $unwind: '$categoryDetails'
        });

        // Unwind the subcategory details array if subcategory exists
        pipeline.push({
            $unwind: {
                path: '$subcategoryDetails',
                preserveNullAndEmptyArrays: true
            }
        });

        // Project the final structure
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                material: 1,
                offerPrice: 1,
                originalPrice: 1,
                colors: 1,
                images: 1,
                category: {
                    _id: '$categoryDetails._id',
                    name: '$categoryDetails.name',
                    description: '$categoryDetails.description'
                },
                subcategory: {
                    _id: '$subcategoryDetails._id',
                    title: '$subcategoryDetails.title',
                    
                }
            }
        });

        const filteredProducts = await Product.aggregate(pipeline);

        // Add full URLs to product images
        const response = filteredProducts.map(product => ({
            ...product,
            images: product.images.map(image => 
                `${req.protocol}://${req.get('host')}/uploads/products/${image}`
            )
        }));

        res.status(200).json({
            categoryId: categoryId,
            subcategoryId: subcategoryId || null,
            totalProducts: response.length,
            filters: {
                material: material || null,
                size: size || null,
                priceRange: {
                    min: minPrice || null,
                    max: maxPrice || null
                }
            },
            products: response
        });

    } catch (err) {
        res.status(500).json({ 
            message: 'Error filtering products', 
            error: err.message 
        });
    }
};
