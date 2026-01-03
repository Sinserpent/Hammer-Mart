import Order from '../models/order.model.js';
import CartModel from '../models/cart.model.js';
import AuctionOrder from '../models/auction.order.js'; // Add this import
import { Auction } from '../models/auction.model.js';
import UserModel from '../models/user.model.js';
import { scheduleB2BVerification } from '../middleware/b2b.scheduler.js';
import NotificationService from '../controllers/Email.controller.js';

const ADMIN_EMAIL = process.env.SMTP_USER;

export const stripeWebhook = async (req, res) => {
  const event = req.body;

  console.log(`Received Stripe event: ${event.type}`);
  console.log('Event data:', event.data.object);

  // Only handle successful payments
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata;

    try {
      // Check what type of payment this is based on metadata
      if (metadata.orderId) {
        // 🛒 REGULAR ORDER PAYMENT
        await handleOrderPayment(metadata.orderId);
        console.log(`Order ${metadata.orderId} marked as paid and cart cleared`);
        
      } else if (metadata.auctionOrderId) {
        // 🔨 AUCTION PAYMENT
        await handleAuctionPayment(metadata.auctionOrderId, paymentIntent);
        console.log(`Auction Order ${metadata.auctionOrderId} payment processed`);
        
      } else {
        // 🏢 B2B ORDER PAYMENT (if you have this)
        await handleB2bPayment(metadata.userId, metadata.tier);
        console.log(`B2B Order ${metadata.b2bOrderId} marked as paid`);
        
      } 

    } catch (err) {
      console.error('Webhook processing error:', err);
      // Return 500 to force Stripe retry
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Respond 200 to acknowledge receipt
  res.json({ received: true });
};

// Helper function for regular order payments
const handleOrderPayment = async (orderId) => {
  // Update order status to 'paid'
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  await Order.findByIdAndUpdate(
    orderId,
    { status: 'paid' },
    { new: true }
  );

  // Clear user's cart
  const userId = order.userId;
  await CartModel.findOneAndUpdate(
    { userId },
    { items: [] }
  );

  // Send payment confirmation emails
  await sendOrderPaymentConfirmationEmails(order);
};

// Helper function for auction payments
const handleAuctionPayment = async (auctionOrderId, paymentIntent) => {
  const auctionOrder = await AuctionOrder.findById(auctionOrderId);
  if (!auctionOrder) throw new Error('AuctionOrder not found');

  const auction = await Auction.findById(auctionOrder.auctionId);
  if (!auction) throw new Error('Auction not found');

  // Update auction payment status
  await Auction.findByIdAndUpdate(
    auction._id,
    { paymentStatus: 'paid' },
    { new: true }
  );

  // Update auction order
  await AuctionOrder.findByIdAndUpdate(
    auctionOrderId,
    { 
      status: 'paid',
      paymentIntentId: paymentIntent.id,
      paidAt: new Date(),
      paymentAmount: paymentIntent.amount_received / 100,
    },
    { new: true }
  );

  // Send auction payment confirmation emails
  await sendAuctionPaymentConfirmationEmails(auctionOrder);
};

const handleB2bPayment = async (userId, tier) => {
  const tierMap = {
    'essential': 'tier1',   // 3 months
    'premium': 'tier2',     // 6 months
    'enterprise': 'tier3'   // 12 months
  };

  const mappedTier = tierMap[tier.toLowerCase()];
  if (!mappedTier) {
    throw new Error(`Invalid tier: ${tier}. Must be essential, premium, or enterprise`);
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { 
      subscriptionLevel: tier,
      b2bVerified: true
    },
    { new: true }
  );
  
  if (!updatedUser) throw new Error('User not found');

  // Send B2B payment confirmation emails
  await sendB2bPaymentConfirmationEmails(updatedUser, tier);

  // Schedule B2B verification expiry using Agenda
  try {
    const scheduleResult = await scheduleB2BVerification({
      userId: userId,  // Using userId instead of sellerId
      paymentSuccess: true,
      tier: mappedTier   // tier1, tier2, or tier3
    });
    
    console.log(`B2B payment processing for user: ${userId}`);
    console.log(`User ${userId} verified for B2B with tier: ${tier}`);
    console.log(`Expiry scheduled for: ${scheduleResult.expireDate}`);
    console.log(`Tiers purchased: ${scheduleResult.tiersPurchased.join(', ')}`);
    
    return {
      updatedUser,
      expiryScheduled: scheduleResult
    };
    
  } catch (scheduleError) {
    console.error('Failed to schedule B2B expiry:', scheduleError);
    // Still return success since user was updated, but log the scheduling failure
    return {
      updatedUser,
      expiryScheduleError: scheduleError.message
    };
  }
};

// Email notification functions

const sendOrderPaymentConfirmationEmails = async (order) => {
  try {
    // Get customer info
    const customer = await UserModel.findById(order.userId);
    const customerName =  customer.fullName
    
    // Prepare items data for all emails
    const formattedItems = order.items.map(item => ({
      name: item.name,
      sku: item.sku,
      amount: item.amount,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    // 1. Send to Admin - FIXED: Added missing customerEmail
    await NotificationService.sendNotification(
      "payment_confirmation",
      "admin",
      ADMIN_EMAIL,
      {
        orderId: order._id,
        customerName: customerName,
        customerEmail: order.customerEmail, // ✅ FIXED: Was missing
        totalOrderPrice: order.totalSalePrice,
        items: formattedItems,
      },
      order._id
    );

    // 2. Send to Buyer - FIXED: Added customerEmail for consistency
    await NotificationService.sendNotification(
      "payment_confirmation",
      "buyer",
      order.customerEmail,
      {
        orderId: order._id,
        customerName: customerName,
        customerEmail: order.customerEmail, // ✅ FIXED: Added for consistency
        totalOrderPrice: order.totalSalePrice,
        items: formattedItems,
      },
      order._id
    );

    // 3. Send to each Seller (group items by seller)
    const sellerGroups = {};
    
    order.items.forEach(item => {
      if (!sellerGroups[item.sellerId]) {
        sellerGroups[item.sellerId] = {
          sellerEmail: item.sellerEmail,
          sellerName: item.sellerName,
          items: []
        };
      }
      sellerGroups[item.sellerId].items.push({
        name: item.name,
        sku: item.sku,
        amount: item.amount,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      });
    });

    // Send email to each seller with their specific items
    for (const [sellerId, sellerData] of Object.entries(sellerGroups)) {
      await NotificationService.sendNotification(
        "payment_confirmation",
        "seller",
        sellerData.sellerEmail,
        {
          orderId: order._id,
          customerName: customerName,
          customerEmail: order.customerEmail,
          items: sellerData.items,
          address: getOrderAddress(order) // ✅ FIXED: Better address handling
        },
        order._id
      );
    }

    console.log(`Payment confirmation emails sent for order ${order._id}`);

  } catch (error) {
    console.error('Failed to send order payment confirmation emails:', error);
  }
};

// Helper function for better address handling
const getOrderAddress = (order) => {
  if (order.shippingAddress) {
    if (typeof order.shippingAddress === 'string') {
      return order.shippingAddress;
    }
    if (typeof order.shippingAddress === 'object') {
      const addr = order.shippingAddress;
      return `${addr.street || ''} ${addr.city || ''} ${addr.state || ''} ${addr.zipCode || ''}`.trim() || 'Address not provided';
    }
  }
  return 'Address not provided';
};

const sendAuctionPaymentConfirmationEmails = async (auctionOrder) => {
  try {
    // 1. Send to Admin
    await NotificationService.sendNotification(
      "auction_payment_confirmation",
      "admin",
      ADMIN_EMAIL,
      {
        auctionId: auctionOrder.auctionId,
        customerName: auctionOrder.customerName,
        customerEmail: auctionOrder.customerEmail,
        amount: auctionOrder.amount,
      },
      null,
      auctionOrder.auctionId
    );

    // 2. Send to Buyer
    await NotificationService.sendNotification(
      "auction_payment_confirmation",
      "buyer",
      auctionOrder.customerEmail,
      {
        auctionId: auctionOrder.auctionId,
        customerName: auctionOrder.customerName,
        amount: auctionOrder.amount,
      },
      null,
      auctionOrder.auctionId
    );

    console.log(`Auction payment confirmation emails sent for auction ${auctionOrder.auctionId}`);

  } catch (error) {
    console.error('Failed to send auction payment confirmation emails:', error);
  }
};

const sendB2bPaymentConfirmationEmails = async (user, tier) => {
  try {
    // Get user name for better personalization
    const userName = user.fullName
    
    // 1. Send to Admin - FIXED: Added userName for better context
    await NotificationService.sendNotification(
      "b2b_payment_confirmation",
      "admin",
      ADMIN_EMAIL,
      {
        userId: user._id,
        userEmail: user.businessEmail,
        userName: userName, // ✅ FIXED: Added for better admin context
        tier: tier,
      }
    );

    // 2. Send to User/Buyer - FIXED: Added userName for personalization
    await NotificationService.sendNotification(
      "b2b_payment_confirmation",
      "seller",
      user.businessEmail,
      {
        userName: userName, // ✅ FIXED: Added for personalization
        tier: tier,
      }
    );

    console.log(`B2B payment confirmation emails sent for user ${user._id} - ${tier} tier`);

  } catch (error) {
    console.error('Failed to send B2B payment confirmation emails:', error);
  }
}; 

// Export the helper functions if needed elsewhere
export { 
  handleOrderPayment, 
  handleAuctionPayment, 
  handleB2bPayment,
  sendOrderPaymentConfirmationEmails,
  sendAuctionPaymentConfirmationEmails,
  sendB2bPaymentConfirmationEmails
};