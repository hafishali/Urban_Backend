const mongoose=require('mongoose')

const SubCategorySchema=new mongoose.Schema({
    title:{type:String,required:true},
    category:{type:mongoose.Schema.Types.ObjectId,ref:'Category',required:true},
    isActive:{
        type:Boolean,
        default:true
    },
    image:{type:String,required:true}
})

module.exports=mongoose.model('SubCategory',SubCategorySchema)