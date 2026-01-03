import express from 'express';
import { uploadToCloudinaryController } from '../controllers/cloudinary.controller.js';
import { createProductController, deleteProduct, getAllProducts, getProducts, updateProduct } from '../controllers/product.controller.js';
import { upload } from '../middleware/multer.config.js';


const router = express.Router();

// Accept multiple images (files) and/or multiple URLs
router.get('/fetch', getProducts)
router.get('/fetchAll', getAllProducts)
router.post('/',upload.array('images', 10), uploadToCloudinaryController, createProductController); //tested
router.put(
  '/:id',
  upload.array('images', 10),       // parse files
  uploadToCloudinaryController,     // upload them (if needed)
  updateProduct                     // then handle update
);
router.delete('/:id', deleteProduct)



export default router;
