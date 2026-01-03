import B2BProductModel from '../models/b2b.model.js';
import jwt from "jsonwebtoken"
// Get all products



export const getAllB2BProducts = async (req, res) => {
  try {
    const products = await B2BProductModel.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve products.', error: error.message });
  }
};

// Get a single product by ID
export const getB2BProductById = async (req, res) => {
  try {
    const product = await B2BProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve product.', error: error.message });
  }
};

// Create a new product
export const createB2BProduct = async (req, res) => {
  try {
    const token = req.cookies.user_token || req.cookies.admin_token;
    if (!token) {
      return res.status(401).json({ error: "No authentication token found" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "HammerBidMart",
      });
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Figure out if it’s a user or admin token
    let sellerModel;
    if (req.cookies.user_token) {
      sellerModel = "User";
    } else if (req.cookies.admin_token) {
      sellerModel = "Admin";
    }

    const newProduct = new B2BProductModel({
      ...req.body,
      sellerId: decodedToken.id,
      sellerModel,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to create product.", error: error.message });
  }
};

 

// Update a product
export const updateB2BProduct = async (req, res) => {
  try {

    const product = await B2BProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // --- Handle IMAGES ---
    let existingImages = [];

    // Support both "existingImages" (update) and "images" (create/update)
    const imagesField = req.body.existingImages || req.body.images;

    if (imagesField) {
      if (Array.isArray(imagesField)) {
        existingImages = imagesField;
      } else if (typeof imagesField === "string") {
        try {
          existingImages = JSON.parse(imagesField);
        } catch {
          existingImages = [imagesField];
        }
      }
    }

    // If no existing images provided in request, keep the current product images
    if (existingImages.length === 0 && (!req.body.existingImages && !req.body.images)) {
      existingImages = product.images || [];
    }

    // Combine existing and new images
    const newUploadedImages = req.uploadedImages || [];
    const combinedImages = [...existingImages, ...newUploadedImages];
    
    // Remove duplicates (in case same image URLs are provided)
    product.images = [...new Set(combinedImages)];


    // --- Handle VIDEO ---
    if (req.uploadedVideo !== undefined) {
  // Explicitly set video field to uploaded value (even null)
  product.video = req.uploadedVideo;
} else if (req.body.video) {
  product.video = req.body.video;
}
    // If neither, keep existing video (don't overwrite with undefined)

    // --- Other fields ---
    product.productName = req.body.productName || product.productName;
    product.supplierName = req.body.supplierName || product.supplierName;
    product.description = req.body.description || product.description;

    await product.save();

    return res.status(200).json(product);
  } catch (error) {
    console.error("updateB2BProduct error:", error.name, error.message);
    return res.status(400).json({
      message: "Failed to update product.",
      error: error.message,
    });
  }
};



// Delete a product
export const deleteB2BProduct = async (req, res) => {
  try {
    const deletedProduct = await B2BProductModel.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json({ message: 'Product successfully deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product.', error: error.message });
  }
};


export const getProducts = async (req, res, next) => {
  try {
    const token = req.cookies.user_token || req.cookies.admin_token;
    if (!token) {
      return res.status(401).json({ error: "No authentication token found" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "HammerBidMart",
      });
    } catch (err) {
      console.error("JWT Error:", err.name, "-", err.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 🔹 Figure out model type
    let sellerModel;
    if (req.cookies.user_token) {
      sellerModel = "User";
    } else if (req.cookies.admin_token) {
      sellerModel = "Admin";
    }

    const sellerId = decodedToken.id;

    // 🔹 Fetch all products for this seller with correct model
    const products = await B2BProductModel.find({ sellerId, sellerModel });

    res.status(200).json({ products });
  } catch (err) {
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    next(err); // keep your error middleware in play
  }
};


