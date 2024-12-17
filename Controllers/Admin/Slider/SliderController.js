const Slider = require('../../../Models/Admin/SliderModel')
const fs = require('fs');

// create new slider
exports.createSlider = async (req, res) => {
    const { title, link, category, label } = req.body;

    if(!req.file) {
        return res.status(400).json({ message: "Please upload a image" });
    }

    try {
        const slider = new Slider({
            title,
            link,
            category,
            label,
            image: req.file.filename,
            });
            await slider.save();
            res.status(201).json({ message: "Slider created successfully", slider });
    } catch (err) {
        res.status(500).json({ message: 'Error creating slider', error: err.message})
    }
}

// get all sliders
exports.getAllSliders = async (req, res) => {
    try {
        const sliders = await Slider.find();
        res.status(200).json(sliders);
} catch (err) {
    res.status(500).json({ message: 'Error fetching sliders', error: err.message})
}
}

// update a slider
exports.updateSlider = async (req, res) => {
    const { id } = req.params;
  
    const { title, link, category, label, isActive } = req.body;

    try {
        const slider = await Slider.findById(id);
        if (!slider) {
            return res.status(404).json({ message: "Slider not found" });
        }

        // Update title and link if provided
        slider.title = title || slider.title;
        slider.link = link || slider.link;
        slider.category = category || slider.category;
        slider.label = label || slider.label;
        slider.isActive = isActive !== undefined ? isActive : slider.isActive;

        

        // Update image if a new one is uploaded
        if (req.file) {
            const oldImagePath = `./uploads/category/${slider.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            slider.image = req.file.filename;
        }

        await slider.save();

        res.status(200).json({ message: 'Slider updated successfully', slider });
    } catch (err) {
        res.status(500).json({ message: 'Error updating slider', error: err.message });
    }
};

// delete a slider

exports.deleteSlider = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await Slider.findById(id);

        if(!slider) {
            return res.status(404).json({ message: "Slider not found" });
        }

        const imagePath = `./uploads/category/${slider.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        await slider.deleteOne();
        res.status(200).json({ message: 'Slider deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting slider', error: err.message})
    }
}