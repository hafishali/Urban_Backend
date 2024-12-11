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

// Pre-save hook to calculate total price
cartSchema.pre('save', function (next) {
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
