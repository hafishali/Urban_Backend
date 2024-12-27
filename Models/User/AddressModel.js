const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  number: {
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      }, 
      message: props => `${props.value} is not a valid phone number!`,
    },
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  landmark: {
    type: String,
    default: null,
  },
  pincode: {
   type: Number,
   required: [true, "Pincode is required"],
  },
  city: {
    type: String,
    required: [true, "City is required"],
  },
  state: {
    type: String,
    required: [true, "State is required"],
  },
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    required: [true, "Address type is required"],
  },
  defaultAddress:{
    type:Boolean,
    default:false
  }
});

module.exports = mongoose.model('Address', addressSchema);
