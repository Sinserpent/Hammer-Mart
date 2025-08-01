// utils/validators.js

/**
 * Validate column mapping structure
 * @param {Object} columnMapping - Column mapping object
 * @returns {Object} Validation result
 */
const validateImportData = (columnMapping) => {
  const result = {
    isValid: true,
    message: ''
  };

  // Check if columnMapping is an object
  if (!columnMapping || typeof columnMapping !== 'object') {
    result.isValid = false;
    result.message = 'Column mapping must be a valid object';
    return result;
  }

  // Required fields that must be mapped
  const requiredFields = ['HScode', 'itemName'];
  const allowedFields = ['HScode','productCategory', 'brand', 'itemName','stock', 'sold' ];
  
  // Check if required fields are mapped
  const mappedFields = Object.values(columnMapping);
  const missingRequired = requiredFields.filter(field => !mappedFields.includes(field));
  
  if (missingRequired.length > 0) {
    result.isValid = false;
    result.message = `Missing required field mappings: ${missingRequired.join(', ')}`;
    return result;
  }

  // Check if all mapped fields are allowed
  const invalidFields = mappedFields.filter(field => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    result.isValid = false;
    result.message = `Invalid field mappings: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`;
    return result;
  }

  // Validate column format (A-Z, AA-ZZ, etc.)
  const columnPattern = /^[A-Z]+$/;
  const invalidColumns = Object.keys(columnMapping).filter(col => !columnPattern.test(col));
  
  if (invalidColumns.length > 0) {
    result.isValid = false;
    result.message = `Invalid column format: ${invalidColumns.join(', ')}. Use Excel column letters (A, B, C, etc.)`;
    return result;
  }

  return result;
};

/**
 * Validate product data before saving
 * @param {Object} productData - Product data object
 * @returns {Object} Validation result
 */
const validateProductData = (productData) => {
  const result = {
    isValid: true,
    message: '',
    errors: []
  };

  // Check required fields
  if (!productData.HScode || productData.HScode.toString().trim() === '') {
    result.errors.push('HScode is required');
  }

  if (!productData.itemName || productData.itemName.toString().trim() === '') {
    result.errors.push('itemName is required');
  }

  // Validate numeric fields
  if (productData.sold !== null && productData.sold !== undefined) {
    const soldValue = Number(productData.sold);
    if (isNaN(soldValue) || soldValue < 0) {
      result.errors.push('sold must be a valid non-negative number');
    }
  }

  if (productData.stock !== null && productData.stock !== undefined) {
    const stockValue = Number(productData.stock);
    if (isNaN(stockValue) || stockValue < 0) {
      result.errors.push('stock must be a valid non-negative number');
    }
  }

  // Validate string length limits
  if (productData.HScode && productData.HScode.toString().length > 5) {
    result.errors.push('HScode must be 5 characters or less');
  }

  if (productData.itemName && productData.itemName.toString().length > 200) {
    result.errors.push('itemName must be 200 characters or less');
  }

  if (productData.brand && productData.brand.toString().length > 100) {
    result.errors.push('brand must be 100 characters or less');
  }

  if (result.errors.length > 0) {
    result.isValid = false;
    result.message = result.errors.join(', ');
  }

  return result;
};

/**
 * Sanitize string input
 * @param {any} input - Input to sanitize
 * @returns {string|null} Sanitized string or null
 */
const sanitizeString = (input) => {
  if (input === null || input === undefined || input === '') {
    return null;
  }
  
  return input.toString().trim();
};

/**
 * Sanitize numeric input
 * @param {any} input - Input to sanitize
 * @returns {number|null} Sanitized number or null
 */
const sanitizeNumber = (input) => {
  if (input === null || input === undefined || input === '') {
    return null;
  }
  
  const num = Number(input);
  return isNaN(num) ? null : num;
};

export {
  validateImportData,
  validateProductData,
  sanitizeString,
  sanitizeNumber
};