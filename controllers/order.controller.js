import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import ProductDS from "../models/dropship.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import userModel from "../models/user.model.js";
import NotificationService from "../controllers/Email.controller.js";
import { createPaymentIntent, createStripePaymentIntent } from "./payment.controller.js";
import jwt from "jsonwebtoken";
import adminModel from "../models/admin.model.js";

const ADMIN_EMAIL = process.env.SMTP_USER || "admin@example.com";

//export async function createOrderFromCart(req, res) {
//  const token = req.cookies.user_token || req.cookies.admin_token;
//  if (!token) return res.status(401).json({ message: "Unauthorized" });
 
  

//  let decoded;
//  try {
//    decoded = jwt.verify(token, process.env.JWT_SECRET, {
//      issuer: "HammerBidMart",
//    });
//  } catch {
//    return res.status(401).json({ message: "Invalid token" });
//  }
  

//  let customerEmail, customerName, customerId, customerRole;

//if (req.cookies.user_token) {
//  const decoded = jwt.verify(req.cookies.user_token, process.env.JWT_SECRET, {
//    issuer: "HammerBidMart",
//  });
//  const user = await userModel.findById(decoded.id);
//  if (!user) throw new Error("User not found");
//  customerId = decoded.id;

//  if (user.role === "seller") {
//    customerEmail = user.businessEmail;
//    customerName = user.fullName;
//    customerRole = "User";
//  } else if (user.role === "buyer") {
//    customerEmail = user.email;
//    customerName = user.fullName;
//    customerRole = "User";
//  } else {
//    throw new Error(`Unsupported role: ${user.role}`);
//  }
//} else if (req.cookies.admin_token) {
//  const decoded = jwt.verify(req.cookies.admin_token, process.env.JWT_SECRET, {
//    issuer: "HammerBidMart",
//  });
//  const admin = await adminModel.findById(decoded.id);
//  if (!admin) throw new Error("Admin not found");
//  customerId = decoded.id;
//  customerEmail = admin.email;
//  customerName = admin.fullName;
//  customerRole = "Admin";
//} else {
//  throw new Error("No valid token found");
//}
//  console.log(customerEmail, customerName, customerId);
  
//  const session = await mongoose.startSession();
//  session.startTransaction();

//  try {
//    const cart = await Cart.findOne({ userId: decoded.id });
//    if (!cart || cart.items.length === 0) {
//      throw new Error("Cart is empty");
//    }

//    let totalOrderPrice = 0;
//    const orderItems = [];
//    const sellerMap = new Map();

//    for (const item of cart.items) {
//      const { productId, sku, quantity, type } = item;

//      let product,
//        unitPrice = 0,
//        itemSku,
//        productModel;

//      if (type === "dropship") {
//        product = await ProductDS.findById(productId).session(session);
//        if (!product)
//          throw new Error(`Dropship product ${productId} not found`);
//        unitPrice = product.price;
//        itemSku = `DS-${product._id}`; // just for your record, not required
//        // NO SKU validation, NO stock deduction
//        productModel = "ProductDS";
//      } else if (type === "inventory") {
//        product = await Product.findById(productId).session(session);
//        if (!product)
//          throw new Error(`Inventory product ${productId} not found`);
//        const variant = product.sku_variants.find((v) => v.sku === sku);
//        if (!variant) throw new Error(`SKU ${sku} not found`);
//        if (variant.quantity.available < quantity)
//          throw new Error(`Insufficient stock for SKU ${sku}`);
//        unitPrice = variant.price;
//        itemSku = sku;
//        productModel = "Product";

//        // Deduct stock for inventory only
//        variant.quantity.available -= quantity;
//        variant.quantity.sold += quantity;
//        product.markModified("sku_variants");
//        await product.save({ session });
//      } else {
//        throw new Error(`Invalid product type: ${type}`);
//      }

//      totalOrderPrice += unitPrice * quantity;

//      //Collect seller info
//      let seller, sellerEmail, sellerModel;

