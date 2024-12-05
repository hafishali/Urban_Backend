const mongoose = require('mongoose');
const category = require('./CategoryModel');

const couponSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'amount'],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                if(this.discountType === 'percentage'){
                    return value >= 0 && value <= 100;
                }
                return true;
            },
            message: 'For percentage, Discount value must be between 0 and 100',
        }
    },
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active',
    }

});

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon