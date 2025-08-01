// controllers/importController.js
import { processExcelFile } from '../utils/extractService.js';
import { createProduct, findProductByHSCode } from '../utils/exProductModel.js';
import { validateImportData } from '../utils/validators.js';

const importExcelData = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No Excel file provided'
      });
    }

    // Check if column mapping JSON was provided
    if (!req.body.columnMapping) {
      return res.status(400).json({
        success: false,
        message: 'Column mapping JSON is required'
      });
    }

    let columnMapping;
    try {
      columnMapping = JSON.parse(req.body.columnMapping);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON format for column mapping'
      });
    }

    // Validate column mapping structure
    const validationResult = validateImportData(columnMapping);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    // Process the Excel file
    const excelData = await processExcelFile(req.file.buffer, columnMapping);

    // Import data to database
    const importResults = {
      total: excelData.length,
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (let i = 0; i < excelData.length; i++) {
      const rowData = excelData[i];
      
      try {
        // Skip if missing required fields (HScode or itemName)
        if (!rowData.HScode || !rowData.itemName) {
          importResults.skipped++;
          importResults.errors.push({
            row: i + 2, // +2 because Excel starts at 1 and we skip header
            message: 'Missing required fields (HScode or itemName)'
          });
          continue;
        }

        // Check if product already exists
        const existingProduct = await findProductByHSCode(rowData.HScode);
        if (existingProduct) {
          importResults.skipped++;
          importResults.errors.push({
            row: i + 2,
            message: `Product with HScode ${rowData.HScode} already exists`
          });
          continue;
        }

        // Create the product
        await createProduct(rowData);
        importResults.imported++;

      } catch (error) {
        importResults.errors.push({
          row: i + 2,
          message: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Import completed',
      results: importResults
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import Excel data',
      error: error.message
    });
  }
};

export { importExcelData };