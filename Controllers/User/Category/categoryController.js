const Category = require('../../../Models/Admin/CategoryModel')

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