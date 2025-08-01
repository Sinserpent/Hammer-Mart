// services/productService.js
import Product from '../models/productModel.js'; // Adjust path to your existing Product model

/**
 * Create a new product in the database
 * @param {Object} productData - Product data object
 * @returns {Object} Created product
 */
const createProduct = async (productData) => {
  try {
    // Clean the data - ensure required fields are present
    const cleanedData = {
      HScode: productData.HScode?.toString().trim(),
      productCategory: productData.productCategory?.toString().trim(),
      brand: productData.brand?.toString().trim() || null,
      itemName: productData.itemName?.toString().trim(),
      stock: productData.stock ? Number(productData.stock) : null,
      sold: productData.sold ? Number(productData.sold) : null,
      // Add any other fields from your existing Product model
    };

    // Remove any undefined values 
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === undefined) {
        delete cleanedData[key];
      }
    });

    const product = new Product(cleanedData);
    const savedProduct = await product.save();
    
    return savedProduct;
  } catch (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }
};

/**
 * Find a product by HScode
 * @param {string} HScode - Product HScode
 * @returns {Object|null} Found product or null
 */
const findProductByHSCode = async (HScode) => {
  try {
    const product = await Product.findOne({ HScode: HScode.toString().trim() });
    return product;
  } catch (error) {
    throw new Error(`Failed to find product: ${error.message}`);
  }
};

/**
 * Update an existing product
 * @param {string} HScode - Product HScode
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated product
 */
const updateProduct = async (HScode, updateData) => {
  try {
    const product = await Product.findOneAndUpdate(
      { HScode: HScode.toString().trim() },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  } catch (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
};

/**
 * Get all products with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Products and pagination info
 */
const getProducts = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments();
    
    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to get products: ${error.message}`);
  }
};

/**
 * Delete a product by HScode
 * @param {string} HScode - Product HScode
 * @returns {Object} Deleted product
 */
const deleteProduct = async (HScode) => {
  try {
    const product = await Product.findOneAndDelete({ HScode: HScode.toString().trim() });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  } catch (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
};

export {
  createProduct,
  findProductByHSCode,
  updateProduct,
  getProducts,
  deleteProduct
};