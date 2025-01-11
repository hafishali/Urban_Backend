const express = require('express');
const router = express.Router();
const multerMiddleware =require('../../../Middlewares/multerMiddleware')
const SliderController = require('../../../Controllers/Admin/Slider/SliderController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


// create a new slider
router.post('/create', jwtVerify(['admin']),multerMiddleware.upload.single('image'), multerMiddleware.uploadToS3Middleware, SliderController.createSlider);

// get all sliders
router.get('/', SliderController.getAllSliders)

// update slider
router.patch('/:id', jwtVerify(['admin']),multerMiddleware.upload.single('image'), multerMiddleware.uploadToS3Middleware, SliderController.updateSlider);

// delete slider
router.delete('/:id', jwtVerify(['admin']), SliderController.deleteSlider);

// search slider
router.get('/search',jwtVerify(['admin']), SliderController.searchSlider)

module.exports = router;