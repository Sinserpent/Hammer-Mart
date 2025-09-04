import { DropshipperClient } from "ae_sdk";
import { ensureAccessToken } from "./token.controller.js";
import dotenv from "dotenv";
import Product from "../models/dropship.model.js";

dotenv.config();

export const getProduct = async (productId, userCountry = "US") => {
  const token = await ensureAccessToken();
  const client = new DropshipperClient({
    app_key: process.env.APP_KEY,
    app_secret: process.env.APP_SECRET,
    session: token
  });

  // Call AliExpress API
  const rawResponse = await client.callAPIDirectly("aliexpress.ds.product.get", {
    product_id: productId,
    ship_to_country: userCountry,
    target_currency: "USD",
    target_language: "en"
  });

  const result = rawResponse?.data?.aliexpress_ds_product_get_response?.result || {};

  // Helper function to safely parse numbers
  const safeNumber = (val, defaultValue = 0) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const parsed = parseFloat(val.replace(/[^\d.]/g, ""));
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // Helper function to safely parse integers
  const safeInt = (val, defaultValue = 0) => {
    if (typeof val === "number") return Math.floor(val);
    if (typeof val === "string") {
      const parsed = parseInt(val.replace(/[^\d]/g, ""), 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // Normalize SKU variants
  const rawSkus = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];
  const sku_variants = rawSkus.map(sku => ({
    sku_id: sku.id || sku.sku_id || "",
    price: safeNumber(sku.offer_sale_price),
    original_price: safeNumber(sku.sku_price),
    stock: safeInt(sku.sku_available_stock)
  }));

  // Process attributes to simple key-value object
  const rawAttributes = result.ae_item_properties?.ae_item_property || [];
  const attributes = {};
  rawAttributes.forEach(attr => {
    if (attr.attr_name && attr.attr_value) {
      attributes[attr.attr_name] = attr.attr_value;
    }
  });

  // Extract base info
  const baseInfo = result.ae_item_base_info_dto || {};
  
  // Parse sales count (handle "4000+" format)
  const salesCountStr = baseInfo.sales_count || "0";
  const sales_count = typeof salesCountStr === "string" 
    ? safeInt(salesCountStr.replace(/\D/g, ""))
    : safeInt(salesCountStr);

  // Build Product document
  const productData = {
    product_id: safeInt(baseInfo.product_id || productId),
    title: baseInfo.subject || "",
    price: sku_variants[0]?.price || 0,
    original_price: sku_variants[0]?.original_price || 0,
    currency: rawSkus[0]?.currency_code || "USD",
    stock: sku_variants.reduce((total, sku) => total + sku.stock, 0),
    images: result.ae_multimedia_info_dto?.image_urls?.split(";").filter(Boolean) || [],
    videos: result.ae_multimedia_info_dto?.ae_video_dtos?.ae_video_d_t_o?.map(v => v.media_url).filter(Boolean) || [],
    category_id: safeInt(baseInfo.category_id),
    rating: safeNumber(baseInfo.avg_evaluation_rating),
    reviews_count: safeInt(baseInfo.evaluation_count),
    sales_count,
    sku_variants,
    attributes,
    logistics: {
      delivery_time: safeInt(result.logistics_info_dto?.delivery_time),
      ship_to_country: result.logistics_info_dto?.ship_to_country || userCountry
    },
    package_info: {
      package_width: safeNumber(result.package_info_dto?.package_width),
      package_height: safeNumber(result.package_info_dto?.package_height),
      package_length: safeNumber(result.package_info_dto?.package_length),
      gross_weight: String(result.package_info_dto?.gross_weight || "0"),
      package_type: Boolean(result.package_info_dto?.package_type),
      product_unit: safeInt(result.package_info_dto?.product_unit)
    }
  };

  // Save to database using upsert to handle duplicates
  const productDoc = await Product.findOneAndUpdate(
    { product_id: productData.product_id },
    productData,
    { upsert: true, new: true, runValidators: true }
  );

  return {
    formatted: productDoc,
    raw: rawResponse
  };
};