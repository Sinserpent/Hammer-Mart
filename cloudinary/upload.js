//import fs from 'fs';
//import { streamUploadService } from '../utils/cdnService.js';

//export const uploadToCloudinaryController = async (req, res, next) => {
//  try {
//    const uploadedImageUrls = [];
//    let uploadedVideoUrl = null;
 
//    // Handle multiple images (from req.files.images)
//    if (req.files?.images && req.files.images.length > 0) {
//      for (const file of req.files.images) {
//        const buffer = file.buffer || fs.readFileSync(file.path); // supports memory or disk storage
//        const result = await streamUploadService(buffer);
//        uploadedImageUrls.push(result.secure_url);

//        if (file.path) fs.unlinkSync(file.path); // cleanup temp file if disk used
//      }
//    }

//    // Handle single video (from req.files.video)
//    if (req.files?.video && req.files.video.length > 0) {
//      const videoFile = req.files.video[0];
//      const buffer = videoFile.buffer || fs.readFileSync(videoFile.path);
//      const videoResult = await streamUploadService(buffer);
//      uploadedVideoUrl = videoResult.secure_url;

//      if (videoFile.path) fs.unlinkSync(videoFile.path); // cleanup temp file if disk used
//    }

//    // Parse extra dynamic fields
//    let extraFields = [];
//    if (req.body.extraFields) {
//      try {
//        extraFields = JSON.parse(req.body.extraFields);
//      } catch (err) {
//        return res.status(400).json({ success: false, message: 'Invalid JSON in extraFields' });
//      }
//    }

//    // Convert array of key/value into object
//    const extraSpecs = {};
//    for (const pair of extraFields) {
//      if (pair.key && pair.value) {
//        extraSpecs[pair.key] = pair.value;
//      }
//    }

//    // Merge processed data back into req.body
//    req.body = {
//      ...req.body,
//      images: uploadedImageUrls,
//      video: uploadedVideoUrl,
//      description: {
//        ...(req.body.description ? JSON.parse(req.body.description) : {}),
//        technicalSpecs: {
//          ...(req.body.description?.technicalSpecs || {}),
//          otherSpecs: extraSpecs,
//        },
//      },
//    };

//    next();
//  } catch (err) {
//    console.error(err);
//    return res.status(500).json({ success: false, message: 'Image/video upload failed', error: err.message });
//  }
//};
