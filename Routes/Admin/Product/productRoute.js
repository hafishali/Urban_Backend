const express = require('express');
const router = express.Router();
const productController = require('../../../Controllers/Admin/Product/productController')
const jwtVerify = require('../../../Middlewares/jwtMiddleware')
const multerMiddleware =require('../../../Middlewares/multerMiddleware')

// const upload = multer.array("images",5)

// Add a new product
router.post('/create-product',jwtVerify(['admin']),multerMiddleware.upload.array("images",5), multerMiddleware.uploadToS3Middleware, productController.addProduct );

// Get all products
router.get('/view-products',jwtVerify(['admin']), productController.getAllProducts);

// Get a single product by ID
router.get('/product/:id', productController.getProductById);

// Update a product with image handling
router.patch('/update-product/:id', jwtVerify(['admin']),multerMiddleware.upload.array("images",5), multerMiddleware.uploadToS3Middleware, productController.updateProduct);

// Delete an image 
router.post('/delete-product-image/:id', jwtVerify(['admin']), productController.deleteProductImage);

// Delete a product
router.delete('/delete-product/:id',jwtVerify(['admin']), productController.deleteProduct);

// filter product based on category
router.post('/filter',jwtVerify(['admin']), productController.filterProductsByCategoryId );


module.exports = router;
