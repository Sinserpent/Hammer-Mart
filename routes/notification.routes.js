import express from 'express';
import { 
  orderNotificationMiddleware, 
  paymentNotificationMiddleware,
  auctionNotificationMiddleware,
  b2bNotificationMiddleware,
  customNotificationMiddleware 
} from '../middleware/notification.middleware.js';
import NotificationService from '../controllers/Email.controller.js';
import { EmailTemplate, NotificationLog } from '../models/notification.model.js';

const router = express.Router();

// Seeder endpoint

// Order routes
router.post('/orders', 
  paymentNotificationMiddleware, // This should come first to set payment status
  orderNotificationMiddleware,
  async (req, res) => {
    try {
      // Your order creation logic
      const order = await createOrder(req.body);
      
      // The middleware will automatically send notifications
      res.json({
        success: true,
        order: {
          _id: order._id,
          orderId: order.orderId,
          customerEmail: req.user.email,
          customerName: req.user.name,
          items: order.items,
          totalAmount: order.totalAmount,
          currency: order.currency,
          shippingAddress: order.shippingAddress,
          orderType: order.orderType,
          sellers: order.sellers
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Payment webhook/confirmation route
router.post('/payments/confirm',
  paymentNotificationMiddleware,
  async (req, res) => {
    try {
      // Process payment confirmation
      const paymentResult = await processPayment(req.body);
      
      res.json({
        success: true,
        paymentStatus: 'completed',
        orderId: paymentResult.orderId,
        customerEmail: paymentResult.customerEmail,
        customerName: paymentResult.customerName,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        paymentMethod: paymentResult.paymentMethod,
        transactionId: paymentResult.transactionId,
        orderType: paymentResult.orderType,
        items: paymentResult.items,
        sellers: paymentResult.sellers
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
 
// Auction routes
router.post('/auctions/:id/bid',
  auctionNotificationMiddleware,
  async (req, res) => {
    try {
      const { id: auctionId } = req.params;
      const bidResult = await placeBid(auctionId, req.body);
      
      res.json({
        success: true,
        bidPlaced: true,
        auction: {
          _id: bidResult.auction._id,
          title: bidResult.auction.title,
          currentHighestBid: bidResult.auction.currentHighestBid,
          endTime: bidResult.auction.endTime,
          productDetails: bidResult.auction.productDetails,
          topbuyers: bidResult.topbuyers // Array of top 5 buyers with email, bidAmount, buyerId
        },
        newBid: {
          buyerId: req.user._id,
          amount: req.body.bidAmount,
          createdAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Auction end (this could be triggered by a cron job)
router.post('/auctions/:id/end',
  auctionNotificationMiddleware,
  async (req, res) => {
    try {
      const { id: auctionId } = req.params;
      const endResult = await endAuction(auctionId);
      
      res.json({
        success: true,
        auctionEnded: true,
        auction: {
          _id: endResult.auction._id,
          title: endResult.auction.title,
          currentHighestBid: endResult.finalBid,
          productDetails: endResult.auction.productDetails
        },
        winner: {
          _id: endResult.winner._id,
          email: endResult.winner.email,
          name: endResult.winner.name,
          bidAmount: endResult.winner.bidAmount
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// B2B Quote routes
router.post('/quotes/request',
  b2bNotificationMiddleware,
  async (req, res) => {
    try {
      const quote = await createQuoteRequest(req.body);
      
      res.json({
        success: true,
        quoteRequest: {
          _id: quote._id,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          companyName: quote.companyName,
          businessEmail: quote.businessEmail,
          productDetails: quote.productDetails,
          quantity: quote.quantity,
          additionalRequirements: quote.additionalRequirements,
          requestedDeliveryDate: quote.requestedDeliveryDate
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Manual notification sending
router.post('/send', async (req, res) => {
  try {
    const { eventType, recipientRole, recipientEmail, data, orderId, auctionId } = req.body;
    
    const result = await NotificationService.sendNotification(
      eventType,
      recipientRole,
      recipientEmail,
      data,
      orderId,
      auctionId
    );
    
    res.json({ success: true, sent: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get notification history
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, event_type } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (event_type) query.event_type = event_type;
    
    const logs = await NotificationLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await NotificationLog.countDocuments(query);
    
    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Template management routes
router.get('/templates', async (req, res) => {
  try {
    const templates = await EmailTemplate.find({ active: true });
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Testing endpoint for individual notifications
router.post('/test/:eventType/:role', async (req, res) => {
  try {
    const { eventType, role } = req.params;
    const { email, testData } = req.body;
    
    const result = await NotificationService.sendNotification(
      eventType,
      role,
      email,
      testData || {
        orderId: 'TEST-001',
        customerName: 'Test Customer',
        customerEmail: email,
        totalAmount: 99.99,
        currency: 'USD',
        items: [{ name: 'Test Product', quantity: 1, price: 99.99 }]
      }
    );
    
    res.json({ success: true, sent: result, message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delivery update example
router.post('/orders/:orderId/delivery-complete', 
  customNotificationMiddleware('delivery_update'),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await markOrderAsDelivered(orderId);
      
      res.json({
        success: true,
        notificationData: {
          recipientRole: 'admin',
          recipientEmail: process.env.SMTP_USER,
          templateData: {
            orderId: order.orderId,
            sellerName: req.user.name,
            deliveryDate: new Date(),
            trackingNumber: req.body.trackingNumber
          },
          orderId: order._id
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;