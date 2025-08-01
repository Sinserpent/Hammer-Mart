import express from 'express';
import { uploadProductExcel } from '../controllers/extractController.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/', upload.single('file'), uploadProductExcel);

export default router;
