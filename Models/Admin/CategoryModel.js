const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: true, 
        index: true // enables faster queries
    },
    image: {
        type: String, 
        required: true,
    },
    description: {
        type: String,
        },
    
});

const category = mongoose.model('Category', categorySchema);
module.exports = category