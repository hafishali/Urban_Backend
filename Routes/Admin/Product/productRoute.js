const express = require('express');
const router = express.Router();
const productController = require('../../../Controllers/Admin/Product/productController')
const jwtVerify = require('../../../Middlewares/jwtMiddleware')
const multer=require('../../../Middlewares/multerMiddleware')

const upload = multer.array("images",5)

// Add a new product
router.post('/create-product',jwtVerify(['admin']),upload, productController.addProduct );

// Get all products
router.get('/view-products',jwtVerify(['admin']), productController.getAllProducts);

// Get a single product by ID
router.get('/products/:id', productController.getProductById);

// Update a product
router.patch('/products/:id',jwtVerify(['admin']),upload, productController.updateProduct);

// Delete a product
router.delete('/products/:id',jwtVerify(['admin']), productController.deleteProduct);

module.exports = router;
