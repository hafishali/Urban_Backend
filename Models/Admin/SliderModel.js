const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    image:{
        type:String,
        
    },
    link: {
        type: String,
        
        validate: {
            validator: function (v) {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(v);
            },
        },
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Reference to Category model
          // If sliders must have a category
    },
    label: {
        type: String,
         // Ensure label is always present
    },
    isActive: {
        type: Boolean,
        default: true,
    }
},{ timestamps: true});

const Slider = mongoose.model('Slider', sliderSchema);

module.exports = Slider;