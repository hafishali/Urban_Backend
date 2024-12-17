const express = require('express');
const router = express.Router();
const multer = require('../../../Middlewares/multerMiddleware');
const ProfileController = require('../../../Controllers/Admin/Profile/ProfileController')
const jwtVerify=require('../../../Middlewares/jwtMiddleware')




// get admin profile
router.get('/view',jwtVerify(['admin']), ProfileController.getAdminProfile)



module.exports = router;