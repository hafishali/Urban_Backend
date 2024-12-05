const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    image:{
        type:String,
        required:true,
    },
    link: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(v);
            },
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    }
},{ timestamps: true});

const Slider = mongoose.model('Slider', sliderSchema);

module.exports = Slider;