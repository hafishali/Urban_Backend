const Slider = require('../../../Models/Admin/SliderModel')


// get all sliders
exports.getAllSliders = async (req, res) => {
    try {
        const sliders = await Slider.find({ isActive: true })   
        res.status(200).json(sliders);
} catch (err) {
    res.status(500).json({ message: 'Error fetching sliders', error: err.message})
}
}