import jwt from "jsonwebtoken";
import ProductDS from "../models/dropship.model.js";
import ProductB2B from "../models/b2b.model.js";
import Product from "../models/product.model.js";

const modelMap = {
  dropship: ProductDS,
  b2b: ProductB2B,
  inventory: Product,
};

// --- Add Review ---
export const addReview = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { name, message } = req.body;

    // Grab either user_token or admin_token
    const token = req.cookies.user_token || req.cookies.admin_token ||
    req.headers["user_token"] || req.headers["admin_token"];
    
    
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const Model = modelMap[type];
    if (!Model) return res.status(400).json({ message: "Invalid type" });

    const product = await Model.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.reviews.push({
      userId: decoded.id,  // from token
      name,
      message,
    });

    await product.save();

    res.status(201).json({ message: "Review added", reviews: product.reviews });
  } catch (err) {
    next(err);
  }
};

// --- Remove Review ---
export const removeReview = async (req, res, next) => {
  try {
    const { type, id, reviewId } = req.params;

    // Grab either user_token or admin_token
    const token = req.cookies?.user_token || req.cookies?.admin_token ||
                  req.headers["user_token"] || req.headers["admin_token"];
    
    
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const Model = modelMap[type];
    if (!Model) return res.status(400).json({ message: "Invalid type" });

    const product = await Model.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = product.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const isAdmin = decoded.role === "admin";
    const isOwner = review.userId.toString() === decoded.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not allowed to delete this review" });
    }

    review.deleteOne();
    await product.save();

    res.json({ message: "Review removed" });
  } catch (err) {
    next(err);
  }
};
