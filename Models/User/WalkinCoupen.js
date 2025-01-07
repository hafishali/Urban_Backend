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
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// TTL index to delete expired coupons (5 hours)
walkinCoupenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5 * 60 * 60 });

module.exports = mongoose.model('walkinCoupen', walkinCoupenSchema);
