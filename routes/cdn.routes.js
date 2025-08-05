import express from 'express';
import multer from 'multer';
import { uploadToCloudinaryController } from '../controllers/cloudinaryController.js';
import { createProductController } from '../controllers/createProductController.js';

const router = express.Router();

const storage = multer.memoryStorage(); // important: use memoryStorage
const upload = multer({ storage });

router.post('/', upload.single('image'), uploadToCloudinaryController, createProductController);

export default router;
