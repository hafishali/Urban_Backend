const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, "User ID is required"] 
  },
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Products', 
        required: [true, "Product ID is required"] 
      },
      quantity: { 
        type: Number, 
        required: [true, "Quantity is required"], 
        min: [1, "Quantity cannot be less than 1"] 
      },
      price: { 
        type: Number, 
        required: [true, "Price is required"] 
      },
      color: { 
        type: String, 
        required: [true, "Color is required"] 
      },
      size: { 
        type: String, 
        required: [true, "Size is required"] 
      }
    }
  ],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  totalPrice: { 
    type: Number, 
    default: 0 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});




// Method to apply a coupon and reduce totalPrice
cartSchema.methods.applyCoupon = async function (coupon) {
  if (!coupon) {
    throw new Error('Coupon is required to apply a discount.');
  }

  const currentDate = new Date();

  // Check if the coupon is valid
  if (coupon.status !== 'active' || currentDate < coupon.startDate || currentDate > coupon.endDate) {
    throw new Error('Invalid or expired coupon.');
  }

  // Apply discount to totalPrice
  if (coupon.discountType === 'percentage') {
    this.totalPrice -= (this.totalPrice * coupon.discountValue) / 100;
  } else if (coupon.discountType === 'amount') {
    this.totalPrice -= coupon.discountValue;
  }

  // Ensure totalPrice is not less than 0
  if (this.totalPrice < 0) {
    this.totalPrice = 0;
  }

  // Mark the coupon as applied
  this.coupon = coupon._id;

  return this.totalPrice;
};

// Pre-save hook to calculate total price
cartSchema.pre('save', function (next) {
   // Recalculate total price only if items are modified
   if (this.isModified('items')) {
    this.totalPrice = this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }
  next();
});


module.exports = mongoose.model('Cart', cartSchema);
