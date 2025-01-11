// aws-config.js
const { S3Client } = require('@aws-sdk/client-s3');

// Create and export an S3 client instance using environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION, // Replace with your AWS region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // From IAM user credentials
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // From IAM user credentials
  },
});

module.exports = s3;
