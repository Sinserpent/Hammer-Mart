import { streamUploadService } from '../services/cdnService.js';

export const uploadToCloudinaryController = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No file uploaded' });

    // Upload image
    const result = await streamUploadService(req.file.buffer);

    // Parse the JSON data from string (assumes it's sent under 'data' key)//////////////////IMP
    let parsedData;
    try {
      parsedData = JSON.parse(req.body.data); // <-- match this key in Postman
    } catch (err) {
      return res.status(400).json({ error: 'Invalid JSON string' });
    }

    const originalBody = JSON.parse(req.body.data)


    parsedData.image = result.secure_url;
    req.body = parsedData;

    next();

  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
};