//      if (product.sellerModel == "User") {
//        seller = await userModel.findById(product.sellerId);
//        if (!seller)
//          throw new Error(
//            `Seller not found for product ${productId}`
//          );
//        sellerEmail = seller.businessEmail;
//        sellerModel = "User";
//      } else {
//        seller = await adminModel.findById(product.sellerId);
//        if (!seller)
//          throw new Error(
//            `A Seller not found for product ${productId} ${product.sellerId}`
//          );
//        sellerEmail = seller.email;
//        sellerModel = "Admin";
//      }
//      const customFields = req.body.customFields
//      const address = req.body.address   
//      // Build order item
//      const orderItem = {
//        productId: product._id,
//        productModel,
//        name: product.name || product.title,
//        sku: itemSku,
//        amount: quantity,
//        unitPrice,
//        totalPrice: unitPrice * quantity,
//        sellerId: product.sellerId,
//        sellerModel: sellerModel,
//        sellerEmail,
//        sellerName: seller.fullName,
//        productType: type,
//	product_id: product.product_id || null,
//	customFields: customFields || null, //added this line
//      address: address
//      };

//      orderItems.push(orderItem);

//      // Seller map for notifications
//      if (!sellerMap.has(sellerEmail)) {
//        sellerMap.set(sellerEmail, { name: seller.fullName, items: [] });
//      }
//      sellerMap.get(sellerEmail).items.push({
//        name: product.name || product.title,
//        amount: quantity,
//        unitPrice,
//        totalPrice: unitPrice * quantity,
//        sku: itemSku,
//      });
//    }

//    // --- Create order ---
//    const order = new Order({
//      userId: customerId,
//      userModel:customerRole,
//      items: orderItems,
//      totalSalePrice: totalOrderPrice,
//      customerEmail: customerEmail,
//      address: req.body.address,
//      status: "pending",
//      paymentType: "Order", // <--- add this
//    });

//    await order.save({ session });


//    // --- Payment Intent ---
//    const paymentDetails = await createPaymentIntent(order);

//    await session.commitTransaction();
//    session.endSession();

//    // --- Notifications ---
//    //await NotificationService.sendNotification(
//    //  "order_placed",
//    //  "admin",
//    //  ADMIN_EMAIL,
//    //  {
//    //    orderId: order._id,
//    //    customerName: customerName,
//    //    customerEmail: customerEmail,
//    //    totalOrderPrice,
//    //    items: orderItems,
//    //  }
//    //);

//    //for (const [sellerEmail, sellerData] of sellerMap.entries()) {
//    //  await NotificationService.sendNotification(
//    //    "order_placed",
//    //    "seller",
//    //    sellerEmail,
//    //    {
//    //      orderId: order._id,
//    //      customerName: customerName,
//    //      customerEmail: customerEmail,
//    //      sellerName: sellerData.name,
//    //      items: sellerData.items,
//    //      address: req.body.address,
//    //    }
//    //  );
//    //}

//    //await NotificationService.sendNotification(
//    //  "order_placed",
//    //  "buyer",
//    //  customerEmail,
//    //  {
//    //    orderId: order._id,
//    //    customerName: customerName,
//    //    status: order.status,
//    //    totalOrderPrice,
//    //    address: req.body.address,
//    //    items: orderItems,
//    //  }
//    //);

//    return res.status(201).json({
//      success: true,
//      order: {
//        orderId: order._id,
//        totalAmount: totalOrderPrice,
//        status: order.status,
//        clientSecret: paymentDetails.clientSecret,
//        currency: paymentDetails.currency,
//      },
//    });
//  } catch (err) {
//    await session.abortTransaction();
//    session.endSession();
//    console.error(err);
//    return res.status(500).json({ success: false, error: err.message });
//  }
//}




//COPIED FUNC
//export async function createOrderFromCart2(req, res) {
//  const token = req.cookies.user_token || req.cookies.admin_token;
//  if (!token) return res.status(401).json({ message: "Unauthorized" });

//  let decoded;
//  try {
//    decoded = jwt.verify(token, process.env.JWT_SECRET, {
//      issuer: "HammerBidMart",
//    });
//  } catch {
//    return res.status(401).json({ message: "Invalid token" });
//  }

//  let customerEmail, customerName, customerId, customerRole;

//  if (req.cookies.user_token) {
//    const decoded = jwt.verify(req.cookies.user_token, process.env.JWT_SECRET, {
//      issuer: "HammerBidMart",
//    });
//    const user = await userModel.findById(decoded.id);
//    if (!user) throw new Error("User not found");
//    customerId = decoded.id;

