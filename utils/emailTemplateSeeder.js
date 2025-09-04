import { EmailTemplate } from "../models/notification.model.js";

export const seedEmailTemplates = async () => {
  const templates = [
    // ORDER PLACED TEMPLATES
    {
      template_key: "order_placed_admin",
      subject: "New Order Placed - {{orderId}} - Action Required",
      html_body: `
        <h2>New Order Received - Action Required</h2>
        <div style="background: #f9f9f9; padding: 15px; margin: 10px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Customer:</strong> {{customerName}} ({{customerEmail}})</p>
          <p><strong>Total Amount:</strong> {{currency}} {{totalAmount}}</p>
          <p><strong>Payment Status:</strong> {{paymentStatus}}</p>
          <p><strong>Order Type:</strong> {{orderType}}</p>
        </div>
        
        {{#if needsManualProcessing}}
        <div style="background: #fff3cd; padding: 15px; margin: 10px 0; border: 1px solid #ffeaa7;">
          <h3>⚠️ MANUAL PROCESSING REQUIRED</h3>
          <p>This order contains dropship items and payment has been completed. Please process the order manually using the details below.</p>
        </div>
        {{/if}}
        
        <h3>Items Ordered:</h3>
        {{#each items}}
        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
          <p><strong>{{name}}</strong></p>
          <p>Quantity: {{quantity}} | Price: {{currency}} {{price}}</p>
          <p>Type: {{type}}</p>
          {{#if dropshipDetails}}
          <p>AliExpress Product ID: {{dropshipDetails.productId}}</p>
          <p>SKU: {{dropshipDetails.sku}}</p>
          {{/if}}
        </div>
        {{/each}}
        
        <h3>Shipping Address:</h3>
        <div style="background: #e8f5e8; padding: 10px;">
          <p>{{shippingAddress.fullName}}</p>
          <p>{{shippingAddress.address1}}</p>
          {{#if shippingAddress.address2}}<p>{{shippingAddress.address2}}</p>{{/if}}
          <p>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}</p>
          <p>{{shippingAddress.country}}</p>
          <p>Phone: {{shippingAddress.phone}}</p>
        </div>
      `,
      text_body: `New Order Received - {{orderId}}\n\nCustomer: {{customerName}} ({{customerEmail}})\nAmount: {{currency}} {{totalAmount}}\nPayment: {{paymentStatus}}\n\nShipping Address:\n{{shippingAddress.fullName}}\n{{shippingAddress.address1}}\n{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}\n{{shippingAddress.country}}\n\nItems:\n{{#each items}}{{name}} - Qty: {{quantity}} - {{currency}} {{price}}\n{{/each}}`,
      role: "admin",
      event_type: "order_placed"
    },
    
    {
      template_key: "order_placed_customer",
      subject: "Order Confirmation - {{orderId}}",
      html_body: `
        <h2>Thank you for your order!</h2>
        <p>Hi {{customerName}},</p>
        <p>We've received your order and {{#if paymentStatus === 'completed'}}payment has been processed{{else}}are processing your payment{{/if}}.</p>
        
        <div style="background: #f0f8ff; padding: 15px; margin: 10px 0;">
          <h3>Order Summary:</h3>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Total Amount:</strong> {{currency}} {{totalAmount}}</p>
          <p><strong>Payment Status:</strong> {{paymentStatus}}</p>
        </div>
        
        <h3>Items Ordered:</h3>
        {{#each items}}
        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
          <p><strong>{{name}}</strong></p>
          <p>Quantity: {{quantity}} | Price: {{currency}} {{price}}</p>
        </div>
        {{/each}}
        
        <p>We'll send you updates as your order is processed and shipped.</p>
        <p>Thank you for shopping with us!</p>
      `,
      text_body: `Thank you for your order!\n\nOrder ID: {{orderId}}\nTotal: {{currency}} {{totalAmount}}\nPayment: {{paymentStatus}}\n\nItems:\n{{#each items}}{{name}} - Qty: {{quantity}} - {{currency}} {{price}}\n{{/each}}\n\nWe'll update you as your order progresses.`,
      role: "customer",
      event_type: "order_placed"
    },
    
    {
      template_key: "order_placed_seller",
      subject: "New Order to Fulfill - {{orderId}}",
      html_body: `
        <h2>New Order to Process</h2>
        <p>You have a new order to fulfill.</p>
        
        <div style="background: #e8f5e8; padding: 15px; margin: 10px 0;">
          <h3>Order Information:</h3>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Payment Status:</strong> {{paymentStatus}}</p>
          {{#if paymentStatus === 'completed'}}
          <p style="color: green;">✅ Payment confirmed - Please ship items</p>
          {{/if}}
        </div>
        
        <h3>Items to Ship:</h3>
        {{#each sellerSpecificItems}}
        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0;">
          <p><strong>{{name}}</strong></p>
          <p>Quantity: {{quantity}}</p>
          <p>SKU: {{sku}}</p>
        </div>
        {{/each}}
        
        <h3>Ship to:</h3>
        <div style="background: #f9f9f9; padding: 10px;">
          <p>{{shippingAddress.fullName}}</p>
          <p>{{shippingAddress.address1}}</p>
          <p>{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}</p>
          <p>{{shippingAddress.country}}</p>
          <p>Phone: {{shippingAddress.phone}}</p>
        </div>
        
        <p>Please update the order status once shipped and provide tracking information.</p>
      `,
      text_body: `New Order to Fulfill - {{orderId}}\n\nPayment: {{paymentStatus}}\n\nItems:\n{{#each sellerSpecificItems}}{{name}} - Qty: {{quantity}}\n{{/each}}\n\nShip to:\n{{shippingAddress.fullName}}\n{{shippingAddress.address1}}\n{{shippingAddress.city}}, {{shippingAddress.state}} {{shippingAddress.zipCode}}`,
      role: "seller",
      event_type: "order_placed"
    },
    
    // PAYMENT RECEIVED TEMPLATES
    {
      template_key: "payment_received_admin",
      subject: "Payment Received - {{orderId}} - {{currency}} {{amount}}",
      html_body: `
        <h2>Payment Received</h2>
        <div style="background: #d4edda; padding: 15px; margin: 10px 0; border: 1px solid #c3e6cb;">
          <h3>Payment Details:</h3>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Amount:</strong> {{currency}} {{amount}}</p>
          <p><strong>Customer:</strong> {{customerName}} ({{customerEmail}})</p>
          <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
          <p><strong>Order Type:</strong> {{orderType}}</p>
        </div>
        
        {{#if orderType === 'dropship'}}
        <div style="background: #fff3cd; padding: 15px; margin: 10px 0;">
          <h3>Action Required:</h3>
          <p>This is a dropship order. Please place the order on AliExpress using the provided details.</p>
        </div>
        {{/if}}
        
        <h3>Items:</h3>
        {{#each items}}
        <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
          <p><strong>{{name}}</strong> - Qty: {{quantity}} - {{currency}} {{price}}</p>
        </div>
        {{/each}}
      `,
      text_body: `Payment Received - {{orderId}}\n\nAmount: {{currency}} {{amount}}\nCustomer: {{customerName}}\nTransaction ID: {{transactionId}}\nOrder Type: {{orderType}}\n\nItems:\n{{#each items}}{{name}} - Qty: {{quantity}} - {{currency}} {{price}}\n{{/each}}`,
      role: "admin",
      event_type: "payment_received"
    },
    
    {
      template_key: "payment_received_customer",
      subject: "Payment Confirmed - {{orderId}}",
      html_body: `
        <h2>Payment Confirmed!</h2>
        <p>Hi {{customerName}},</p>
        <p>Your payment has been successfully processed.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 10px 0; border: 1px solid #c3e6cb;">
          <h3>Payment Details:</h3>
          <p><strong>Order ID:</strong> {{orderId}}</p>
          <p><strong>Amount Paid:</strong> {{currency}} {{amount}}</p>
          <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        </div>
        
        <p>Your order is now being processed and will be shipped soon. We'll send you tracking information once your items are dispatched.</p>
        <p>Thank you for your business!</p>
      `,
      text_body: `Payment Confirmed - {{orderId}}\n\nHi {{customerName}},\n\nYour payment of {{currency}} {{amount}} has been processed.\nTransaction ID: {{transactionId}}\n\nYour order is being processed and will ship soon.\n\nThank you!`,
      role: "customer",
      event_type: "payment_received"
    },
    
    // AUCTION TEMPLATES
    {
      template_key: "auction_bid_admin",
      subject: "New Bid Placed - {{auctionTitle}}",
      html_body: `
        <h2>New Bid Placed</h2>
        <div style="background: #f0f8ff; padding: 15px; margin: 10px 0;">
          <h3>Auction Details:</h3>
          <p><strong>Auction:</strong> {{auctionTitle}}</p>
          <p><strong>New Bid:</strong> {{currency}} {{newBid.bidAmount}}</p>
          <p><strong>Current Highest:</strong> {{currency}} {{currentHighestBid}}</p>
          <p><strong>Ends:</strong> {{endTime}}</p>
        </div>
        
        <h3>Top 5 Bidders:</h3>
        {{#each topBidders}}
        <p>{{@index + 1}}. {{email}} - {{currency}} {{bidAmount}}</p>
        {{/each}}
      `,
      text_body: `New Bid - {{auctionTitle}}\n\nNew Bid: {{currency}} {{newBid.bidAmount}}\nCurrent Highest: {{currency}} {{currentHighestBid}}\nEnds: {{endTime}}`,
      role: "admin",
      event_type: "auction_bid"
    },
    
    {
      template_key: "auction_bid_bidder",
      subject: "New Higher Bid Placed - {{auctionTitle}}",
      html_body: `
        <h2>Someone Outbid You!</h2>
        <p>A new higher bid has been placed on the auction you're participating in.</p>
        
        <div style="background: #fff3cd; padding: 15px; margin: 10px 0;">
          <h3>Auction: {{auctionTitle}}</h3>
          <p><strong>New Highest Bid:</strong> {{currency}} {{newBid.bidAmount}}</p>
          <p><strong>Your Current Rank:</strong> #{{yourCurrentRank}}</p>
          <p><strong>Auction Ends:</strong> {{endTime}}</p>
        </div>
        
        <p>Place a higher bid to stay in the running!</p>
      `,
      text_body: `New Higher Bid - {{auctionTitle}}\n\nNew Highest: {{currency}} {{newBid.bidAmount}}\nYour Rank: #{{yourCurrentRank}}\nEnds: {{endTime}}\n\nPlace a higher bid to stay in the running!`,
      role: "bidder",
      event_type: "auction_bid"
    },
    
    {
      template_key: "auction_won_admin",
      subject: "Auction Ended - {{auctionTitle}} - Winner: {{winner.email}}",
      html_body: `
        <h2>Auction Ended</h2>
        <div style="background: #d4edda; padding: 15px; margin: 10px 0;">
          <h3>Auction Results:</h3>
          <p><strong>Auction:</strong> {{auctionTitle}}</p>
          <p><strong>Winning Bid:</strong> {{currency}} {{finalAmount}}</p>
          <p><strong>Winner:</strong> {{winner.name}} ({{winner.email}})</p>
        </div>
        
        <p>Please contact the winner to arrange payment and delivery.</p>
      `,
      text_body: `Auction Ended - {{auctionTitle}}\n\nWinner: {{winner.name}} ({{winner.email}})\nWinning Bid: {{currency}} {{finalAmount}}\n\nContact winner to arrange payment.`,
      role: "admin",
      event_type: "auction_won"
    },
    
    {
      template_key: "auction_won_bidder",
      subject: "Congratulations! You Won - {{auctionTitle}}",
      html_body: `
        <h1>Congratulations! You Won!</h1>
        <p>You are the winning bidder for this auction.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 10px 0; border: 1px solid #c3e6cb;">
          <h3>Your Winning Details:</h3>
          <p><strong>Auction:</strong> {{auctionTitle}}</p>
          <p><strong>Your Winning Bid:</strong> {{currency}} {{winningBid}}</p>
        </div>
        
        <p>We will contact you shortly with payment instructions and delivery details.</p>
        <p>Thank you for participating!</p>
      `,
      text_body: `Congratulations! You Won!\n\nAuction: {{auctionTitle}}\nYour Winning Bid: {{currency}} {{winningBid}}\n\nWe'll contact you with payment instructions shortly.`,
      role: "bidder",
      event_type: "auction_won"
    },
    
    // B2B TEMPLATES
    {
      template_key: "b2b_quote_business",
      subject: "New Quote Request - {{productDetails.name}}",
      html_body: `
        <h2>New B2B Quote Request</h2>
        <div style="background: #f0f8ff; padding: 15px; margin: 10px 0;">
          <h3>Customer Information:</h3>
          <p><strong>Name:</strong> {{customerName}}</p>
          <p><strong>Company:</strong> {{companyName}}</p>
          <p><strong>Email:</strong> {{customerEmail}}</p>
          <p><strong>Phone:</strong> {{customerPhone}}</p>
        </div>
        
        <h3>Quote Request Details:</h3>
        <div style="background: #f9f9f9; padding: 15px; margin: 10px 0;">
          <p><strong>Product:</strong> {{productDetails.name}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Requested Delivery:</strong> {{requestedDeliveryDate}}</p>
          {{#if additionalRequirements}}
          <p><strong>Additional Requirements:</strong></p>
          <p>{{additionalRequirements}}</p>
          {{/if}}
        </div>
        
        <p>Please respond with your quote directly to the customer.</p>
      `,
      text_body: `New B2B Quote Request\n\nCustomer: {{customerName}} ({{companyName}})\nEmail: {{customerEmail}}\nPhone: {{customerPhone}}\n\nProduct: {{productDetails.name}}\nQuantity: {{quantity}}\nDelivery: {{requestedDeliveryDate}}\n\nRequirements: {{additionalRequirements}}`,
      role: "b2b",
      event_type: "b2b_quote"
    },
    
    {
      template_key: "b2b_quote_customer",
      subject: "Quote Request Submitted - {{productDetails.name}}",
      html_body: `
        <h2>Quote Request Submitted</h2>
        <p>Hi {{customerName}},</p>
        <p>Your quote request has been submitted successfully.</p>
        
        <div style="background: #e8f5e8; padding: 15px; margin: 10px 0;">
          <h3>Your Request:</h3>
          <p><strong>Product:</strong> {{productDetails.name}}</p>
          <p><strong>Quantity:</strong> {{quantity}}</p>
          <p><strong>Requested Delivery:</strong> {{requestedDeliveryDate}}</p>
        </div>
        
        <p>The business will review your request and respond with a quote shortly.</p>
        <p>Thank you for your interest!</p>
      `,
      text_body: `Quote Request Submitted\n\nProduct: {{productDetails.name}}\nQuantity: {{quantity}}\nDelivery: {{requestedDeliveryDate}}\n\nThe business will respond with a quote soon.`,
      role: "customer",
      event_type: "b2b_quote"
    }
  ];

  try {
    for (const template of templates) {
      await EmailTemplate.findOneAndUpdate(
        { template_key: template.template_key },
        template,
        { upsert: true, new: true }
      );
    }
    console.log("Email templates seeded successfully!");
  } catch (error) {
    console.error("Error seeding email templates:", error);
  }
};