const SubCategory = require('../../../Models/Admin/SubcategoyModel')
const fs = require('fs');

// create subcategory
exports.createSubCategory=async(req,res)=>{
    const{title,category, isActive}=req.body
        if(!req.file){
            return res.status(400).json({message:"SubCategory Image is required"})
        }
    try {
       const newSubCategory=new SubCategory({title,category,isActive: isActive === undefined ? true : isActive, image: req.file.filename}) 
        await newSubCategory.save()
        res.status(201).json({ message: 'SubCategory created successfully' , SubCategory: newSubCategory});
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error })
    }
}

// get subcategory
exports.getSubCategories = async (req, res) => {
    try {
        const subcategory = await SubCategory.find().populate('category')

        const SubcategoriesWithImageUrl = subcategory.map((subcategories) => ({
            id: subcategories._id,
            title: subcategories.title,
            isActive: subcategories.isActive,
            MainCategory: {
                id: subcategories.category?._id,
                name: subcategories.category?.name,
                description: subcategories.category?.description,
                imageUrl: subcategories.category?.image
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
            isActive: subcategory.isActive,
            MainCategory: {
                id: subcategory.category?._id,
                name: subcategory.category?.name,
                description: subcategory.category?.description,
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${subcategory.category?.image}`
            },
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${subcategory.image}`
        };
        res.status(200).json(SubcategoryWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching Subcategory', error: err.message });
    }
}

// update category
exports.updateSubCategory = async (req, res) => {
    const { id } = req.params;
    const updates = req.body; 
    try {
        if (req.file) {
            const subcategory = await SubCategory.findById(id);
            if (subcategory && subcategory.image) {
                const oldImagePath = `./uploads/category/${subcategory.image}`;
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updates.image = req.file.filename;
        }
        if (updates.isActive !== undefined) {
            updates.isActive = updates.isActive === 'true' || updates.isActive === true; // Convert to boolean
          }

        const updatedSubCategory = await SubCategory.findByIdAndUpdate(id, updates, {
            new: true, 
            runValidators: true, 
        });
        if (!updatedSubCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }
        res.status(200).json({ message: 'SubCategory updated successfully', updatedSubCategory });
    } catch (err) {
        res.status(500).json({ message: 'Error updating SubCategory', error: err.message });
    }
};

// delete subcategory
exports.deleteSubCategory = async (req,res) => {
    const { id } = req.params;

    try {
        const subcategory = await SubCategory.findById(id);

        if(!subcategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        // delete the image file
        const imagePath = `./uploads/category/${subcategory.image}`
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // delete the category from the database
        await SubCategory.findByIdAndDelete(id);
        res.status(200).json({ message: 'SubCategory deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting Subcategory', error: err.message });
    }
};

// search subcategory
exports.searchSubCategory = async (req, res) => {
    const { name } = req.query;

    try {
        // Build the query dynamically
        const query = {};
        if (name) {
            query.title = { $regex: name, $options: 'i' }; // Case-insensitive regex
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true; // Convert to boolean
          }

        const SubCategoryData = await SubCategory.find(query).populate('category');

        // Add image URLs to the response
        const SubcategoriesWithImageUrl = SubCategoryData.map((subcategory) => ({
            id: subcategory._id,
            title: subcategory.title,
            MainCategory: {
                id: subcategory.category?._id,
                name: subcategory.category?.name,
                description: subcategory.category?.description,
                imageUrl: subcategory.category?.image
            },
            SubImageUrl: subcategory.image
        }));

        res.status(200).json(SubcategoriesWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error searching categories', error: err.message });
    }

};


