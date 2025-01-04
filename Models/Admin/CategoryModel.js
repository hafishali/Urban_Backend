const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: true, 
        index: true 
    },
    image: {
        type: String, 
        required: true,
    },
    isActive:{
        type:Boolean,
        default:true
    },
    description: {
        type: String,
        },
},{ timestamps: true });

const category = mongoose.model('Category', categorySchema);
module.exports = category