const express = require('express');
const router = express.Router();
const productController = require('../../../Controllers/User/Product/productController')


// Get all products
router.get('/view-products', productController.getAllProducts);

// Get a single product by ID
router.get('/product/:id', productController.getProductById);

router.get('/products/category/:categoryId', productController.getProductsByCategoryId);

router.get('/products/category/:categoryId/subcategory/:subcategoryId', productController.getProductsByCategoryAndSubcategoryId);


module.exports = router;
