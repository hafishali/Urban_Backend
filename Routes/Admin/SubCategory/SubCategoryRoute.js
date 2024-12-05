const express = require('express');
const router = express.Router();
const SubcategoryController = require('../../../Controllers/Admin/SubCategory/SubCategoryController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')
const multer=require('../../../Middlewares/multerMiddleware')

// create new subcategory
router.post('/create',jwtVerify,multer.single('image'),SubcategoryController.createSubCategory)

// get subcategory
router.get('/get',SubcategoryController.getSubCategories)

// get subcategorybyid
router.get('/get/:id',SubcategoryController.getSubCategoryById)

// update subcategory
router.patch('/update/:id',jwtVerify,multer.single('image'),SubcategoryController.updateSubCategory)

// delete subcategory
router.delete('/delete/:id',jwtVerify,SubcategoryController.deleteSubCategory)

module.exports = router;