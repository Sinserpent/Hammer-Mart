import express from 'express';
import { linkProcessing  } from '../controllers/star.controller.js';

const router = express.Router();

router.post('/process-link', linkProcessing);




export default router;
