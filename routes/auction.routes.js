import express from 'express';
import { uploadToCloudinaryController } from '../controllers/cloudinary.controller.js';
import { createAuctionController, getAllAuctionIds } from '../controllers/auction.controller.js';
import { upload } from '../middleware/multer.config.js';

const router = express.Router();

router.post("/create",upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 }
  ]),
  uploadToCloudinaryController,createAuctionController);

router.get('/getAllAuctions', getAllAuctionIds)

export default router;

