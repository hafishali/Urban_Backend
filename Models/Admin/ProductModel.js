const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: [true, "Product title is required"] },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, "Product category is required"] },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: [true, "Product subcategory is required"] },
  actualPrice: { type: Number, required: [true, "Actual price is required"] },
  discount: { type: Number, default: 0 },
  offerPrice: { type: Number, required: [true, "Offer price is required"] },
  description: { type: String, required: [true, "Product description is required"] },
  images: [{ type: String, required: [true, "At least one product image is required"] }], 
  manufacturerName: { type: String, required: [true, "Manufacturer name is required"] },
  manufacturerBrand: { type: String, required: [true, "Manufacturer brand is required"] },
  manufacturerAddress: { type: String, required: [true, "Manufacturer brand is required"] },
  colors: [{ type: String, required: [true, "At least one color is required"] }], 
  sizes: [{ type: String, required: [true, "At least one size is required"] }], 
  stock: { type: Number, required: [true, "Stock is required"] },
  orderCount: { type: Number, default:0 },
  isLatestProduct: { type: Boolean, default: false }, 
  isOfferProduct: { type: Boolean, default: false }, 
  isFeaturedProduct: { type: Boolean, default: false },
  features: {
   netWeight: { type: String, default: null }, 
   fit: { type: String, default: null },       
   sleevesType: { type: String, default: null }, 
   Length: { type: String, default: null }, 
   occasion: { type: String, default: null }, 
   innerLining: { type: String, default: null }, 
 }
});

module.exports = mongoose.model('Products', productSchema);