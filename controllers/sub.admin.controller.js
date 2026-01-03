import mongoose from "mongoose";
import productDS from "../models/dropship.model.js";
import product from "../models/product.model.js";
import b2bproduct from "../models/b2b.model.js"
import UserModel from "../models/user.model.js";
import auctionOrders from "../models/auction.order.js";
import jwt from 'jsonwebtoken';
import BusinessInquiry from '../models/BusinessInquiry.js';
import AuctionInquiry from '../models/AuctionInquiry.js';
import SaleWithUsInquiry from '../models/SalewithusInquiry.js';
import nodemailer from 'nodemailer';
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import {
  getAllB2BProducts,
  getB2BProductById,
  createB2BProduct,
  updateB2BProduct,
  deleteB2BProduct,
  getProducts
} from '../controllers/b2b.controller.js';


// B2B Admin Routes

// Get all verified B2B users
// For Create we connnect to already existing b2b controller

export const getVerifiedUsers = async (req, res) => {
  try {
    const b2bmembers = await UserModel.find({ b2bVerified: true });
    return res.json({ b2bmembers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


/////////////////////

//Auction Admin Routes
export const getAllAuctionOrders = async (req, res) => {
  try {
    const orders = await auctionOrders
      .find({})
      .populate("auctionId"); // this pulls in the full auction doc (yes auctionid WOrks like this)

    return res.json( orders );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


/////////////////////

//SWU Admin Routes

export const exportProducts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const [dropshipProducts, normalProducts, b2bproducts] = await Promise.all([
      productDS.find({ sellerId: id }),
      product.find({ sellerId: id }),
      b2bproduct.find({ sellerId: id }),
    ]);

    return res.json({
      sellerId: id,
      products: {
        dropship: dropshipProducts.reverse(),
        products: normalProducts.reverse(),
        b2bproduct: b2bproducts.reverse(),
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//Inquiry Routes
export const getAllInquiries = async (req, res) => {
  const { role } = req.user; // assuming role is attached by auth middleware

  try {
    let businessInquiries = [];
    let auctionInquiries = [];
    let saleWithUsInquiries = [];

    if (role === "superadmin") {
      // fetch all using Promise.all for max speed
      [businessInquiries, auctionInquiries, saleWithUsInquiries] = await Promise.all([
        BusinessInquiry.find({}),
        AuctionInquiry.find({}),
        SaleWithUsInquiry.find({})
      ]);
    } else if (role === "b2badmin") {
      businessInquiries = await BusinessInquiry.find({});
    } else if (role === "auctionadmin") {
      auctionInquiries = await AuctionInquiry.find({});
    } else if (role === "swuadmin") {
      saleWithUsInquiries = await SaleWithUsInquiry.find({});
    } else {
      return res.status(403).json({
        success: false,
        message: "Invalid role"
      });
    }

    const inquiries = [
      { type: "business", data: businessInquiries },
      { type: "auction", data: auctionInquiries },
      { type: "saleWithUs", data: saleWithUsInquiries }
    ];

    res.status(200).json({ success: true, inquiries });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: err.message
    });
  }
};


export const getInquiriesById = async (req, res) => {
  try {
    const token = req.cookies.user_token || req.cookies.admin_token;
    if (!token)
      return res.status(401).json({ message: 'No token found in cookies' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const inquiries = await BusinessInquiry.find({ sellerId: decoded.id });

    res.status(200).json(inquiries);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inquiries', error: err.message });
  }
};
 





export const fetchAllInquiries = async () => {
  try {
    const [business, auction, sale] = await Promise.all([
      fetchBusinessInquiries(),
      fetchAuctionInquiries(),
      fetchSaleWithUsInquiries()
    ]);

    return [
      { type: "business", data: business },
      { type: "auction", data: auction },
      { type: "saleWithUs", data: sale }
    ];
  } catch (err) {
    throw new Error(`Fetching all inquiries failed: ${err.message}`);
  }
};