//    if (user.role === "seller") {
//      customerEmail = user.businessEmail;
//      customerName = user.fullName;
//      customerRole = "User";
//    } else if (user.role === "buyer") {
//      customerEmail = user.email;
//      customerName = user.fullName;
//      customerRole = "User";
//    } else {
//      throw new Error(`Unsupported role: ${user.role}`);
//    }
//  } else if (req.cookies.admin_token) {
//    const decoded = jwt.verify(req.cookies.admin_token, process.env.JWT_SECRET, {
//      issuer: "HammerBidMart",
//    });
//    const admin = await adminModel.findById(decoded.id);
//    if (!admin) throw new Error("Admin not found");
//    customerId = decoded.id;
//    customerEmail = admin.email;
//    customerName = admin.fullName;
//    customerRole = "Admin";
//  } else {
//    throw new Error("No valid token found");
//  }
  
//  console.log(customerEmail, customerName, customerId);

//  // Validate payment method
//  const payMethod = req.body.payMethod;
//  if (!payMethod || !["stripe", "COD", "googlePay"].includes(payMethod)) {
//    return res.status(400).json({ 
//      success: false, 
//      error: "Invalid or missing payment method. Must be 'stripe', 'COD', or 'googlePay'" 
//    });
//  }

//  // For now, reject googlePay
//  if (payMethod === "googlePay") {
//    return res.status(400).json({ 
//      success: false, 
//      error: "Google Pay is not yet supported" 
//    });
//  }

//  const session = await mongoose.startSession();
//  session.startTransaction();

//  try {
//    const cart = await Cart.findOne({ userId: decoded.id });
//    if (!cart || cart.items.length === 0) {
//      throw new Error("Cart is empty");
//    }

//    let totalOrderPrice = 0;
//    const orderItems = [];
//    const sellerMap = new Map();

//    for (const item of cart.items) {
//      const { productId, sku, quantity, type, price, customFields } = item;

//      let product,
//        unitPrice = 0,
//        itemSku,
//        productModel;

//      if (type === "dropship") {
//        product = await ProductDS.findById(productId).session(session);
//        if (!product)
//          throw new Error(`Dropship product ${productId} not found`);
        
//        // Use price from cart item (already calculated on frontend based on variant)
//        if (!price) {
//          throw new Error(`Price missing for dropship product ${productId}`);
//        }
        
//        unitPrice = price;
//        itemSku = sku || `DS-${product._id}`; // Use provided SKU or generate one
//        // NO stock deduction for dropship
//        productModel = "ProductDS";
        
//      } else if (type === "inventory") {
//        product = await Product.findById(productId).session(session);
//        if (!product)
//          throw new Error(`Inventory product ${productId} not found`);
//        const variant = product.sku_variants.find((v) => v.sku === sku);
//        if (!variant) throw new Error(`SKU ${sku} not found`);
//        if (variant.quantity.available < quantity)
//          throw new Error(`Insufficient stock for SKU ${sku}`);
//        unitPrice = variant.price;
//        itemSku = sku;
//        productModel = "Product";

//        // Deduct stock for inventory only
//        variant.quantity.available -= quantity;
//        variant.quantity.sold += quantity;
//        product.markModified("sku_variants");
//        await product.save({ session });
//      } else {
//        throw new Error(`Invalid product type: ${type}`);
//      }

//      totalOrderPrice += unitPrice * quantity;

//      // Collect seller info
//      let seller, sellerEmail, sellerModel;

//      if (product.sellerModel == "User") {
//        seller = await userModel.findById(product.sellerId);
//        if (!seller)
//          throw new Error(`Seller not found for product ${productId}`);
//        sellerEmail = seller.businessEmail;
//        sellerModel = "User";
//      } else {
//        seller = await adminModel.findById(product.sellerId);
//        if (!seller)
//          throw new Error(`A Seller not found for product ${productId} ${product.sellerId}`);
//        sellerEmail = seller.email;
//        sellerModel = "Admin";
//      }
      
//      const address = req.body.address;
      
