import express from 'express';
import {
  getAllB2BProducts,
  getB2BProductById,
  createB2BProduct,
  updateB2BProduct,
  deleteB2BProduct,
  getProducts
} from '../controllers/b2b.controller.js';
import { uploadToCloudinaryController } from '../controllers/cloudinary.controller.js';
import { upload } from '../middleware/multer.config.js';
import { createB2BOrder } from '../controllers/payment.controller.js';
import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Get all products
router.get('/b2b-status', async (req, res) => {
    try {
        const token = req.cookies.user_token;
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await userModel.findById(userId).select('b2bVerified');
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({ b2bVerified: user.b2bVerified });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/', getAllB2BProducts);

// Get a single product by ID
router.get('/products', getProducts)

// Create a new product
router.post('/createb2border', createB2BOrder)
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 } // if B2B needs video too
  ]),
  uploadToCloudinaryController,
  createB2BProduct
);

// Update a product
router.get('/:id', getB2BProductById);
router.put(
  '/:id',
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 }
  ]),
  uploadToCloudinaryController, // sets req.uploadedImages and req.uploadedVideo
  updateB2BProduct
);
router.delete('/:id', deleteB2BProduct);


// Delete a product


export default router;