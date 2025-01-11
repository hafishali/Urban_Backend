const express = require('express');
const router = express.Router();
const SubcategoryController = require('../../../Controllers/Admin/SubCategory/SubCategoryController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')
const multerMiddleware =require('../../../Middlewares/multerMiddleware')

// create new subcategory
router.post('/create',jwtVerify(['admin']),multerMiddleware.upload.single('image'), multerMiddleware.uploadToS3Middleware,SubcategoryController.createSubCategory)

// get subcategory
router.get('/get',SubcategoryController.getSubCategories)

// get subcategorybyid
router.get('/get/:id',SubcategoryController.getSubCategoryById)

// update subcategory
router.patch('/update/:id',jwtVerify(['admin']),multerMiddleware.upload.single('image'), multerMiddleware.uploadToS3Middleware,SubcategoryController.updateSubCategory)

// delete subcategory
router.delete('/delete/:id',jwtVerify(['admin']),SubcategoryController.deleteSubCategory)

// search category
router.get('/search', SubcategoryController.searchSubCategory)


module.exports = router;