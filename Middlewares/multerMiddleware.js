const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirectory = './uploads/category'; 
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },
    filename: (req, file, callback) => {
        const filename = `image-${Date.now()}-${file.originalname}`;
        callback(null, filename);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        callback(null, true);
    } else {
        callback(null, false);
        return callback(new Error("Please upload images in the following formats: JPEG, PNG, JPG."));
    }
};

const multerConfig = multer({
    storage,
    fileFilter,
    limits: { 
        fileSize: 3 * 1024 * 1024, 
        files: 5 
    }
});

module.exports = multerConfig;
