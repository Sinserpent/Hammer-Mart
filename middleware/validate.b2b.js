// middleware/checkB2B.js
import Seller from "../models/seller.model.js";

export const checkB2B = async (req, res, next) => {
  try {
    const { sellerId } = req.body; // or req.user if authenticated

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID required" });
    }

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).json({ error: "Seller not found" });
    }

    if (!seller.b2bApproved) {
      return res.status(403).json({ error: "Account not approved for B2B" });
    }

    next();
  } catch (err) {
    next(err);
  }
};
