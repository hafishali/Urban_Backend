const express = require('express');
const router = express.Router();
const adminController = require('../../../Controllers/Admin/Auth/adminAuth')
const verifyToken = require('../../../Middlewares/jwtMiddleware')

// admin register

router.post('/register',adminController.register)

// admin login

router.post('/login', adminController.login)


// protected route 
router.get('/dash', verifyToken, (req,res) => {
    res.status(200).json({message:'welcome, Admin', user:req.user})
})


module.exports=router