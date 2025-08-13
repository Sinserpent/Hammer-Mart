import express from 'express';
import multer from 'multer';
import { uploadToCloudinaryController } from '../controllers/cloudinary.controller.js';
import { createAuctionController, getAllAuctions } from '../controllers/auction.controller.js';

const router = express.Router();

const storage = multer.memoryStorage(); // important: use memoryStorage
const upload = multer({ storage });

router.post('/create', upload.single('image'), uploadToCloudinaryController, createAuctionController);
router.get('/getAllAuctions', getAllAuctions)

export default router;
