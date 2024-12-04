const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({ 
    email:{
        type:String,
        required:[true, "Email is required"],
        unique:true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please enter a valid email address"
        ], // Regular expression for email validation
    },
    username:{
        type:String,
        required:[true, "Username is required"],
        unique:true
    },
    password:{
        type:String, 
        required:[true, "Password is required"],
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'], // Specify possible roles
        default: 'admin', // Default role is 'admin'
    }

})

 const admin = mongoose.model('admin',adminSchema)

 module.exports= admin
