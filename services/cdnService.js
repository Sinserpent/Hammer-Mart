import cloudinary from '../cloudinary/cloudinary.setup.js';
import streamifier from 'streamifier';

export const streamUploadService = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'hammer_mart' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
