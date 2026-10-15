const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

module.exports = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'internship-lms/submissions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'zip', 'doc', 'docx', 'mp4', 'webm', 'mov'],
    resource_type: 'auto'
  }
});
