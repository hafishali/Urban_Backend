const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
  cartItems: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  totalPrice: { type: Number, required: true },
  couponCode: { type: String },
  status: { type: String, default: 'Pending' }
});


const Checkout = mongoose.model('Checkout', checkoutSchema);

module.exports = Checkout;
