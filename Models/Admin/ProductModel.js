const mongoose=require('mongoose')
const category = require('./CategoryModel')

const productSchema=new mongoose.Schema({
   Title:{type:String,require:[true, "Product Title is required"]} ,
   category:{type:mongoose.Schema.Types.ObjectId,ref:'Category',require:[true, "Product Category is required"]},
   subcategory:{type:mongoose.Schema.Types.ObjectId,ref:'SubCategory',require:[true, "Product SubCategory is required"]},
   actual_price:{type:Number,require:[true, "Actual Price is required"]},
   discount:{type:String,default: 0},
   description:{type:String},
   image:{type:String},
   manufacturer_name:{type:String,require:[true, "Manfucturer Name is required"]},
   manufacturer_brand:{type:String,require:[true, "Manfucturer Brand is required"]},
   color:{type:String,require:[true, "Colour is required"]},
   size:{type: [String], required: [true, "Product is required"]},
   stocks:{type:Number, required: [true, "Stock is required"]},

})

module.exports=mongoose.model('Products',productSchema)