import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cloudinary détecte automatiquement CLOUDINARY_URL
// Ou on peut parser manuellement
if (process.env.CLOUDINARY_URL) {
  // Configuration automatique via CLOUDINARY_URL
  cloudinary.config();
} else {
  // Fallback sur variables séparées
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

console.log('Cloudinary configuré:', cloudinary.config().cloud_name);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'fanilo-members',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
  }
});

export const upload = multer({ storage });
export default cloudinary;
