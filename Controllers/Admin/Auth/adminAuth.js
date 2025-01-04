const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const admin = require("../../../Models/Admin/AdminModel");


// // admin register

exports.register= async(req,res)=>{
    const {email,username,password,role}=req.body
    // console.log('inside register user controller ');
    try {
        const existingAdmin = await admin.findOne({email})
    if(existingAdmin){
        res.status(406).json("admin already exist! please login..")
    }else{
        const hashedPassword =await bcrypt.hash(password, saltRounds)
        const newAdmin = admin({
            email,username,password:hashedPassword,role: role || 'admin',
        })
        
        await newAdmin.save()
    

        // Generate JWT token
        const token = jwt.sign({ id: newAdmin._id, role: newAdmin.role }, process.env.JWT_SECRET, { expiresIn: '1w' });

        const responseAdmin = { email: newAdmin.email, username: newAdmin.username, role: newAdmin.role }; // Assuming role exists in schema
        return res.status(201).json({
            message: "Admin registered successfully.",
            admin: responseAdmin,
            token: token
        });
    }
    } catch (err) {
        return res.status(500).json({ error: err.message });
 
    }
}

// admin login

exports.login = async(req,res)=>{
    const {email,password}=req.body
    try {
        const existingAdmin = await admin.findOne({email})
        if(!existingAdmin){
            return res.status(401).json({message:"Invalid email or password"})
        }
        const isPasswordValid = await bcrypt.compare(password,existingAdmin.password)
        if(!isPasswordValid) {
            return res.status(401).json({message:"Invalid email or password"})
        }
        // generate token
        const token = jwt.sign(
            { adminId: existingAdmin._id, role: existingAdmin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1w' } 
        );
        const responseAdmin = { email: existingAdmin.email, username: existingAdmin.username, role: existingAdmin.role }; // Assuming role exists in schema
        return res.status(200).json({
            message: "Admin Logined successfully.",
            admin: responseAdmin,
            token: token
        });
        
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}