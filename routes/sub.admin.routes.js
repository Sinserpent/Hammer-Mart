import express from 'express';
import { getVerifiedUsers, getAllAuctionOrders } from "../controllers/sub.admin.controller.js";

const router = express.Router();

// B2B Admin Routes

// Get all verified B2B users
router.get('/verified-users', getVerifiedUsers);
//router.get('/business-inquiries', fetchBusinessInquiries);


// Auction Admin Routes
router.get('/auction-orders', getAllAuctionOrders);




export default router;

/////////////////////


//export const getInquiriesById = async (req, res) => {
//  try {
//    const token = req.cookies.user_token || req.cookies.admin_token;
//    if (!token)
//      return res.status(401).json({ message: 'No token found in cookies' });

//    const decoded = jwt.verify(token, process.env.JWT_SECRET);
//    const inquiries = await BusinessInquiry.find({ sellerId: decoded.id });

//    res.status(200).json(inquiries);
//  } catch (err) {
//    res.status(500).json({ message: 'Failed to fetch inquiries', error: err.message });
//  }
//};
 

