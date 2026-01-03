import Product from "../models/product.model.js";
import jwt from "jsonwebtoken";

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    products.reverse()
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve products.', error: error.message });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve product.', error: error.message });
  }
};

// Create a new product
export const createProductController = async (req, res) => {
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

    // Parse sku_variants if it came as a string
    if (typeof req.body.sku_variants === "string") {
      try {
        req.body.sku_variants = JSON.parse(req.body.sku_variants);
      } catch {
        return res.status(400).json({ error: "Invalid JSON for sku_variants" });
      }
    }

    // Parse description if it came as a string
    if (typeof req.body.description === "string") {
      try {
        req.body.description = JSON.parse(req.body.description);
      } catch {
        // If parsing fails, treat as simple string description
        req.body.description = { longDescription: req.body.description };
      }
    }

    // Check duplicate product
    const existing = await Product.findOne({ name: req.body.name });
    if (existing) {
      return res.status(409).json({ error: "Product already exists" });
    }

    let sellerModel;
    if (req.cookies.user_token) {
      sellerModel = "User";
    } else if (req.cookies.admin_token) {
      sellerModel = "Admin";
    }

    const newProduct = new Product({
      ...req.body,
      sellerId: decodedToken.id,
      sellerModel
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
export const updateProduct = async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);
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


    // --- Handle complex fields ---
    
    // Parse sku_variants if it came as a string
    if (req.body.sku_variants) {
      if (typeof req.body.sku_variants === "string") {
        try {
          product.sku_variants = JSON.parse(req.body.sku_variants);
        } catch {
          console.log("Failed to parse sku_variants, keeping existing");
        }
      } else {
        product.sku_variants = req.body.sku_variants;
      }
    }

    // Parse description if it came as a string
    if (req.body.description) {
      if (typeof req.body.description === "string") {
        try {
          product.description = JSON.parse(req.body.description);
        } catch {
          // If parsing fails, treat as simple string and put in longDescription
          product.description = { 
            ...product.description, 
            longDescription: req.body.description 
          };
        }
      } else {
        product.description = { ...product.description, ...req.body.description };
      }
    }

    // --- Other fields ---
    product.name = req.body.name || product.name;
    product.brand = req.body.brand || product.brand;
    product.category = req.body.category || product.category;
    product.seller = req.body.seller || product.seller;
    product.status = req.body.status || product.status;

    await product.save();

    return res.status(200).json(product);
  } catch (error) {
    console.error("updateProduct error:", error.name, error.message);
    return res.status(400).json({
      message: "Failed to update product.",
      error: error.message,
    });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.status(200).json({ message: 'Product successfully deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product.', error: error.message });
  }
};

// Get products for authenticated user/admin
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
    const products = await Product.find({ sellerId, sellerModel });

    res.status(200).json({ products });
  } catch (err) {
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    next(err); // keep your error middleware in play
  }
};
