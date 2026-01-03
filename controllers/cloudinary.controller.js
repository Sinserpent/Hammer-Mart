import { streamUploadService } from '../utils/cdnService.js';
import axios from 'axios';

/**
 * Handles upload to Cloudinary and normalizes req.body
 */
export const uploadToCloudinaryController = async (req, res, next) => {
  try {
    const uploadedImages = [];
    let uploadedVideo = null;

    if (
      (!req.files || (Array.isArray(req.files) && req.files.length === 0)) &&
      !req.body?.imageUrls
    ) {
      return next();
    }

    // Normalize multer files (works for .array() and .fields())
    const allFiles = [];
    if (Array.isArray(req.files)) {
      allFiles.push(...req.files);
    } else if (req.files && typeof req.files === 'object') {
      Object.values(req.files).forEach(fileArr => allFiles.push(...fileArr));
    }

    // Upload all files and split
    for (const file of allFiles) {
      const result = await streamUploadService(file.buffer);
      if (file.mimetype.startsWith('image/')) {
        uploadedImages.push(result.secure_url);
      } else if (file.mimetype.startsWith('video/') && !uploadedVideo) {
        uploadedVideo = result.secure_url; // only take the first video
      }
    }

    // Handle image URLs from body (optional)
    if (req.body?.imageUrls && Array.isArray(req.body.imageUrls)) {
      for (const url of req.body.imageUrls) {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const result = await streamUploadService(buffer);
        uploadedImages.push(result.secure_url);
      }
    }

    // Parse JSON payload if packed into `data`
    let parsedData = {};
    if (req.body?.data) {
      try {
        parsedData = JSON.parse(req.body.data);
      } catch (e) {
        e.status = 400;
        e.message = 'Invalid JSON in data field';
        return next(e);
      }
    }

    // Set uploaded files in separate fields to avoid conflicts
    req.uploadedImages = uploadedImages.length > 0 ? uploadedImages : undefined;
    req.uploadedVideo = uploadedVideo;

    // Merge parsed data into body (but don't overwrite images field)
    req.body = {
      ...req.body,
      ...parsedData,
      // Don't overwrite existing images field if it exists
      ...(uploadedImages.length > 0 && !req.body.images ? { images: uploadedImages } : {}),
      ...(uploadedVideo && !req.body.video ? { video: uploadedVideo } : {})
    };


    return next();
  } catch (err) {
    return next(err);
  }
};  