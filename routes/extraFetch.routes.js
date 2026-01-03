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
import { log } from "console";


export const getDiscountedProducts = async (req, res, next) => {
  try {
    const discounted = await productDS.aggregate([
      {
        $match: {
          $expr: { $lt: ["$price", "$original_price"] }
        }
      },
      {
        $addFields: {
          difference: { $subtract: ["$original_price", "$price"] }
        }
      },
      {
        $sort: { difference: -1 }
      }
    ]);

    res.status(200).json(discounted);
  } catch (err) {
    next(err);
  }
};

export const exportUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    let user = await Admin.findById(id);
    if (!user) {
      user = await User.findById(id);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


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




export const getVerifiedUsers = async (req, res) => {
  try {
    const b2bmembers = await UserModel.find({ b2bVerified: true });
    return res.json({ b2bmembers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



export const getAllAuctionOrders = async (req, res) => {
  try {
    const orders = await auctionOrders
      .find({})
      .populate("auctionId"); // this pulls in the full auction doc

    return res.json( orders );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


//export const getAllInquiries = async (req, res) => {
//  try {
//    const [businessInquiries, auctionInquiries, saleWithUsInquiries] = await Promise.all([
//      BusinessInquiry.find({}),
//      AuctionInquiry.find({}),
//      SaleWithUsInquiry.find({})
//    ]);

//    const inquiries = [
//      { type: 'business', data: businessInquiries },
//      { type: 'auction', data: auctionInquiries },
//      { type: 'saleWithUs', data: saleWithUsInquiries }
//    ];

//    res.status(200).json({ inquiries });
//  } catch (err) {
//    res.status(500).json({ message: 'Failed to fetch inquiries', error: err.message });
//  }
//};

//export const getAllInquiries = async (req, res) => {
//  const role = req.userRole || req.query.userRole; // assuming role is attached by auth middleware
//  console.log(role);
  
//  try {
//    let businessInquiries = [];
//    let auctionInquiries = [];
//    let saleWithUsInquiries = [];

//    if (role === "superadmin") {
//      // fetch all using Promise.all for max speed
//      [businessInquiries, auctionInquiries, saleWithUsInquiries] = await Promise.all([
//        BusinessInquiry.find({}),
//        AuctionInquiry.find({}),
//        SaleWithUsInquiry.find({})
//      ]);
//    } else if (role === "b2badmin") {
//      businessInquiries = await BusinessInquiry.find({});
//    } else if (role === "auctionadmin") {
//      auctionInquiries = await AuctionInquiry.find({});
//    } else if (role === "swuadmin") {
//      saleWithUsInquiries = await SaleWithUsInquiry.find({});
//    } else {
//      return res.status(403).json({
//        success: false,
//        message: "Invalid role"
//      });
//    }

//    const inquiries = [
//      { type: "business", data: businessInquiries },
//      { type: "auction", data: auctionInquiries },
//      { type: "saleWithUs", data: saleWithUsInquiries }
//    ];

//    res.status(200).json({ success: true, inquiries });
//  } catch (err) {
//    res.status(500).json({
//      success: false,
//      message: "Failed to fetch inquiries",
//      error: err.message
//    });
//  }
//};

export const getAllInquiries = async (req, res) => {
  // Attempt every possible extraction
  const roleSources = {
    bodyUserRole: req.body?.userRole,
  };

  console.log("Role sources:", roleSources);

  // Pick the first one that is defined
  const role = Object.values(roleSources).find(Boolean);

  if (!role) {
    return res.status(403).json({
      success: false,
      message: "Role not provided"
    });
  }

  try {
    let businessInquiries = [];
    let auctionInquiries = [];
    let saleWithUsInquiries = [];

    if (role === "superadmin") {
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
 

export const sellerMessage = async (req, res) => {
  try {
    const { fullName, email, message } = req.body;

    // Validate required fields
    if (!email?.trim() || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and message are required.' 
      });
    }

    // Use fullName or default to 'Anonymous'
    const Name = fullName?.trim() || 'Anonymous';

    const htmlTemplate = `
      <div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
        <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
            
             <!-- Logo -->
                <div style="text-align:left; margin-bottom:20px;">
                  <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
                </div>
                
                 <!-- Heading -->
                <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
                  New Contact
                  <span style="color:#CFA128;">Message</span>
                </h2>
                
                <p style="font-size:16px; color:#fff;">You have received a new contact message from <strong>${Name}</strong>.</p>
                
                 <!-- Heading -->
                <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
                  <span style="color:#CFA128;">Contact Details:</span>
                </h2>
                
                <p style="font-size:16px; color:#fff;"><strong>Name:</strong> ${Name}</p>
                <p style="font-size:16px; color:#fff;"><strong>Email:</strong> ${email}</p>
                
                <!-- Heading -->
                <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
                  <span style="color:#CFA128;">Message:</span>
                </h2>
                
                <p style="font-size:16px; color:#fff; white-space: pre-wrap;">${message}</p>
                
         <!-- Divider -->
                <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
        
                <!-- Footer -->
                <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
                  © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
                </p>
            
        </div>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"${Name}" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: process.env.SMTP_USER,
      subject: `Contact: ${Name}`,
      html: htmlTemplate,
      text: `Name: ${Name}\nEmail: ${email}\nMessage:\n${message}`
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully!' 
    });

  } catch (error) {
    console.error('Seller message error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again.' 
    });
  }
};