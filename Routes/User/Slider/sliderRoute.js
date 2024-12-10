const express = require('express');
const router = express.Router();
const SliderController = require('../../../Controllers/User/Slider/sliderController')


router.get('/view-sliders', SliderController.getAllSliders)


module.exports = router;