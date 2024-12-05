const SubCategory=require('../../../Models/Admin/SubcategoyModel')


// create subcategory
exports.createSubCategory=async(req,res)=>{
    const{title,category}=req.body
        if(!req.file){
            return res.status(400).json({message:"SubCategory Image is required"})
        }
    try {
       const newSubCategory=new SubCategory({title,category,image: req.file.filename}) 
        await newSubCategory.save()
        res.status(201).json({ message: 'SubCategory created successfully' , SubCategory: newSubCategory});
    } catch (error) {
        res.status(500).json({message:"Internal Server Error",error})
    }
}

// get subcategory

// search subcategory by name
exports.searchSubCategory = async (req, res) => {
    const { name } = req.query;

    try {
        // Build the query dynamically
        const query = {};
        if (name) {
            query.title = { $regex: name, $options: 'i' }; // Case-insensitive regex
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
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${subcategory.category?.image}`
            },
            SubImageUrl: `${req.protocol}://${req.get('host')}/uploads/category/${subcategory.image}`
        }));

        res.status(200).json(SubcategoriesWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error searching categories', error: err.message });
    }
};

