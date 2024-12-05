const express = require('express');
const router = express.Router();
const multer = require('../../../Middlewares/multerMiddleware');
const SliderController = require('../../../Controllers/Admin/Slider/SliderController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')


// create a new slider
router.post('/create', jwtVerify, multer.single('image'), SliderController.createSlider);

// get all sliders
router.get('/', SliderController.getAllSliders)

// update slider
router.patch('/:id', jwtVerify, multer.single('image'), SliderController.updateSlider);

// delete slider
router.delete('/:id', jwtVerify, SliderController.deleteSlider);

module.exports = router;