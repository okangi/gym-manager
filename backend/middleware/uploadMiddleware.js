const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage with error handling
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gym-manager',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer upload instance with error handling
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Profile picture upload (single file)
const uploadProfilePicture = (req, res, next) => {
  const singleUpload = upload.single('profilePicture');
  
  singleUpload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Max size 5MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Multiple images upload
const uploadMultipleImages = upload.array('images', 5);

// Class image upload
const uploadClassImage = upload.single('classImage');

module.exports = { uploadProfilePicture, uploadMultipleImages, uploadClassImage, upload };