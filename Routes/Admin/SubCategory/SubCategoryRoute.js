const express = require('express');
const router = express.Router();
const SubcategoryController = require('../../../Controllers/Admin/SubCategory/SubCategoryController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')
const multer=require('../../../Middlewares/multerMiddleware')

// create new subcategory
router.post('/create',jwtVerify,multer.single('image'),SubcategoryController.createSubCategory)

// search subcategory
router.get('/search', SubcategoryController.searchSubCategory)


module.exports = router;