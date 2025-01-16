const SubCategory = require('../../../Models/Admin/SubcategoyModel')

// get subcategory
exports.getSubCategories = async (req, res) => {
    try {
        const subcategory = await SubCategory.find().populate('category')

        const SubcategoriesWithImageUrl = subcategory.map((subcategories) => ({
            id: subcategories._id,
            title: subcategories.title,
            MainCategory: {
                id: subcategories.category?._id,
                name: subcategories.category?.name,
                description: subcategories.category?.description,
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${subcategories.category?.image}`
            },
            SubImageUrl: subcategories.image
        }))
        res.status(200).json(SubcategoriesWithImageUrl);
        // res.status(200).json(subcategory);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching Sub categories', error: err.message });
    }
}

// get subcategorybyId
exports.getSubCategoryById = async (req, res)=> {
    const { id } = req.params;
    try {
        const subcategory = await SubCategory.findById(id).populate('category')
        if(!subcategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }   
        const SubcategoryWithImageUrl = {
            id: subcategory._id,
            title: subcategory.title,
            MainCategory: {
                id: subcategory.category?._id,
                name: subcategory.category?.name,
                description: subcategory.category?.description,
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${subcategory.category?.image}`
            },
            imageUrl: subcategory.image
        };
        res.status(200).json(SubcategoryWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching Subcategory', error: err.message });
    }
}