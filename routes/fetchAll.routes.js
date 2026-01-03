// routes/fetchAll.routes.js
import express from "express";
import { fetchAllItems, getProductByType } from "../controllers/fetchAll.controller.js";

const router = express.Router();

router.get("/", fetchAllItems);
router.get("/details/:type/:id", getProductByType);

export default router;
