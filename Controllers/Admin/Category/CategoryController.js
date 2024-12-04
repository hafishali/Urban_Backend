const Category = require('../../../Models/Admin/CategoryModel')
const fs = require('fs');

// create a new category
exports.createCategory = async (req, res) => {
        const { name,description } = req.body;

        if(!req.file){
            return res.status(400).json({ message: 'Category image is required'});
        }
        try {
            const newCategory = new Category(
                { name: name, image: req.file.filename, description: description }
            );
            await newCategory.save();
            res.status(201).json({ message: 'Category created successfully' , category: newCategory});
        } catch (err) {
            res.status(500).json({ message: 'Error creating category', error: err.message });
            
        }
    }


// get all categories

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

// update category

exports.updateCategory = async (req, res) => {
        const { id } = req.params;
        const { name,description } = req.body;

        try {
            const category = await Category.findById(id);

            if(!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
           // update name if provided
            if(name) category.name = name;

            if(description) category.description = description;
            if (req.file) {
                // delete the old image
                const oldImagePath = `./uploads/category/${category.image};`
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }

                // set the new image filename
                category.image = req.file.filename;
            }

            await category.save();
            res.status(200).json({ message: 'Category updated successfully', category });
        } catch (err) {
            res.status(500).json({ message: 'Error updating category', error: err.message });
        }
        
    }


// delete category

exports.deleteCategory = async (req,res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);

        if(!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // delete the image file
        const imagePath = `./uploads/category/${category.image}`
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // delete the category from the database
        await Category.findByIdAndDelete(id);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category', error: err.message });
    }
};