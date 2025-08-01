import express from 'express'
import { fetchData } from '../controllers/dataController';
 
const router = express.Router();

 router.post('/', fetchData);

export default router