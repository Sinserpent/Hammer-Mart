import cloudinary from '../cloudinary/cloudinary.setup.js';
import streamifier from 'streamifier';

export const streamUploadService = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'hammer_mart', resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(new Error('Upload failed'));
          }
          return resolve(result);
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    } catch (err) {
      console.error('Unexpected Stream Error:', err);
      return reject(new Error('Unexpected stream failure'));
    }
  });
};
