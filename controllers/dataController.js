import Sale from '../models/salesModel.js';
import Product from '../models/productModel.js';

const fetchData = async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || !req.body.masterQuery) {
        return res.status(400).json({ message: 'Invalid JSON payload. Expected a masterQuery' });
    }

    const mQ = req.body.masterQuery;

    const buildDateRangeQuery = (dateFrom, dateTo) => {
        const dateQuery = {};
        if (dateFrom) {
            dateQuery.$gte = new Date(dateFrom);
        }
        if (dateTo) {
            dateQuery.$lte = new Date(dateTo);  
        }
        return Object.keys(dateQuery).length > 0 ? dateQuery : null;
    };
    
    const productSpecificQuery = {};
    if (mQ.category) productSpecificQuery.productCategory = mQ.category; 
    if (mQ.packing) productSpecificQuery.packing = mQ.packing; 
    if (mQ.brands) productSpecificQuery.brand = mQ.brands;            
    
    const saleSpecificQuery = {};
    if (mQ.products) saleSpecificQuery.itemName = mQ.products; 
    if (mQ.selectCounter) saleSpecificQuery.counter = mQ.selectCounter; 
    if (mQ.customers) saleSpecificQuery.customerType = mQ.customers; 
    if (mQ.saleman) saleSpecificQuery.saleman = mQ.saleman;    
    if (mQ.transportation) saleSpecificQuery.transportation = mQ.transportation;
    if (mQ.locations) saleSpecificQuery.itemLocation = mQ.locations; 
    if (mQ.saleType) saleSpecificQuery.saleType = mQ.saleType;
    if (mQ.saleMethod) saleSpecificQuery.saleMethod = mQ.saleMethod;

    const dateRange = buildDateRangeQuery(mQ.dateFrom, mQ.dateTo);

    if (dateRange) {
        saleSpecificQuery.createdAt = dateRange; 
        productSpecificQuery.createdAt = dateRange; 
    }

    try {
        const [products, sales] = await Promise.all([ 
            Product.find(productSpecificQuery).lean(),
            Sale.find(saleSpecificQuery).lean(),
        ]);

        const responseData = {};
        if (products.length > 0) responseData.products = products;
        if (sales.length > 0) responseData.sales = sales; 
        if (Object.keys(responseData).length === 0) {
            return res.status(200).json({ message: 'No data found for the given filters.' });
        }

        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching data, you really messed up this time:', error); 
        res.status(500).json({ message: 'Internal server error.' });
    }
};

export {fetchData} ;