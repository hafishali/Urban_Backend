const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        match: [
            /^\+?[1-9]\d{1,14}$/,
            "Please enter a valid phone number"
        ],
    },
    password: {
        type: String,
        required: false, // Default to false
        minlength: [6, 'Password must be at least 6 characters long'],
        validate: {
          validator: function (value) {
            // Ensure password is present if googleId is missing
            if (!this.googleId && (!value || value.length < 6)) {
              return false;
            }
            return true;
          },
          message: 'Password is required and must be at least 6 characters long unless Google login is used.',
        },
      },
    email: {
        type: String,
        unique: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please enter a valid email address"
        ],
        default:null,
        require:true
    },
    status: {
        type: Boolean,
        default: true
    },
    googleId: {
        type: String,
        default: null,
    },
    facebookId: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        default: 'user',
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    isWalkIn: { type: Boolean, default: false },
    couponCode: { type: mongoose.Schema.Types.ObjectId, ref: 'walkinCoupen' },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref:'Address' }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
