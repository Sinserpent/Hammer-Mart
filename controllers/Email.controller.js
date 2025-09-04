import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { EmailTemplate, NotificationLog } from "../models/notification.model.js";

dotenv.config();

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // Use app-specific password
      }
    });
    this.adminEmail = process.env.SMTP_USER;
    this.maxRetries = 3;
  }

  // Main notification sender
  async sendNotification(eventType, recipientRole, recipientEmail, data, orderId = null, auctionId = null) {
    try {
      const template = await this.getTemplate(eventType, recipientRole);
      if (!template) {
        await this.sendErrorToAdmin(`Template not found for ${eventType} - ${recipientRole}`, { eventType, recipientRole, data });
        return false;
      }

      const processedContent = this.processTemplate(template, data);
      
      const notificationLog = new NotificationLog({
        recipient_email: recipientEmail,
        recipient_role: recipientRole,
        event_type: eventType,
        subject: processedContent.subject,
        template_used: template.template_key,
        data_payload: data,
        order_id: orderId,
        auction_id: auctionId
      });

      await notificationLog.save();
      return await this.sendEmailWithRetry(notificationLog._id, recipientEmail, processedContent);

    } catch (error) {
      console.error("Notification error:", error);
      await this.sendErrorToAdmin("Notification system error", { error: error.message, eventType, recipientRole, data });
      return false;
    }
  }

  // Handle order placed notifications
  async handleOrderPlaced(orderData, paymentStatus) {
    const results = [];
    
    // Always notify admin with full details
    results.push(await this.sendNotification(
      'order_placed', 
      'admin', 
      this.adminEmail, 
      { ...orderData, paymentStatus, needsManualProcessing: orderData.hasDropshipItems && paymentStatus === 'completed' },
      orderData.orderId
    ));

    // Notify customer
    results.push(await this.sendNotification(
      'order_placed', 
      'customer', 
      orderData.customerEmail, 
      { ...orderData, paymentStatus },
      orderData.orderId
    ));

    // Handle seller notifications based on order type
    if (orderData.inventoryItems && orderData.inventoryItems.length > 0) {
      for (const seller of orderData.sellers) {
        const role = seller.type === 'dropshipper' ? 'dropshipper' : 'seller';
        results.push(await this.sendNotification(
          'order_placed', 
          role, 
          seller.email, 
          { ...orderData, sellerSpecificItems: seller.items, paymentStatus },
          orderData.orderId
        ));
      }
    }

    return results;
  }

  // Handle payment received notifications
  async handlePaymentReceived(paymentData) {
    const results = [];
    
    // Notify admin
    results.push(await this.sendNotification(
      'payment_received', 
      'admin', 
      this.adminEmail, 
      paymentData,
      paymentData.orderId
    ));

    // Notify customer
    results.push(await this.sendNotification(
      'payment_received', 
      'customer', 
      paymentData.customerEmail, 
      paymentData,
      paymentData.orderId
    ));

    // Notify sellers only for inventory items (not dropship)
    if (paymentData.orderType === 'inventory') {
      for (const seller of paymentData.sellers) {
        results.push(await this.sendNotification(
          'payment_received', 
          'seller', 
          seller.email, 
          { ...paymentData, sellerSpecificItems: seller.items },
          paymentData.orderId
        ));
      }
    }

    return results;
  }

  // Handle auction bid notifications
  async handleAuctionBid(auctionData, newBidData, topBidders) {
    const results = [];
    
    // Notify admin
    results.push(await this.sendNotification(
      'auction_bid', 
      'admin', 
      this.adminEmail, 
      { ...auctionData, newBid: newBidData, topBidders },
      null,
      auctionData.auctionId
    ));

    // Notify top 5 bidders (excluding the new bidder)
    for (const bidder of topBidders.slice(0, 5)) {
      if (bidder.bidderId.toString() !== newBidData.bidderId.toString()) {
        results.push(await this.sendNotification(
          'auction_bid', 
          'bidder', 
          bidder.email, 
          { 
            ...auctionData, 
            newBid: newBidData, 
            yourCurrentRank: topBidders.findIndex(b => b.bidderId.toString() === bidder.bidderId.toString()) + 1 
          },
          null,
          auctionData.auctionId
        ));
      }
    }

    return results;
  }

  // Handle auction win notifications
  async handleAuctionWin(auctionData, winnerData) {
    const results = [];
    
    // Notify admin
    results.push(await this.sendNotification(
      'auction_won', 
      'admin', 
      this.adminEmail, 
      { ...auctionData, winner: winnerData },
      null,
      auctionData.auctionId
    ));

    // Notify winner
    results.push(await this.sendNotification(
      'auction_won', 
      'bidder', 
      winnerData.email, 
      { ...auctionData, winningBid: winnerData.bidAmount },
      null,
      auctionData.auctionId
    ));

    return results;
  }

  // Handle B2B quote requests
  async handleB2BQuote(quoteData) {
    const results = [];
    
    // Notify the business/seller
    results.push(await this.sendNotification(
      'b2b_quote', 
      'b2b', 
      quoteData.businessEmail, 
      quoteData
    ));

    // Notify customer with confirmation
    results.push(await this.sendNotification(
      'b2b_quote', 
      'customer', 
      quoteData.customerEmail, 
      { ...quoteData, isConfirmation: true }
    ));

    return results;
  }

  // Get template from database
  async getTemplate(eventType, role) {
    try {
      return await EmailTemplate.findOne({ 
        event_type: eventType, 
        role: role, 
        active: true 
      });
    } catch (error) {
      console.error("Template fetch error:", error);
      return null;
    }
  }

  // Process template with data
  processTemplate(template, data) {
    let subject = template.subject;
    let htmlBody = template.html_body;
    let textBody = template.text_body;

    // Replace all {{variable}} placeholders
    const replaceVariables = (text, data) => {
      return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
        const value = this.getNestedValue(data, path);
        return value !== undefined ? value : match;
      });
    };

    return {
      subject: replaceVariables(subject, data),
      html: replaceVariables(htmlBody, data),
      text: replaceVariables(textBody, data)
    };
  }

  // Helper to get nested object values (e.g., user.name)
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // Send email with retry logic
  async sendEmailWithRetry(logId, recipientEmail, content) {
    const log = await NotificationLog.findById(logId);
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.transporter.sendMail({
          from: this.adminEmail,
          to: recipientEmail,
          subject: content.subject,
          html: content.html,
          text: content.text
        });

        // Update log on success
        await NotificationLog.findByIdAndUpdate(logId, {
          status: 'sent',
          attempts: attempt,
          sent_at: new Date()
        });

        return true;

      } catch (error) {
        console.error(`Email attempt ${attempt} failed:`, error);
        
        await NotificationLog.findByIdAndUpdate(logId, {
          status: attempt === this.maxRetries ? 'failed' : 'retry',
          attempts: attempt,
          error_message: error.message
        });

        if (attempt === this.maxRetries) {
          // Send error report to admin
          await this.sendErrorToAdmin("Email delivery failed after 3 attempts", {
            recipientEmail,
            subject: content.subject,
            error: error.message,
            logId
          });
          return false;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    return false;
  }

  // Send error notifications to admin
  async sendErrorToAdmin(errorType, errorData) {
    try {
      const subject = `System Error: ${errorType}`;
      const html = `
        <h2>System Error Report</h2>
        <p><strong>Error Type:</strong> ${errorType}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <pre>${JSON.stringify(errorData, null, 2)}</pre>
      `;

      await this.transporter.sendMail({
        from: this.adminEmail,
        to: this.adminEmail,
        subject,
        html,
        text: `System Error: ${errorType}\n\n${JSON.stringify(errorData, null, 2)}`
      });

    } catch (error) {
      console.error("Failed to send error email to admin:", error);
    }
  }
}

export default new NotificationService();