//      // Build order item
//      const orderItem = {
//        productId: product._id,
//        productModel,
//        name: product.name || product.title,
//        sku: itemSku,
//        amount: quantity,
//        unitPrice,
//        totalPrice: unitPrice * quantity,
//        sellerId: product.sellerId,
//        sellerModel: sellerModel,
//        sellerEmail,
//        sellerName: seller.fullName,
//        productType: type,
//        product_id: product.product_id || null,
//        customFields: customFields || req.body.customFields || null,
//        address: address,
//      };

//      orderItems.push(orderItem);

//      // Seller map for notifications
//      if (!sellerMap.has(sellerEmail)) {
//        sellerMap.set(sellerEmail, { name: seller.fullName, items: [] });
//      }
//      sellerMap.get(sellerEmail).items.push({
//        name: product.name || product.title,
//        amount: quantity,
//        unitPrice,
//        totalPrice: unitPrice * quantity,
//        sku: itemSku,
//      });
//    }

//    // --- Create order ---
//    const order = new Order({
//      userId: customerId,
//      userModel: customerRole,
//      items: orderItems,
//      totalSalePrice: totalOrderPrice,
//      customerEmail: customerEmail,
//      address: req.body.address,
//      status: "pending",
//      paymentType: "Order",
//      paymentMethod: payMethod, // Store payment method
//    });

//    await order.save({ session });

//    // --- Handle Payment based on method ---
//    let paymentDetails = null;

//    if (payMethod === "stripe") {
//      // Create Stripe payment intent for Stripe payments
//      const amountInCents = Math.round(order.totalSalePrice * 100);
//      paymentDetails = await createStripePaymentIntent({
//        amount: amountInCents,
//        metadata: { orderId: order._id.toString() },
//        description: `Order payment for ${customerName}`,
//        receipt_email: customerEmail,
//      });
//    }
//    // For COD, no payment processing needed

//    await session.commitTransaction();
//    session.endSession();

//    // --- Notifications (commented out in original) ---
//    // await NotificationService.sendNotification(...);

//    // --- Build response based on payment method ---
//    const response = {
//      success: true,
//      order: {
//        orderId: order._id,
//        totalAmount: totalOrderPrice,
//        status: order.status,
//        paymentMethod: payMethod,
//      },
//    };

//    // Add payment details for Stripe
//    if (payMethod === "stripe" && paymentDetails) {
//      response.order.clientSecret = paymentDetails.clientSecret;
//      response.order.currency = paymentDetails.currency;
//    }

//    return res.status(201).json(response);
    
//  } catch (err) {
//    await session.abortTransaction();
//    session.endSession();
//    console.error(err);
//    return res.status(500).json({ success: false, error: err.message });
//  }
//}

