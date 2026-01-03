import NotificationService from "../controllers/Email.controller.js";

// Middleware for order notifications
export const orderNotificationMiddleware = async (req, res, next) => {
  try {
    // Store original res.json
    const originalJson = res.json;
    
    res.json = function(data) {
      // Call original res.json first
      originalJson.call(this, data);
      
      // Trigger notifications asynchronously
      process.nextTick(async () => {
        try {
          if (data.success && data.order) {
            const orderData = {
              orderId: data.order._id || data.order.orderId,
              customerEmail: data.order.customerEmail || req.user?.email,
              customerName: data.order.customerName || req.user?.name,
              items: data.order.items,
              totalAmount: data.order.totalAmount,
              currency: data.order.currency || 'USD',
              shippingAddress: data.order.shippingAddress,
              hasDropshipItems: data.order.items?.some(item => item.type === 'dropship'),
              inventoryItems: data.order.items?.filter(item => item.type === 'inventory'),
              dropshipItems: data.order.items?.filter(item => item.type === 'dropship'),
              sellers: data.order.sellers || [],
              orderType: data.order.orderType
            };
            
            const paymentStatus = req.paymentStatus || 'pending'; // From payment middleware
            
            await NotificationService.handleOrderPlaced(orderData, paymentStatus);
          }
        } catch (error) {
          console.error('Order notification error:', error);
        }
      });
    };
    
    next();
  } catch (error) {
    console.error('Order notification middleware error:', error);
    next();
  }
};

// Middleware for payment notifications
export const paymentNotificationMiddleware = async (req, res, next) => {
  try {
    const originalJson = res.json;
    
    res.json = function(data) {
      originalJson.call(this, data);
      
      process.nextTick(async () => {
        try {
          if (data.success && data.paymentStatus === 'completed') {
            const paymentData = {
              orderId: data.orderId || req.body.orderId,
              customerEmail: data.customerEmail || req.user?.email,
              customerName: data.customerName || req.user?.name,
              amount: data.amount,
              currency: data.currency || 'USD',
              paymentMethod: data.paymentMethod,
              transactionId: data.transactionId,
              orderType: data.orderType,
              items: data.items,
              sellers: data.sellers || []
            };
            
            await NotificationService.handlePaymentReceived(paymentData);
            
            // Set payment status for order middleware
            req.paymentStatus = 'completed';
          }
        } catch (error) {
          console.error('Payment notification error:', error);
        }
      });
    };
    
    next();
  } catch (error) {
    console.error('Payment notification middleware error:', error);
    next();
  }
};

// Middleware for auction notifications
export const auctionNotificationMiddleware = async (req, res, next) => {
  try {
    const originalJson = res.json;
    
    res.json = function(data) {
      originalJson.call(this, data);
      
      process.nextTick(async () => {
        try {
          if (data.success) {
            // Handle new bid
            if (data.bidPlaced && data.auction) {
              const auctionData = {
                auctionId: data.auction._id,
                auctionTitle: data.auction.title,
                currentHighestBid: data.auction.currentHighestBid,
                endTime: data.auction.endTime,
                productDetails: data.auction.productDetails
              };
              
              const newBidData = {
                buyerId: data.newBid.buyerId,
                bidAmount: data.newBid.amount,
                bidTime: data.newBid.createdAt
              };
              
              // Assuming you have a method to get top buyers
              const topbuyers = data.auction.topbuyers || [];
              
              await NotificationService.handleAuctionBid(auctionData, newBidData, topbuyers);
            }
            
            // Handle auction win
            if (data.auctionEnded && data.winner) {
              const auctionData = {
                auctionId: data.auction._id,
                auctionTitle: data.auction.title,
                finalAmount: data.auction.currentHighestBid,
                productDetails: data.auction.productDetails
              };
              
              const winnerData = {
                buyerId: data.winner._id,
                email: data.winner.email,
                name: data.winner.name,
                bidAmount: data.winner.bidAmount
              };
              
              await NotificationService.handleAuctionWin(auctionData, winnerData);
            }
          }
        } catch (error) {
          console.error('Auction notification error:', error);
        }
      });
    };
    
    next();
  } catch (error) {
    console.error('Auction notification middleware error:', error);
    next();
  }
};

// Middleware for B2B quote notifications
export const b2bNotificationMiddleware = async (req, res, next) => {
  try {
    const originalJson = res.json;
    
    res.json = function(data) {
      originalJson.call(this, data);
      
      process.nextTick(async () => {
        try {
          if (data.success && data.quoteRequest) {
            const quoteData = {
              quoteId: data.quoteRequest._id,
              customerName: data.quoteRequest.customerName,
              customerEmail: data.quoteRequest.customerEmail,
              customerPhone: data.quoteRequest.customerPhone,
              companyName: data.quoteRequest.companyName,
              businessEmail: data.quoteRequest.businessEmail,
              productDetails: data.quoteRequest.productDetails,
              quantity: data.quoteRequest.quantity,
              additionalRequirements: data.quoteRequest.additionalRequirements,
              requestedDeliveryDate: data.quoteRequest.requestedDeliveryDate
            };
            
            await NotificationService.handleB2BQuote(quoteData);
          }
        } catch (error) {
          console.error('B2B notification error:', error);
        }
      });
    };
    
    next();
  } catch (error) {
    console.error('B2B notification middleware error:', error);
    next();
  }
};

// Generic notification middleware for custom events
export const customNotificationMiddleware = (eventType) => {
  return async (req, res, next) => {
    try {
      const originalJson = res.json;
      
      res.json = function(data) {
        originalJson.call(this, data);
        
        process.nextTick(async () => {
          try {
            if (data.success && data.notificationData) {
              const { recipientRole, recipientEmail, templateData, orderId, auctionId } = data.notificationData;
              
              await NotificationService.sendNotification(
                eventType,
                recipientRole,
                recipientEmail,
                templateData,
                orderId,
                auctionId
              );
            }
          } catch (error) {
            console.error(`Custom notification error (${eventType}):`, error);
          }
        });
      };
      
      next();
    } catch (error) {
      console.error(`Custom notification middleware error (${eventType}):`, error);
      next();
    }
  };
};