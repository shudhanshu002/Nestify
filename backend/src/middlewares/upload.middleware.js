import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- KEEP THIS EXACTLY AS IT IS FOR PROPERTIES ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'property_listings',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 750, crop: 'limit' }]
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});
// --------------------------------------------------


// --- ADD THIS NEW SECTION FOR KYC ---
const kycStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_kyc_vault', // Different folder for security
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  },
});

export const uploadKYC = multer({ 
  storage: kycStorage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});