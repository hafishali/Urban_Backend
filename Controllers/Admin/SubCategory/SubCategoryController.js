const SubCategory=require('../../../Models/Admin/SubcategoyModel')


// create subcategory
exports.createSubCategory=async(req,res)=>{
    const{title,category,image}=req.body
        if(!req.file){
            return res.status(400).json({message:"SubCategory Image is required"})
        }
    try {
       const newSubCategory=new SubCategory({title,category,image: req.file.filename}) 
        newSubCategory.save()
        res.status(201).json({ message: 'SubCategory created successfully' , SubCategory: newSubCategory});
    } catch (error) {
        res.status(500).json({message:"Internal Server Error",error})
    }
}

// get subcategory
