import Product from '../models/productModel.js';
import { extractDataFromExcel } from '../utils/extract.js';

export const uploadProductExcel = async (req, res) => {
  try {
    let { fieldMappings } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'Excel file is required' });
    if (!fieldMappings) return res.status(400).json({ message: 'fieldMappings is required' });

    // Parse fieldMappings if it's a JSON string
    if (typeof fieldMappings === 'string') {
      try {
        fieldMappings = JSON.parse(fieldMappings);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid JSON format in fieldMappings' });
      }
    }

    const requiredFields = ['HScode', 'productCategory', 'brand', 'itemName', 'stock', 'sold', 'rate'];
    const missing = requiredFields.filter(field => !(field in fieldMappings));
    if (missing.length > 0)
      return res.status(400).json({ success: false, message: `Missing required field mappings: ${missing.join(', ')}` });

    const extractedData = extractDataFromExcel(file.buffer, fieldMappings);
    const saved = await Product.insertMany(extractedData);

    res.status(201).json({ success: true, message: `${saved.length} products saved`, data: saved });
  } catch (err) {
    console.error('[uploadProductExcel Error]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
