const multer = require('multer')
const path = require('path')
const fs = require('fs');

const uploadDirectory = './uploads/category'; // Categories subdirectory for better organization
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req,file,callback)=>{
        callback(null, uploadDirectory)
    },
    filename:(req, file, callback)=>{
        const filename = `image-${Date.now()}-${file.originalname}`
        callback(null, filename)
    }
})

const fileFilter = (req,file,callback)=>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        callback(null,true)
    }else{
        callback(null,false)
        return callback(new Error("please upload following formats [jpeg/png/jpg] only..."))
    }
}

const multerConfig = multer({
    storage,fileFilter
})

module.exports = multerConfig