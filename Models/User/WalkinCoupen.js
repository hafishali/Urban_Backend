const mongoose = require('mongoose');

const walkinCoupenSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    isExpired: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
}, {
    timestamps: true
});

// TTL index to delete expired coupons (5 hours)
walkinCoupenSchema.statics.expireCoupons = async function () {
    const expirationTime = new Date(Date.now() - 5 * 60 * 60 * 1000);
    await this.updateMany({ createdAt: { $lte: expirationTime } }, { isExpired: true });
};

module.exports = mongoose.model('walkinCoupen', walkinCoupenSchema);
