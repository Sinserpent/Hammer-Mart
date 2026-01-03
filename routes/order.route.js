import express from 'express';
import { createOrderFromCart } from "../controllers/order.controller.js"
import Order from '../models/order.model.js';
import jwt from 'jsonwebtoken';
import { Auction } from '../models/auction.model.js';
import mongoose from 'mongoose';


//import { sellLimiter } from '../middleware/rate.middleware.js';



const router = express.Router();

router.post('/createOrder', createOrderFromCart)

router.get('/getAll', async (req, res) => {
    try {
        const orders = await Order.find();
        
        return res.json(orders);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/getAll-total', async (req, res) => {
  try {
    const { start, end } = req.query;

    const matchConditions = {};
if (start || end) {
  matchConditions.createdAt = {};
  if (start) matchConditions.createdAt.$gte = new Date(new Date(start).setDate(new Date(start).getDate() - 1));
  if (end) matchConditions.createdAt.$lte = new Date(new Date(end).setDate(new Date(end).getDate() + 1));
}
    const auctions = await Auction.find({ status: "active" });
    const result = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: "$status",
          totalSalePrice: { $sum: "$totalSalePrice" },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Reshape result into clean object
    const summary = {
  paid: { total: 0, count: 0 },
  unpaid: { total: 0, count: 0 },
  activeAuctions: auctions.length
};

    result.forEach(r => {
      if (r._id === "paid") {
        summary.paid.total = r.totalSalePrice;
        summary.paid.count = r.orderCount;
      } else {
        summary.unpaid.total += r.totalSalePrice;
        summary.unpaid.count += r.orderCount;
      }
    });

    return res.json(summary);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});




//router.get('/my-orders', async (req, res) => {
//  try {
//    const token = req.cookies.user_token;
//    if (!token) return res.status(401).json({ message: "Unauthorized" });

//    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
//          issuer: "HammerBidMart",
//        });
//    const sellerId = decoded.id; // This should be the seller's ID from the token

//    const { start, end } = req.query;
    
//    // Add date filtering if provided
//    const matchConditions = {};
//    if (start || end) {
//      matchConditions.createdAt = {};
//      if (start) matchConditions.createdAt.$gte = new Date(new Date(start).setDate(new Date(start).getDate() - 1));
//      if (end) matchConditions.createdAt.$lte = new Date(new Date(end).setDate(new Date(end).getDate() + 1));
//    }

//    const result = await Order.aggregate([
//      { $match: matchConditions },
//      {
//        // Filter items array to only include items from this seller
//        $addFields: {
//          sellerItems: {
//            $filter: {
//              input: "$items",
//              cond: { $eq: ["$$this.sellerId", new mongoose.Types.ObjectId(sellerId)] }
//            }
//          }
//        }
//      },
//      {
//        // Only keep orders that have at least one item from the seller
//        $match: {
//          "sellerItems.0": { $exists: true }
//        }
//      },
//      {
//        // Calculate total price for seller's items in each order
//        $addFields: {
//          sellerItemsTotal: { $sum: "$sellerItems.totalPrice" }
//        }
//      },
//      {
//        // Group by status and aggregate totals
//        $group: {
//          _id: "$status",
//          totalSalePrice: { $sum: "$sellerItemsTotal" },
//          orderCount: { $sum: 1 }, // Now correctly counts unique orders
//          orders: { 
//            $push: {
//              _id: "$_id",
//              status: "$status",
//              createdAt: "$createdAt",
//              customerId: "$customerId",
//              items: "$sellerItems", // Only seller's items
//              sellerTotal: "$sellerItemsTotal"
//            }
//          }
//        }
//      }
//    ]);

//    const summary = {
//      paid: { total: 0, count: 0, orders: [] },
//      unpaid: { total: 0, count: 0, orders: [] }
//    };

//    result.forEach(r => {
//      if (r._id === "paid") {
//        summary.paid.total = r.totalSalePrice;
//        summary.paid.count = r.orderCount;
//        summary.paid.orders = r.orders;
//      } else {
//        summary.unpaid.total += r.totalSalePrice;
//        summary.unpaid.count += r.orderCount;
//        summary.unpaid.orders = (summary.unpaid.orders || []).concat(r.orders);
//      }
//    });

//    return res.json(summary);
//  } catch (err) {
//    console.error(err);
//    return res.status(500).json({ message: "Internal Server Error" });
//  }
//});

//router.get('/my-orders', async (req, res) => {
//  try {
//    console.log("Endpoint /my-orders hit");

//    const token = req.cookies.user_token;
//    console.log("Token from cookies:", token);
//    if (!token) {
//      console.log("No token found, returning 401");
//      return res.status(401).json({ message: "Unauthorized" });
//    }

//    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
//      issuer: "HammerBidMart",
//    });
//    console.log("Decoded JWT:", decoded);

//    const sellerId = decoded.id;
//    console.log("Seller ID:", sellerId);

//    const result = await Order.aggregate([
//      { $match: { "items.sellerId": new mongoose.Types.ObjectId(sellerId) } },
//      {
//        $addFields: {
//          sellerItems: {
//            $filter: {
//              input: "$items",
//              cond: { $eq: ["$$this.sellerId", new mongoose.Types.ObjectId(sellerId)] }
//            }
//          }
//        }
//      },
//      { $match: { "sellerItems.0": { $exists: true } } },
//      { $addFields: { sellerItemsTotal: { $sum: "$sellerItems.totalPrice" } } },
//      {
//        $group: {
//          _id: "$status",
//          totalSalePrice: { $sum: "$sellerItemsTotal" },
//          orderCount: { $sum: 1 },
//          orders: {
//            $push: {
//              _id: "$_id",
//              status: "$status",
//              createdAt: "$createdAt",
//              customerId: "$customerId",
//              items: "$sellerItems",
//              sellerTotal: "$sellerItemsTotal"
//            }
//          }
//        }
//      }
//    ]);

//    console.log("Aggregation result:", JSON.stringify(result, null, 2));

//    const summary = {
//      paid: { total: 0, count: 0, orders: [] },
//      unpaid: { total: 0, count: 0, orders: [] }
//    };

//    result.forEach(r => {
//      console.log("Processing group:", r._id);
//      if (r._id === "paid") {
//        summary.paid.total = r.totalSalePrice;
//        summary.paid.count = r.orderCount;
//        summary.paid.orders = r.orders;
//        console.log("Paid summary updated:", summary.paid);
//      } else {
//        summary.unpaid.total += r.totalSalePrice;
//        summary.unpaid.count += r.orderCount;
//        summary.unpaid.orders = (summary.unpaid.orders || []).concat(r.orders);
//        console.log("Unpaid summary updated:", summary.unpaid);
//      }
//    });

//    console.log("Final summary to return:", summary);
//    return res.json(summary);

//  } catch (err) {
//    console.error("Error in /my-orders:", err);
//    return res.status(500).json({ message: "Internal Server Error" });
//  }
//});

router.get('/my-orders', async (req, res) => {
  try {

    const token = req.cookies.user_token;
    if (!token) {
      console.log("No token found, returning 401");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });

    const sellerId = decoded.id;

    const result = await Order.aggregate([
      { $match: { "items.sellerId": new mongoose.Types.ObjectId(sellerId) } },
      {
        $addFields: {
          sellerItems: {
            $filter: {
              input: "$items",
              cond: { $eq: ["$$this.sellerId", new mongoose.Types.ObjectId(sellerId)] }
            }
          }
        }
      },
      { $match: { "sellerItems.0": { $exists: true } } },
      { $addFields: { sellerItemsTotal: { $sum: "$sellerItems.totalPrice" } } },
      {
        $group: {
          _id: "$status",
          totalSalePrice: { $sum: "$sellerItemsTotal" },
          orderCount: { $sum: 1 },
          orders: {
            $push: {
              _id: "$_id",
              status: "$status",
              createdAt: "$createdAt",
              customerId: "$customerId",
              customerEmail: "$customerEmail", // Added customer email from main document
              items: "$sellerItems",
              sellerTotal: "$sellerItemsTotal"
            }
          }
        }
      }
    ]);

    //console.log("Aggregation result:", JSON.stringify(result, null, 2));

    const summary = {
      paid: { total: 0, count: 0, orders: [] },
      unpaid: { total: 0, count: 0, orders: [] }
    };

    result.forEach(r => {
      console.log("Processing group:", r._id);
      if (r._id === "paid") {
        summary.paid.total = r.totalSalePrice;
        summary.paid.count = r.orderCount;
        summary.paid.orders = r.orders;
        console.log("Paid summary updated:", summary.paid);
      } else {
        summary.unpaid.total += r.totalSalePrice;
        summary.unpaid.count += r.orderCount;
        summary.unpaid.orders = (summary.unpaid.orders || []).concat(r.orders);
        console.log("Unpaid summary updated:", summary.unpaid);
      }
    });

    return res.json(summary);

  } catch (err) {
    console.error("Error in /my-orders:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/my-orders-total', async (req, res) => {
    try {
        const token = req.cookies.user_token;
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const sellerId = decoded.id; // This should be the seller's ID from the token

        const result = await Order.aggregate([
            {
                // Filter items array to only include items from this seller
                $addFields: {
                    sellerItems: {
                        $filter: {
                            input: "$items",
                            cond: { $eq: ["$$this.sellerId", new mongoose.Types.ObjectId(sellerId)] }
                        }
                    }
                }
            },
            {
                // Only keep orders that have at least one item from the seller
                $match: {
                    "sellerItems.0": { $exists: true }
                }
            },
            {
                // Calculate totals for all seller items across all orders
                $group: {
                    _id: null, // Group everything together
                    totalSalesPrice: { $sum: { $sum: "$sellerItems.totalPrice" } },
                    totalItemsSold: { $sum: { $sum: "$sellerItems.amount" } },
                    totalOrders: { $sum: 1 } // Count of orders containing seller items
                }
            }
        ]);

        // Extract the result or return zeros if no orders found
        const summary = result.length > 0 ? {
            totalSalesPrice: result[0].totalSalesPrice,
            totalItemsSold: result[0].totalItemsSold,
            totalOrders: result[0].totalOrders
        } : {
            totalSalesPrice: 0,
            totalItemsSold: 0,
            totalOrders: 0
        };

        return res.json(summary);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});



export default router;



