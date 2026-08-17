const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

module.exports = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'internship-lms/submissions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'zip', 'doc', 'docx'],
    resource_type: 'auto'
  }
});