export async function createOrderFromCart(req, res) {
  const token = req.cookies.user_token || req.cookies.admin_token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  let customerEmail, customerName, customerId, customerRole;

  if (req.cookies.user_token) {
    const decoded = jwt.verify(req.cookies.user_token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });
    const user = await userModel.findById(decoded.id);
    if (!user) throw new Error("User not found");
    customerId = decoded.id;

    if (user.role === "seller") {
      customerEmail = user.businessEmail;
      customerName = user.fullName;
      customerRole = "User";
    } else if (user.role === "buyer") {
      customerEmail = user.email;
      customerName = user.fullName;
      customerRole = "User";
    } else {
      throw new Error(`Unsupported role: ${user.role}`);
    }
  } else if (req.cookies.admin_token) {
    const decoded = jwt.verify(req.cookies.admin_token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });
    const admin = await adminModel.findById(decoded.id);
    if (!admin) throw new Error("Admin not found");
    customerId = decoded.id;
    customerEmail = admin.email;
    customerName = admin.fullName;
    customerRole = "Admin";
  } else {
    throw new Error("No valid token found");
  }

  console.log(customerEmail, customerName, customerId);

  // Validate payment method
  const payMethod = req.body.payMethod;
  if (!payMethod || !["stripe", "cash on delivery", "googlePay"].includes(payMethod)) {
    return res.status(400).json({
      success: false,
      error: "Invalid or missing payment method. Must be 'stripe', 'COD', or 'googlePay'",
    });
  }

  // For now, reject googlePay
  if (payMethod === "googlePay") {
    return res.status(400).json({
      success: false,
      error: "Google Pay is not yet supported",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ userId: decoded.id });
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    let totalOrderPrice = 0;
    const orderItems = [];
    const sellerMap = new Map();

    for (const item of cart.items) {
      const { productId, sku, quantity, type, price, customFields } = item;

      let product,
        unitPrice = 0,
        itemSku,
        productModel;

      if (type === "dropship") {
        product = await ProductDS.findById(productId).session(session);
        if (!product)
          throw new Error(`Dropship product ${productId} not found`);

        if (!price) throw new Error(`Price missing for dropship product ${productId}`);
        unitPrice = price;
        itemSku = sku || `DS-${product._id}`;
        productModel = "ProductDS";

      } else if (type === "inventory") {
        product = await Product.findById(productId).session(session);
        if (!product) throw new Error(`Inventory product ${productId} not found`);
        const variant = product.sku_variants.find((v) => v.sku === sku);
        if (!variant) throw new Error(`SKU ${sku} not found`);
        if (variant.quantity.available < quantity)
          throw new Error(`Insufficient stock for SKU ${sku}`);
        unitPrice = variant.price;
        itemSku = sku;
        productModel = "Product";

        // Deduct stock
        variant.quantity.available -= quantity;
        variant.quantity.sold += quantity;
        product.markModified("sku_variants");
        await product.save({ session });
      } else {
        throw new Error(`Invalid product type: ${type}`);
      }

      totalOrderPrice += unitPrice * quantity;

      // Collect seller info
      let seller, sellerEmail, sellerModel;

      if (product.sellerModel == "User") {
        seller = await userModel.findById(product.sellerId);
        if (!seller) throw new Error(`Seller not found for product ${productId}`);
        sellerEmail = seller.businessEmail;
        sellerModel = "User";
      } else {
        seller = await adminModel.findById(product.sellerId);
        if (!seller) throw new Error(`A Seller not found for product ${productId} ${product.sellerId}`);
        sellerEmail = seller.email;
        sellerModel = "Admin";
      }

      const address = req.body.address;

      // --- Normalize customFields for dropship ---
      const normalizedCustomFields =
        type === "dropship" && customFields
          ? { [product._id]: customFields }
          : customFields || req.body.customFields || null;

      // Build order item
      const orderItem = {
        productId: product._id,
        productModel,
        name: product.name || product.title,
        sku: itemSku,
        amount: quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        sellerId: product.sellerId,
        sellerModel,
        sellerEmail,
        sellerName: seller.fullName,
        productType: type,
        product_id: product.product_id || null,
        customFields: normalizedCustomFields,
        address: address,
      };

      orderItems.push(orderItem);

      // Seller map for notifications
      if (!sellerMap.has(sellerEmail)) {
        sellerMap.set(sellerEmail, { name: seller.fullName, items: [] });
      }
      sellerMap.get(sellerEmail).items.push({
        name: product.name || product.title,
        amount: quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        sku: itemSku,
      });
    }

    // --- Create order ---
    const order = new Order({
      userId: customerId,
      userModel: customerRole,
      items: orderItems,
      totalSalePrice: totalOrderPrice,
      customerEmail,
      address: req.body.address,
      status: "pending",
      paymentType: "Order",
      paymentMethod: payMethod,
    });

    await order.save({ session });

    // --- Handle payment ---
    let paymentDetails = null;
    if (payMethod === "stripe") {
      const amountInCents = Math.round(order.totalSalePrice * 100);
      paymentDetails = await createStripePaymentIntent({
        amount: amountInCents,
        metadata: { orderId: order._id.toString() },
        description: `Order payment for ${customerName}`,
        receipt_email: customerEmail,
      });
    }

    await session.commitTransaction();
    session.endSession();

    // --- Build response ---
    const response = {
      success: true,
      order: {
        orderId: order._id,
        totalAmount: totalOrderPrice,
        status: order.status,
        paymentMethod: payMethod,
      },
    };

    if (payMethod === "stripe" && paymentDetails) {
      response.order.clientSecret = paymentDetails.clientSecret;
      response.order.currency = paymentDetails.currency;
    }

    return res.status(201).json(response);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
