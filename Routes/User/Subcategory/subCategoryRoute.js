const express = require('express');
const router = express.Router();
const SubcategoryController = require('../../../Controllers/User/Subcategory/subCategoryController')

// get categories
router.get('/get',SubcategoryController.getSubCategories)

// get subcategorybyid
router.get('/get/:id',SubcategoryController.getSubCategoryById)


module.exports = router;