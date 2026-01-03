import { 
  getProduct,  
  getProductAttributes, 
  deleteProduct, 
  getUserProducts,
  updateProductPrice,
  getAllProducts,
  getProduct2
  
} from '../controllers/aliexpress.controller.js';
import express from 'express';

const router = express.Router();

router.get('/getAllProducts', getAllProducts)

// Fetch + save product into DB
router.get('/get-info', async (req, res) => {
  await getUserProducts(req, res); // pass the actual req & res
});

router.post('/fetch-product', async (req, res) => {
  await getProduct(req, res); // pass the actual req & res
});


// Get attributes directly from Product doc
router.get('/product/:productId/attributes', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await getProductAttributes(productId, req.seller._id);
    res.json(result);
  } catch (error) {
    console.error('Error in get product attributes:', error);
    res.status(500).json({ success: "lol", message: error.message || 'Internal server error' });
  }
});

router.put('/update-product/:id', updateProductPrice);// Delete product

router.delete('/delete-product/:id', async (req, res) => { 
  try {
    const { id } = req.params; // get from URL
    if (!id) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const result = await deleteProduct(id, req); // pass req for seller info
    const status = result.success ? 200 : 404;
    res.status(status).json(result);
  } catch (error) {
    console.error('Error in delete product:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }   
});

//router.post('/fetch-product-prices', async (req, res) => {
//  await getProductPricesOnly(req, res); // pass the actual req & res
//});

//router.post('/update-all-variants', async (req, res) => {
//  await updateAllProductVariants(req, res); // pass the actual req & res
//});

// Health check

//router.post('/fetch2', async (req, res) => {
//  await updateAllProductVariants(req, res); // pass the actual req & res
//});

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Dropship API is healthy', timestamp: new Date().toISOString() });
});


export default router;
