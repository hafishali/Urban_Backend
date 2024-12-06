const express = require('express');
const router = express.Router();
const categoryController = require('../../../Controllers/Admin/Category/CategoryController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')
const multer=require('../../../Middlewares/multerMiddleware')

// create a new category
router.post('/create',jwtVerify(['admin']),multer.single('image') ,categoryController.createCategory);

// get all category
router.get('/get', categoryController.getCategories);

// get single category by id
router.get('/get/:id',categoryController.getCategoryById)

// update category
router.patch('/update/:id',jwtVerify(['admin']),multer.single('image'), categoryController.updateCategory);

// delete category
router.delete('/delete/:id',jwtVerify(['admin']), categoryController.deleteCategory);

// search category
router.get('/search', categoryController.searchCategory)

module.exports = router;