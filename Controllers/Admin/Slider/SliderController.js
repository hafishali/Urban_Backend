const Slider = require('../../../Models/Admin/SliderModel')
const fs = require('fs');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');


const s3 = new S3Client({
    region: process.env.AWS_REGION, // Specify your region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use your AWS access key
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Use your AWS secret key
    },
});


// create new slider
exports.createSlider = async (req, res) => {
    const { title, link, category, label } = req.body;

    if (!req.fileUrl) {
        return res.status(400).json({ message: "Please upload a image" });
    }

    try {
        const slider = new Slider({
            title,
            link,
            category,
            label,
            image: req.fileUrl,
        });
        await slider.save();
        res.status(201).json({ message: "Slider created successfully", slider });
    } catch (err) {
        res.status(500).json({ message: 'Error creating slider', error: err.message })
    }
}

// get all sliders
exports.getAllSliders = async (req, res) => {
    try {
        const sliders = await Slider.find().sort({createdAt:-1})
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sliders', error: err.message })
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
        if (req.fileUrl) {
            const oldImageUrl = slider.image;
            const oldFileName = oldImageUrl ? oldImageUrl.split('/').pop() : null;
            slider.image = req.fileUrl;
            if (oldFileName) {
                const oldImageKey = `sliders/${oldFileName}`;
                const deleteParams = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: oldImageKey,
                };

                try {
                    const deleteCommand = new DeleteObjectCommand(deleteParams);
                    await s3.send(deleteCommand);
                    console.log(`Old image deleted from S3: ${oldImageKey}`);
                } catch (err) {
                    console.error(`Error deleting old image from S3: ${err.message}`);
                }
            }
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

        if (!slider) {
            return res.status(404).json({ message: "Slider not found" });
        }

        const imageUrl = slider.image;
        const fileName = imageUrl.split('/').pop();
        const imageKey = `sliders/${fileName}`;
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: imageKey,
        };

        console.log("Params:", params);

        // Send the delete command to S3
        const deleteCommand = new DeleteObjectCommand(params);
        const response = await s3.send(deleteCommand);

        console.log("Delete Response:", response); // Debugging: Log response from S3
        await slider.deleteOne();
        res.status(200).json({ message: 'Slider deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting slider', error: err.message })
    }
}

// search slider
exports.searchSlider = async (req, res) => {
    const { name } = req.query;

    try {
        const query = {};

        if (name) {
            query.$or = [
                { title: { $regex: name, $options: 'i' } },

            ];
        }

        const sliderData = await Slider.find(query).populate('category');

        
        

        res.status(200).json(sliderData);
    } catch (err) {
        res.status(500).json({ message: 'Error searching sliders', error: err.message });
    }
};
