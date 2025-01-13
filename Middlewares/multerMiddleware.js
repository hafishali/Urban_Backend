const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/s3Config');  // Import AWS S3 configuration

// Configure Multer to store files in memory temporarily
const storage = multer.memoryStorage();

// Multer setup
const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
      callback(null, true);
    } else {
      callback(null, false);
      return callback(new Error("Please upload images in the following formats: JPEG, PNG, JPG."));
    }
  },
  limits: {
    fileSize: 3 * 1024 * 1024,  
    files: 5  
  }
});

// Function to upload file to S3 using AWS SDK v3
const uploadFileToS3 = async (file, folder = 'Products') => {
  const filename = `image-${Date.now()}-${file.originalname}`;
  const filePath = `${folder}/${filename}`;
  console.log(filename)

  const params = {
    Bucket: process.env.BUCKET_NAME,  // Your S3 bucket name
    Key: filePath,  // S3 path where the file will be stored
    Body: file.buffer,  // The file buffer from Multer's memoryStorage
    ContentType: file.mimetype,  // MIME type of the file
    // ACL: 'public-read',  // Set access control to allow public read access
  };

  const client = new S3Client({ region: process.env.AWS_REGION });  // Initialize S3 client with region
  const command = new PutObjectCommand(params);  // Create the S3 put object command
  await client.send(command);  // Execute the command to upload the file to S3

  return `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;  // Return the public URL of the uploaded file
};

// Middleware to handle S3 upload for both single and multiple files
const uploadToS3Middleware = async (req, res, next) => {
  try {
    // Handle single file upload
    if (req.file) {
      req.fileUrl = await uploadFileToS3(req.file, req.body.folder);
    }
    
    // Handle multiple file upload
    if (req.files) {
      req.fileUrls = await Promise.all(
        req.files.map(file => uploadFileToS3(file, req.body.folder))
      );
    }
    
    next();
  } catch (error) {
    console.error("Error uploading to S3:", error);
    res.status(500).json({ error: "Failed to upload file(s) to S3" });
  }
};

module.exports = { upload, uploadToS3Middleware };