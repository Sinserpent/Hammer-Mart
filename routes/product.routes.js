import express from 'express';
import { uploadToCloudinaryController } from '../controllers/cloudinary.controller.js';
import { createProductController } from '../controllers/product.controller.js';
import { upload } from '../middleware/multer.config.js';
import { createB2BProductController } from '../controllers/b2b.controller.js';
import { checkB2B } from '../middleware/validate.b2b.js';


const router = express.Router();

// Accept multiple images (files) and/or multiple URLs
router.post('/',upload.array('images', 10), uploadToCloudinaryController, createProductController);
router.post('/b2b',upload.array('images', 10), checkB2B ,uploadToCloudinaryController, createB2BProductController);


export default router;
