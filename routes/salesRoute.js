import express from 'express';
import { createSale } from '../controllers/salesController.js';

const router = express.Router();

router.post('/', createSale);

export default router;
