import { DropshipperClient } from "ae_sdk";
import { ensureAccessToken } from "./token.controller.js";
import ProductAttributes from "../models/dropship.comp.model.js";
import Product from "../models/dropship.model.js";
import jwt from "jsonwebtoken";

//Validation helpers

const safeNumber = (val, defaultValue = 0) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(/[^\d.]/g, ""));
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const safeInt = (val, defaultValue = 0) => {
  if (typeof val === "number") return Math.floor(val);
  if (typeof val === "string") {
    const parsed = parseInt(val.replace(/[^\d]/g, ""), 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

// Extract seller info from JWT token with better error handling
const extractSellerInfo = (req) => {
  const sellerModel = req.cookies.admin_token ? "Admin" : "User";
  const token = req.cookies.user_token || req.cookies.admin_token;

  if (!token) throw new Error("No token provided");

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });
    return { sellerId: decodedToken.id, sellerModel };
  } catch {
    throw new Error("Invalid or expired token");
  }
};

//MAIN FUNCTIONS
//Main Fetch
export const getProduct = async (req, res) => {
  try {
    console.log("🚀 Entered getProduct");

    let productId = req.params.productId || req.body.productId;
    const userCountry = req.body.userCountry || "US";
   // const newPrice = req.body.newPrice;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }


//newLines START HERE
    const urlRegex = /(?:\/item\/)(100500\d+)(?=\.html)/;
    const idRegex = /(100500\d+)/;

    let match = productId.match(urlRegex);
    if (match) {
      productId = match[1]; // full URL worked
    } else {
      match = productId.match(idRegex); // try just the ID
    if (match) {
      productId = match[1]; // simple 100500 ID works
    } else {
      return res.status(400).json({ success: false, message: "Invalid AliExpress product URL or ID" });
    }
}
//newline END HERE

    // Extract seller info from JWT
    let sellerInfo;
    try {
      sellerInfo = extractSellerInfo(req);
    } catch (err) {
      return res.status(401).json({ success: false, message: err.message });
    }
    const { sellerId, sellerModel } = sellerInfo;
    
   //NEW LINES START HERE
    const existingProduct = await Product.findOne({ product_id: productId });

    if (existingProduct && existingProduct.sellerId !== sellerId) {
      return res.status(400).json({ success: false, message: "Product already exists" });
    }
   //NEW LINES END HERE

    // Get AliExpress access token
    let token;
    try {
      token = await ensureAccessToken();
    } catch {
      return res.status(500).json({ success: false, message: "Failed to get AliExpress token" });
    }

    const client = new DropshipperClient({
      app_key: process.env.APP_KEY,
      app_secret: process.env.APP_SECRET,
      session: token,
    });

    // Call AliExpress API
    let rawResponse;
    try {
      rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
        product_id: productId,
        ship_to_country: userCountry,
        target_currency: "USD",
        target_language: "en",
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch product from AliExpress" });
    }

    const productData = normalizeProductData(rawResponse, productId, sellerId, sellerModel);

    // Save/update product in DB
    const productDoc = await Product.findOneAndUpdate(
      { product_id: productData.product_id, sellerId, sellerModel },
      { $set: productData },
      { upsert: true, new: true, runValidators: true }
    );

    // Save/update product attributes
    await ProductAttributes.findOneAndUpdate(
      { product_id: productData.product_id },
      { $set: { attributes: productData.attributes } },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, product: productDoc.toObject() });

  } catch (error) {
    console.error("🔥 Unexpected error in getProduct:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Normalizer
// UPDATED normalizeProductData function - THIS IS WHAT YOU NEED
// UPDATED normalizeProductData function - THIS IS WHAT YOU NEED
const normalizeProductData = (rawResponse, productId, sellerId, sellerModel) => {
  const result = rawResponse?.data?.aliexpress_ds_product_get_response?.result || {};
  const baseInfo = result.ae_item_base_info_dto || {};
  const rawSkus = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];

  // --- Attributes (unchanged) ---
  const attrMap = {};
  rawSkus.forEach((sku) => {
    const sku_attributes = sku.ae_sku_property_dtos?.ae_sku_property_d_t_o || [];
    sku_attributes.forEach((prop) => {
      const name = prop.sku_property_name;
      const value = prop.sku_property_value;
      if (!attrMap[name]) attrMap[name] = new Set();
      attrMap[name].add(value);
    });
  });
  const attributes = Object.fromEntries(
    Object.entries(attrMap).map(([k, v]) => [k, [...v]])
  );

  // --- Images ---
  const multimedia = result.ae_multimedia_info_dto;
  const images = multimedia && multimedia.image_urls
    ? multimedia.image_urls.split(";").filter(Boolean)
    : [];

  // --- SKU Variants with 1.2 markup AND originalPrice ---
  const sku_variants = rawSkus.map(sku => {
    const obj = {};
    sku.ae_sku_property_dtos?.ae_sku_property_d_t_o?.forEach(p => {
      obj[p.sku_property_name] = p.sku_property_value;
    });
    
    // Get raw prices from AliExpress
    const rawDiscountedPrice = Number(sku.offer_sale_price ?? sku.sku_price ?? 0);
    const rawOriginalPrice = Number(sku.sku_price ?? rawDiscountedPrice ?? 0);
    
    // Apply 1.2x markup to both prices
    obj.price = rawDiscountedPrice ? +(rawDiscountedPrice * 1.2).toFixed(2) : 0;
    obj.originalPrice = rawOriginalPrice ? +(rawOriginalPrice * 1.2).toFixed(2) : 0;
    
    return obj;
  });

  // --- Main price: use first variant's price ---
  const mainPrice = sku_variants.length > 0 ? sku_variants[0].price : 0;
  const mainOriginalPrice = sku_variants.length > 0 ? sku_variants[0].originalPrice : 0;

  return {
    product_id: safeInt(baseInfo.product_id || productId),
    sellerId,
    sellerModel,
    title: baseInfo.subject || baseInfo.product_title || "",
    price: mainPrice,
    original_price: mainOriginalPrice,
    currency: rawSkus[0]?.currency_code || "USD",
    attributes,
    images,
    sku_variants,
  };
};

// Get product attributes
export const getProductAttributes = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Extract seller info from JWT
    const { sellerId, sellerModel } = extractSellerInfo(req);

    const product = await Product.findOne({
      product_id: productId,
      sellerId,
      sellerModel
    }).lean();

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: `Product ${productId} not found` 
      });
    }

    if (!product.attributes || Object.keys(product.attributes).length === 0) {
      return res.status(404).json({
        success: false,
        message: `Attributes for product ${productId} not found`,
      });
    }

    return res.status(200).json({ 
      success: true, 
      attributes: product.attributes 
    });
  } catch (error) {
    console.error("Error in getProductAttributes:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete product
export const deleteProduct = async (productId, req) => {
  try {
    // Extract seller info from JWT
    const { sellerId, sellerModel } = extractSellerInfo(req);

    const deletedDoc = await Product.findOneAndDelete({
      product_id: productId,
      sellerId,
      sellerModel
    });

    if (!deletedDoc) {
      return {
        success: false,
        message: `Product ${productId} not found`
      };
    }

    return {
      success: true,
      message: "Product deleted successfully",
      deleted_product: deletedDoc.toObject(),
    };
  } catch (error) {
    console.error(`Error deleting product:`, error);
    return {
      success: false,
      message: error.message
    };
  }
};

// --- GET USER PRODUCTS ---
export const getUserProducts = async (req, res) => {
  try {
    const { sellerId, sellerModel } = extractSellerInfo(req);

    const products = await Product.find({ sellerId, sellerModel });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Error getting user products:", error);
    const status = error.message.includes("token") ? 401 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};

// --- GET ALL PRODUCTS (Admin only or public) ---
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    
    return res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error("Error getting all products:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update product price
export const updateProductPrice = async (req, res) => {
  try {
    const { id } = req.params; // get from URL
    const productId = id;
    let { newPrice } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    if (newPrice === undefined) {
      return res.status(400).json({ success: false, message: "New price is required" });
    }

    newPrice = safeNumber(newPrice);

    // Extract seller info
    const { sellerId, sellerModel } = extractSellerInfo(req);

    const updatedProduct = await Product.findOneAndUpdate(
      { product_id: productId, sellerId, sellerModel },
      { $set: { price: newPrice } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: `Product ${productId} not found` });
    }

    return res.status(200).json({
      success: true,
      message: `Price updated to ${newPrice}`,
      product: updatedProduct.toObject()
    });

  } catch (error) {
    console.error("Error updating product price:", error);
    const status = error.message.includes("token") ? 401 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
};



//DEBUG / TESTING FUNCTION

export const getProduct2 = async (req, res) => {
  try {
    console.log("🚀 Entered getProduct");

    let productId = req.params.productId || req.body.productId;
    const userCountry = req.body.userCountry || "US";

    if (!productId)
      return res.status(400).json({ success: false, message: "Product ID is required" });

    // Extract ID from URL or numeric string
    const urlRegex = /(?:\/item\/)(100500\d+)(?=\.html)/;
    const idRegex = /(100500\d+)/;
    let match = productId.match(urlRegex) || productId.match(idRegex);
    if (!match)
      return res.status(400).json({ success: false, message: "Invalid product URL or ID" });
    productId = match[1];

    // Extract seller info from JWT
    let sellerInfo;
    try {
      sellerInfo = extractSellerInfo(req);
    } catch (err) {
      return res.status(401).json({ success: false, message: err.message });
    }
    const { sellerId, sellerModel } = sellerInfo;

    // Get AliExpress token
    let token;
    try {
      token = await ensureAccessToken();
    } catch {
      return res.status(500).json({ success: false, message: "Failed to get AliExpress token" });
    }

    const client = new DropshipperClient({
      app_key: process.env.APP_KEY,
      app_secret: process.env.APP_SECRET,
      session: token,
    });

    // Fetch product
    let rawResponse;
    try {
      rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
        product_id: productId,
        ship_to_country: userCountry,
        target_currency: "USD",
        target_language: "en",
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "AliExpress API failed", error: err.message });
    }

    // Normalize product data
    //const productData = normalizeProductData2(rawResponse, productId, sellerId, sellerModel);

    console.log("✅ Product ID:", productId);
    //console.log("🧩 Title:", productData.title);
    //console.log("💰 Prices:", JSON.stringify(productData.prices, null, 2));
    //console.log("📦 Attributes:", JSON.stringify(productData.attributes, null, 2));

    return res.status(200).json({
      success: true,
      message: "Fetched product successfully",
      //product: productData,
      raw: rawResponse,
    });

  } catch (error) {
    console.error("🔥 getProduct error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// BULK UPDATE - All products with 1.2x markup
export const updateAllProductVariants = async (req, res) => {
  try {
    const userCountry = req.body.userCountry || "US";
    const products = await Product.find({}, { product_id: 1 });
    
    if (!products || products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No products found in collection" 
      });
    }
    console.log(`📦 Found ${products.length} products to update`);
    res.status(200).json({ 
      success: true, 
      message: `Started updating ${products.length} products. This will take approximately ${Math.ceil(products.length * 3 / 60)} minutes.`,
      totalProducts: products.length
    });
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productId = product.product_id;
      try {
        console.log(`\n[${i + 1}/${products.length}] Processing product ID: ${productId}`);
        let token;
        try {
          token = await ensureAccessToken();
        } catch (err) {
          console.error(`❌ Failed to get token for product ${productId}:`, err.message);
          failCount++;
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        const client = new DropshipperClient({
          app_key: process.env.APP_KEY,
          app_secret: process.env.APP_SECRET,
          session: token,
        });
        let rawResponse;
        try {
          rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
            product_id: productId.toString(),
            ship_to_country: userCountry,
            target_currency: "USD",
            target_language: "en",
          });
        } catch (err) {
          console.error(`❌ AliExpress API failed for product ${productId}:`, err.message);
          failCount++;
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        const rawSkus = rawResponse?.data?.aliexpress_ds_product_get_response?.result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];
        
        // Map variants with 1.2x markup applied
        const variants = rawSkus.map(sku => {
          const obj = {};
          sku.ae_sku_property_dtos?.ae_sku_property_d_t_o?.forEach(p => {
            obj[p.sku_property_name] = p.sku_property_value;
          });
          
          // Get raw prices from AliExpress
          const rawDiscountedPrice = Number(sku.offer_sale_price ?? sku.sku_price ?? 0);
          const rawOriginalPrice = Number(sku.sku_price ?? rawDiscountedPrice ?? 0);
          
          // Apply 1.2x markup
          obj.price = rawDiscountedPrice ? +(rawDiscountedPrice * 1.2).toFixed(2) : 0;
          obj.originalPrice = rawOriginalPrice ? +(rawOriginalPrice * 1.2).toFixed(2) : 0;
          
          return obj;
        });
        
        console.log(`✅ Product ID: ${productId}`);
        console.log(`💰 Variants (with 1.2x markup):`, JSON.stringify(variants, null, 2));
        await Product.updateOne(
          { product_id: Number(productId) },
          { $set: { sku_variants: variants } }
        );
        successCount++;
        console.log(`✅ Updated ${successCount}/${products.length} products`);
      } catch (error) {
        console.error(`🔥 Error processing product ${productId}:`, error.message);
        failCount++;
      }
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    console.log(`\n🎉 Bulk update completed!`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${products.length}`);
  } catch (error) {
    console.error("🔥 updateAllProductVariants error:", error);
    return;
  }
};

// SINGLE PRODUCT UPDATE - For testing with 1.2x markup
export const updateSingleProductVariants = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const userCountry = req.body.userCountry || "US";

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: "Product ID is required" 
      });
    }

    console.log(`\n🔍 Fetching product ID: ${productId}`);

    // Check if product exists
    const existingProduct = await Product.findOne({ product_id: Number(productId) });
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false, 
        message: `Product ${productId} not found in database` 
      });
    }

    let token;
    try {
      token = await ensureAccessToken();
    } catch (err) {
      console.error(`❌ Failed to get token:`, err.message);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to get AliExpress token" 
      });
    }

    const client = new DropshipperClient({
      app_key: process.env.APP_KEY,
      app_secret: process.env.APP_SECRET,
      session: token,
    });

    let rawResponse;
    try {
      rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
        product_id: productId.toString(),
        ship_to_country: userCountry,
        target_currency: "USD",
        target_language: "en",
      });
    } catch (err) {
      console.error(`❌ AliExpress API failed:`, err.message);
      return res.status(500).json({ 
        success: false, 
        message: "AliExpress API failed", 
        error: err.message 
      });
    }

    const rawSkus = rawResponse?.data?.aliexpress_ds_product_get_response?.result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];

    if (!rawSkus || rawSkus.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No variants found for this product" 
      });
    }

    console.log(`\n📦 Original variants from AliExpress:`);
    rawSkus.forEach((sku, idx) => {
      console.log(`  [${idx + 1}] offer_sale_price: ${sku.offer_sale_price}, sku_price: ${sku.sku_price}`);
    });

    // Map variants with 1.2x markup applied
    const variants = rawSkus.map(sku => {
      const obj = {};
      sku.ae_sku_property_dtos?.ae_sku_property_d_t_o?.forEach(p => {
        obj[p.sku_property_name] = p.sku_property_value;
      });
      
      // Get raw prices from AliExpress
      const rawDiscountedPrice = Number(sku.offer_sale_price ?? sku.sku_price ?? 0);
      const rawOriginalPrice = Number(sku.sku_price ?? rawDiscountedPrice ?? 0);
      
      // Apply 1.2x markup
      obj.price = rawDiscountedPrice ? +(rawDiscountedPrice * 1.2).toFixed(2) : 0;
      obj.originalPrice = rawOriginalPrice ? +(rawOriginalPrice * 1.2).toFixed(2) : 0;
      
      return obj;
    });

    console.log(`\n💰 Variants after 1.2x markup:`);
    console.log(JSON.stringify(variants, null, 2));

    // Update main price to first variant's price
    const mainPrice = variants.length > 0 ? variants[0].price : 0;
    const mainOriginalPrice = variants.length > 0 ? variants[0].originalPrice : 0;

    await Product.updateOne(
      { product_id: Number(productId) },
      { 
        $set: { 
          sku_variants: variants,
          price: mainPrice,
          original_price: mainOriginalPrice
        } 
      }
    );

    console.log(`\n✅ Successfully updated product ${productId}`);
    console.log(`📝 Main price set to: ${mainPrice} (original: ${mainOriginalPrice})`);

    return res.status(200).json({ 
      success: true, 
      message: "Variants updated successfully",
      productId,
      variantsCount: variants.length,
      variants 
    });

  } catch (error) {
    console.error("🔥 updateSingleProductVariants error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

//const normalizeProductData2 = (rawResponse, productId, sellerId, sellerModel) => {
//  const result = rawResponse?.data?.aliexpress_ds_product_get_response?.result || {};
//  const baseInfo = result.ae_item_base_info_dto || {};
//  const rawSkus = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];

//  // --- Attributes ---
//  const attrMap = {};
//  rawSkus.forEach((sku) => {
//    const sku_attributes = sku.ae_sku_property_dtos?.ae_sku_property_d_t_o || [];
//    sku_attributes.forEach((prop) => {
//      const name = prop.sku_property_name;
//      const value = prop.sku_property_value;
//      if (!attrMap[name]) attrMap[name] = new Set();
//      attrMap[name].add(value);
//    });
//  });

//  const attributes = Object.fromEntries(
//    Object.entries(attrMap).map(([k, v]) => [k, [...v]])
//  );

//  // --- Images ---
//  const multimedia = result.ae_multimedia_info_dto;
//  const images = multimedia?.image_urls
//    ? multimedia.image_urls.split(";").filter(Boolean)
//    : [];

//  // --- Prices ---
//  const prices = rawSkus.map((sku) => {
//    const variantParts = sku.ae_sku_property_dtos?.ae_sku_property_d_t_o
//      ?.map((p) => `${p.sku_property_name}: ${p.sku_property_value}`)
//      .join(", ");
//    return {
//      variant: variantParts || "Default",
//      price: Number(sku.offer_sale_price || sku.sku_price || 0),
//    };
//  });

//  const basePrice = prices[0]?.price || 0;

//  return {
//    product_id: Number(baseInfo.product_id || productId),
//    sellerId,
//    sellerModel,
//    title: baseInfo.subject || baseInfo.product_title || "",
//    price: basePrice,
//    original_price: Number(rawSkus[0]?.sku_price || basePrice),
//    currency: rawSkus[0]?.currency_code || "USD",
//    attributes,
//    images,
//    prices,
//  };
//};

//export const getProductPricesOnly = async (req, res) => {
//  try {
//    let productId = req.params.productId || req.body.productId;
//    const userCountry = req.body.userCountry || "US";

//    if (!productId)
//      return res.status(400).json({ success: false, message: "Product ID is required" });

//    // Extract numeric product ID
//    const urlRegex = /(?:\/item\/)(100500\d+)(?=\.html)/;
//    const idRegex = /(100500\d+)/;
//    const match = productId.match(urlRegex) || productId.match(idRegex);
//    if (!match)
//      return res.status(400).json({ success: false, message: "Invalid product URL or ID" });
//    productId = match[1];

//    // AliExpress token
//    let token;
//    try { token = await ensureAccessToken(); }
//    catch { return res.status(500).json({ success: false, message: "Failed to get AliExpress token" }); }

//    const client = new DropshipperClient({
//      app_key: process.env.APP_KEY,
//      app_secret: process.env.APP_SECRET,
//      session: token,
//    });

//    // Fetch product
//    let rawResponse;
//    try {
//      rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
//        product_id: productId,
//        ship_to_country: userCountry,
//        target_currency: "USD",
//        target_language: "en",
//      });
//    } catch (err) {
//      return res.status(500).json({ success: false, message: "AliExpress API failed", error: err.message });
//    }

//    // Normalize only prices
//    const rawSkus = rawResponse?.data?.aliexpress_ds_product_get_response?.result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];
//    const prices = rawSkus.map((sku) => {
//      const variantParts = sku.ae_sku_property_dtos?.ae_sku_property_d_t_o
//        ?.map((p) => `${p.sku_property_name}: ${p.sku_property_value}`)
//        .join(", ");
//      return {
//        variant: variantParts || "Default",
//        price: Number(sku.offer_sale_price || sku.sku_price || 0),
//      };
//    });

//    console.log(`✅ Product ID: ${productId}`);
//    console.log(`💰 Prices:`, JSON.stringify(prices, null, 2));

//    // Update only prices in DB
//    await Product.updateOne(
//      { product_id: Number(productId) },
//      { $set: { prices } }
//    );

//    return res.status(200).json({ success: true, message: "Prices updated", prices });
//  } catch (error) {
//    console.error("🔥 getProductPricesOnly error:", error);
//    return res.status(500).json({ success: false, message: error.message });
//  }
//};


//export const getProductPricesOnly = async (req, res) => {
//  try {
//    let productId = req.params.productId || req.body.productId;
//    const userCountry = req.body.userCountry || "US";

//    if (!productId)
//      return res.status(400).json({ success: false, message: "Product ID is required" });

//    const urlRegex = /(?:\/item\/)(100500\d+)(?=\.html)/;
//    const idRegex = /(100500\d+)/;
//    const match = productId.match(urlRegex) || productId.match(idRegex);
//    if (!match)
//      return res.status(400).json({ success: false, message: "Invalid product URL or ID" });
//    productId = match[1];

//    let token;
//    try { token = await ensureAccessToken(); }
//    catch { return res.status(500).json({ success: false, message: "Failed to get AliExpress token" }); }

//    const client = new DropshipperClient({
//      app_key: process.env.APP_KEY,
//      app_secret: process.env.APP_SECRET,
//      session: token,
//    });

//    let rawResponse;
//    try {
//      rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
//        product_id: productId,
//        ship_to_country: userCountry,
//        target_currency: "USD",
//        target_language: "en",
//      });
//    } catch (err) {
//      return res.status(500).json({ success: false, message: "AliExpress API failed", error: err.message });
//    }

//    // Grab SKUs
//    const rawSkus = rawResponse?.data?.aliexpress_ds_product_get_response?.result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];

//    // Map SKUs to compact variant objects
//    const variants = rawSkus.map(sku => {
//      const obj = {};
//      sku.ae_sku_property_dtos?.ae_sku_property_d_t_o?.forEach(p => {
//        obj[p.sku_property_name] = p.sku_property_value;
//      });
//      obj.price = Number(sku.offer_sale_price || sku.sku_price || 0);
//      return obj;
//    });

//    console.log(`✅ Product ID: ${productId}`);
//    console.log(`💰 Variants:`, JSON.stringify(variants, null, 2));

//    // Update DB: keep original attributes, store variants separately
//    await Product.updateOne(
//      { product_id: Number(productId) },
//      { $set: { sku_variants: variants } }
//    );

//    return res.status(200).json({ success: true, message: "Variants updated", variants });
//  } catch (error) {
//    console.error("🔥 getProductVariantsWithPrices error:", error);
//    return res.status(500).json({ success: false, message: error.message });
//  }
//};

//export const updateAllProductVariants = async (req, res) => {
//  try {
//    const userCountry = req.body.userCountry || "US";

//    // Fetch all products from the collection
//    const products = await Product.find({}, { product_id: 1 });
    
//    if (!products || products.length === 0) {
//      return res.status(404).json({ 
//        success: false, 
//        message: "No products found in collection" 
//      });
//    }

//    console.log(`📦 Found ${products.length} products to update`);

//    // Send immediate response
//    res.status(200).json({ 
//      success: true, 
//      message: `Started updating ${products.length} products. This will take approximately ${Math.ceil(products.length * 3 / 60)} minutes.`,
//      totalProducts: products.length
//    });

//    // Process products in background
//    let successCount = 0;
//    let failCount = 0;

//    for (let i = 0; i < products.length; i++) {
//      const product = products[i];
//      const productId = product.product_id;

//      try {
//        console.log(`\n[${i + 1}/${products.length}] Processing product ID: ${productId}`);

//        // Get access token
//        let token;
//        try {
//          token = await ensureAccessToken();
//        } catch (err) {
//          console.error(`❌ Failed to get token for product ${productId}:`, err.message);
//          failCount++;
//          await new Promise(resolve => setTimeout(resolve, 3000));
//          continue;
//        }

//        const client = new DropshipperClient({
//          app_key: process.env.APP_KEY,
//          app_secret: process.env.APP_SECRET,
//          session: token,
//        });

//        // Call AliExpress API
//        let rawResponse;
//        try {
//          rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
//            product_id: productId.toString(),
//            ship_to_country: userCountry,
//            target_currency: "USD",
//            target_language: "en",
//          });
//        } catch (err) {
//          console.error(`❌ AliExpress API failed for product ${productId}:`, err.message);
//          failCount++;
//          await new Promise(resolve => setTimeout(resolve, 3000));
//          continue;
//        }

//        // Grab SKUs
//        const rawSkus = rawResponse?.data?.aliexpress_ds_product_get_response?.result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];

//        // Map SKUs to compact variant objects
//        const variants = rawSkus.map(sku => {
//          const obj = {};
//          sku.ae_sku_property_dtos?.ae_sku_property_d_t_o?.forEach(p => {
//            obj[p.sku_property_name] = p.sku_property_value;
//          });
//          obj.price = Number(sku.offer_sale_price || sku.sku_price || 0);
//          return obj;
//        });

//        console.log(`✅ Product ID: ${productId}`);
//        console.log(`💰 Variants:`, JSON.stringify(variants, null, 2));

//        // Update DB: keep original attributes, store variants separately
//        await Product.updateOne(
//          { product_id: Number(productId) },
//          { $set: { sku_variants: variants } }
//        );

//        successCount++;
//        console.log(`✅ Updated ${successCount}/${products.length} products`);

//      } catch (error) {
//        console.error(`🔥 Error processing product ${productId}:`, error.message);
//        failCount++;
//      }

//      // Wait 3 seconds before next iteration (except for last item)
//      if (i < products.length - 1) {
//        await new Promise(resolve => setTimeout(resolve, 3000));
//      }
//    }

//    console.log(`\n🎉 Bulk update completed!`);
//    console.log(`✅ Successful: ${successCount}`);
//    console.log(`❌ Failed: ${failCount}`);
//    console.log(`📊 Total: ${products.length}`);

//  } catch (error) {
//    console.error("🔥 updateAllProductVariants error:", error);
//    // Response already sent, just log the error
//    return;
//  }
//};

// Keep your original function for single product updates
//export const getProductPricesOnly = async (req, res) => {
//  try {
//    let productId = req.params.productId || req.body.productId;
//    const userCountry = req.body.userCountry || "US";

//    if (!productId)
//      return res.status(400).json({ success: false, message: "Product ID is required" });

//    const urlRegex = /(?:\/item\/)(100500\d+)(?=\.html)/;
//    const idRegex = /(100500\d+)/;
//    const match = productId.match(urlRegex) || productId.match(idRegex);
//    if (!match)
//      return res.status(400).json({ success: false, message: "Invalid product URL or ID" });
//    productId = match[1];

//    let token;
//    try { token = await ensureAccessToken(); }
//    catch { return res.status(500).json({ success: false, message: "Failed to get AliExpress token" }); }

//    const client = new DropshipperClient({
//      app_key: process.env.APP_KEY,
//      app_secret: process.env.APP_SECRET,
//      session: token,
//    });

//    let rawResponse;
//    try {
//      rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
//        product_id: productId,
//        ship_to_country: userCountry,
//        target_currency: "USD",
//        target_language: "en",
//      });
//    } catch (err) {
//      return res.status(500).json({ success: false, message: "AliExpress API failed", error: err.message });
//    }

//    // Grab SKUs
//    const rawSkus = rawResponse?.data?.aliexpress_ds_product_get_response?.result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];

//    // Map SKUs to compact variant objects
//    const variants = rawSkus.map(sku => {
//      const obj = {};
//      sku.ae_sku_property_dtos?.ae_sku_property_d_t_o?.forEach(p => {
//        obj[p.sku_property_name] = p.sku_property_value;
//      });
//      obj.price = Number(sku.offer_sale_price || sku.sku_price || 0);
//      return obj;
//    });

//    console.log(`✅ Product ID: ${productId}`);
//    console.log(`💰 Variants:`, JSON.stringify(variants, null, 2));

//    // Update DB: keep original attributes, store variants separately
//    await Product.updateOne(
//      { product_id: Number(productId) },
//      { $set: { sku_variants: variants } }
//    );

//    return res.status(200).json({ success: true, message: "Variants updated", variants });
//  } catch (error) {
//    console.error("🔥 getProductVariantsWithPrices error:", error);
//    return res.status(500).json({ success: false, message: error.message });
//  }
//};