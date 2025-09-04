import express from "express";
import { getProduct } from "../controllers/aliexpress.controller.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const product = await getProduct(req.params.id, req.query.country || 'US');
    res.json(product);  // send the object to Postman
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
