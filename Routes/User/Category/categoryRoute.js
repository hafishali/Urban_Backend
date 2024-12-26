const express = require('express');
const router = express.Router();
const categoryController = require('../../../Controllers/User/Category/categoryController')


// get all category
router.get('/get', categoryController.getCategories);

// get single category by id
router.get('/get/:id',categoryController.getCategoryById)

//filter 
router.get('/filter', categoryController.filterCategories)

module.exports = router;