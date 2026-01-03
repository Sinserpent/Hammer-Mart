import express from "express";
import { uploadToCloudinaryController } from "../controllers/cloudinary.controller.js";
import {
  createAuctionController,
  getAllAuctions,
  updateAuctionController,
  deleteAuctionController,
  getAuctions,
  getAllActiveAuctions,
  getAuctionDistilled
} from "../controllers/auction.controller.js";
import { upload } from "../middleware/multer.config.js";
import { createAuctionPaymentIntent } from "../controllers/payment.controller.js";
import { Auction } from "../models/auction.model.js";

const router = express.Router();

router.post(
  "/create",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  uploadToCloudinaryController,
  createAuctionController
);

router.get("/getAllActiveAuctions", getAllActiveAuctions);
router.get("/getAuctions", getAuctions);
router.get("/getAuctionsDistilled", getAuctionDistilled);
router.get("/getAllAuctions", getAllAuctions);
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    // If category is provided, filter by it; otherwise return all
    const filter = category ? { category } : {};
    const auctions = await Auction.find(filter);
    console.log(auctions);
    
    res.json({ auctions });
  } catch (err) {
    console.error('Failed to fetch auctions:', err);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id);

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    res.status(200).json(auction);
  } catch (err) {
    next(err); // pass to error handler middleware
  }
});

// ✅ Update auction with Cloudinary middleware
router.put(
  "/update/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  uploadToCloudinaryController,
  updateAuctionController
);

// ✅ Delete auction
router.delete("/delete/:id", deleteAuctionController);

router.post("/processpayment", createAuctionPaymentIntent);

export default router;
