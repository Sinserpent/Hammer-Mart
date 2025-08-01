// services/excelService.js
import XLSX from 'xlsx';

/**
 * Process Excel file and extract data based on column mapping
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {Object} columnMapping - JSON mapping of columns (e.g., {A: 'HScode', B: 'brand', ...})
 * @returns {Array} Array of product objects
 */
const processExcelFile = async (fileBuffer, columnMapping) => {
  try {
    // Read the Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use array of arrays format
      defval: null // Default value for empty cells
    });
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must contain at least a header row and one data row');
    }
    
    // Process data starting from row 2 (skip header)
    const processedData = [];
    
    for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex];
      const productData = {};
      
      // Map columns based on the provided mapping
      Object.entries(columnMapping).forEach(([column, fieldName]) => {
        const columnIndex = columnLetterToIndex(column);
        const cellValue = row[columnIndex];
        
        // Set value or null if empty
        productData[fieldName] = cellValue !== undefined && cellValue !== '' ? cellValue : null;
      });
      
      // Only add if we have some data
      if (Object.values(productData).some(value => value !== null)) {
        processedData.push(productData);
      }
    }
    
    return processedData;
    
  } catch (error) {
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
};

/**
 * Convert Excel column letter to index (A=0, B=1, etc.)
 * @param {string} column - Column letter (e.g., 'A', 'B', 'AA')
 * @returns {number} Column index
 */
const columnLetterToIndex = (column) => {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index = index * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return index - 1;
};

/**
 * Get column range from Excel sheet
 * @param {Object} worksheet - XLSX worksheet object
 * @returns {Object} Range information
 */
const getSheetRange = (worksheet) => {
  return XLSX.utils.decode_range(worksheet['!ref']);
};

export {
  processExcelFile,
  columnLetterToIndex,
  getSheetRange
};