const SubCategory = require('../../../Models/Admin/SubcategoyModel')
const fs = require('fs');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');


const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use your AWS access key
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Use your AWS secret key
    },
});


// create subcategory
exports.createSubCategory=async(req,res)=>{
    const{title,category, isActive}=req.body
        if(!req.file){
            return res.status(400).json({message:"SubCategory Image is required"})
        }
    try {
       const newSubCategory=new SubCategory({title,category,isActive: isActive === undefined ? true : isActive, image: req.fileUrl}) 
        await newSubCategory.save()
        res.status(201).json({ message: 'SubCategory created successfully' , SubCategory: newSubCategory});
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error })
    }
}

// get subcategory
exports.getSubCategories = async (req, res) => {
    try {
        const subcategory = await SubCategory.find().populate('category').sort({createdAt:-1})

       
        res.status(200).json(subcategory);
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
       
        res.status(200).json(subcategory);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching Subcategory', error: err.message });
    }
}

// update category
exports.updateSubCategory = async (req, res) => {
    const { id } = req.params;
    const updates = req.body; 
    try {
        if (req.fileUrl) {
            const subcategory = await SubCategory.findById(id);
            const oldImageUrl = subcategory.image;
            const oldFileName = oldImageUrl ? oldImageUrl.split('/').pop() : null;
            updates.image = req.fileUrl;
             if (oldFileName) {
                    const oldImageKey = `SubCategories/${oldFileName}`;
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
        const imageUrl = subcategory.image; // Full URL from the database
                const fileName = imageUrl.split('/').pop(); // Extract the file name
                const imageKey = `SubCategories/${fileName}`;
                const params = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: imageKey,
                };
        
                console.log("Params:", params); // Debugging: Log params to verify
        
                // Send the delete command to S3
                const deleteCommand = new DeleteObjectCommand(params);
                const response = await s3.send(deleteCommand);

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

       

        const SubCategoryData = await SubCategory.find(query).populate('category').sort({createdAt:-1})

       

        res.status(200).json(SubCategoryData);
    } catch (err) {
        res.status(500).json({ message: 'Error searching categories', error: err.message });
    }

};


