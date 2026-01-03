// routes/auction.routes.js
import express from "express";
import { Auction } from "../models/auction.model.js";
import User from "../models/user.model.js";
import { createAuctionOrder } from "../controllers/auction.order.controller.js";

const router = express.Router();


router.post("/createAuctionOrder/:id", createAuctionOrder);
router.get("/:auctionId", async (req, res) => {
  try {
    const { auctionId } = req.params;

    // find auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    // find winner user
    const winner = await User.findById(auction.winnerId);
    if (!winner) {
      return res.status(404).json({ error: "Winner not found" });
    }

    // normalize winner data
    const normalizedWinner =
      winner.role === "seller"
        ? {
            email: winner.businessEmail,
            fullName: winner.fullName,
            role: winner.role,
          }
        : {
            email: winner.email,
            fullName: winner.fullName,
            role: winner.role,
          };

    return res.json({
      auction,
      winner: normalizedWinner,
    });
  } catch (err) {
    console.error("Error fetching auction:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
