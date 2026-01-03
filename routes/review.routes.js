import express from "express";
import { addReview, removeReview } from "../controllers/review.controller.js";

const router = express.Router();

// Add review
router.post("/:type/:id", addReview);

// Remove review
router.delete("/:type/:id/:reviewId", removeReview);

export default router;
