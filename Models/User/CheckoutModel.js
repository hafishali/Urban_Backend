const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cartId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cart', 
    required: true 
  },
  cartItems: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Products', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    color: { 
      type: String, 
      required: true 
    },
    size: { 
      type: String, 
      required: true
    },
  }],
  addressId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Address', 
    required: true 
  },
  totalPrice: { 
    type: Number, 
    required: true 
  },
  discountedPrice:{
    type: Number,
  },
  coupen:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  coupenAmount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

const Checkout = mongoose.model('Checkout', checkoutSchema);

module.exports = Checkout;
