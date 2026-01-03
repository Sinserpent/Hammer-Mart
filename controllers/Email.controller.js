
import nodemailer from "nodemailer";
import { NotificationLog } from "../models/notification.model.js";

// Templates reworked with human-readable content and correct placeholders
const templates = {
  order_placed: {
    admin: {
      subject: "New Order Received - #{{orderId}}",
      html: `
<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              New Order
              <span style="color:#CFA128;">Notification</span>
            </h2>
            
                <p style="font-size:16px; color:#fff;">Customer: <strong>{{customerName}}</strong> ({{customerEmail}})</p>
                <p style="font-size:16px; color:#fff;">Total: {{totalOrderPrice}}$</p>
                <p style="font-size:16px; color:#fff;">Items:</p>
                <ul style="font-size:16px; color:#fff;">
                    {{items}}
                </ul>
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `New order from {{customerName}} ({{customerEmail}}). Total: {{totalOrderPrice}}$.`,
    },
    buyer: {
      subject: "Your Order #{{orderId}} is Confirmed",
      html: `
<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Order
              <span style="color:#CFA128;">Confirmed</span>
            </h2>
                <p style="font-size:16px; color:#fff;">Hi {{customerName}},</p>
                <p style="font-size:16px; color:#fff;">We've received your order #{{orderId}}. Payment status: <strong>{{status}}</strong>.</p>
    <p style="font-size:16px; color:#fff;">Items:</p>
    <ul style="font-size:16px; color:#fff;">
      {{items}}
    </ul>
    <p style="font-size:16px; color:#fff;">Total: {{totalOrderPrice}}$</p>
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Hi {{customerName}}, your order #{{orderId}} has been received. Total: {{totalOrderPrice}}$.`,
    },
    seller: {
      subject: "New Order for Your Product(s)",
      html: `
<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              New
              <span style="color:#CFA128;">Order</span>
            </h2>
            <p style="font-size:16px; color:#fff;">You sold the following items:</p>
            <ul style="font-size:16px; color:#fff;">
                {{items}}
            </ul>
            <p style="font-size:16px; color:#fff;">Customer: {{customerName}} ({{customerEmail}})</p>
            <p style="font-size:16px; color:#fff;">Shipping Address: {{address}}</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `You sold items to {{customerName}}. Shipping: {{address}}`,
    },
    dropshipper: {
      subject: "Dropship Order Ready - #{{orderId}}",
      html: `
<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Dropshipping Order
              <span style="color:#CFA128;">Ready</span>
            </h2>
            <p style="font-size:16px; color:#fff;">Manual processing needed. Dropship items are ready.</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Dropship order #{{orderId}} needs processing.`,
    },
  },

  payment_confirmation: {
    admin: {
      subject: "Payment Received - Order #{{orderId}}",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Payment
              <span style="color:#CFA128;">Received</span>
            </h2>
            <p style="font-size:16px; color:#fff;">Payment confirmed for {{customerName}}. Order #{{orderId}}</p>
            <p style="font-size:16px; color:#fff;">Total: {{totalOrderPrice}}$</p>
            <p style="font-size:16px; color:#fff;">Items:</p>
            <ul style="font-size:16px; color:#fff;">
                {{items}}
            </ul>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Payment confirmed for order {{orderId}}.`,
    },
    buyer: {
      subject: "Payment Confirmation - #{{orderId}}",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Payment
              <span style="color:#CFA128;">Confirmation</span>
            </h2>
            <p style="font-size:16px; color:#fff;">Hi {{customerName}},</p>
            <p style="font-size:16px; color:#fff;">We received your payment for order #{{orderId}}. Thank you!</p>
            <p style="font-size:16px; color:#fff;">Total: {{totalOrderPrice}}$</p>
            <p style="font-size:16px; color:#fff;">Items:</p>
            <ul style="font-size:16px; color:#fff;">
                {{items}}
            </ul>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Payment received for order {{orderId}}.`, 
    },
    seller: {
      subject: "Payment Cleared for Your Order",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Payment
              <span style="color:#CFA128;">Received</span>
            </h2>
            
            <p style="font-size:16px; color:#fff;">Funds cleared for your recent sale. You may fulfill the order now.</p>
            <p style="font-size:16px; color:#fff;">Customer: {{customerName}} ({{customerEmail}})</p>
            <p style="font-size:16px; color:#fff;">Items sold:</p>
            <ul style="font-size:16px; color:#fff;">
                {{items}}
            </ul>
            <p style="font-size:16px; color:#fff;">Shipping Address: {{address}}</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Payment cleared for your items.`,
    },
  },

  auction_payment_confirmation: {
    admin: {
      subject: "Auction Payment Received - #{{auctionId}}",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Auction Payment
              <span style="color:#CFA128;">Received</span>
            </h2>
            <p style="font-size:16px; color:#fff;">Payment confirmed for auction #{{auctionId}}</p>
            <p style="font-size:16px; color:#fff;">Customer: {{customerName}} ({{customerEmail}})</p>
            <p style="font-size:16px; color:#fff;">Amount: {{amount}}$</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Auction payment confirmed for {{auctionId}}.`,
    },
    buyer: {
      subject: "Auction Payment Confirmed - #{{auctionId}}",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Auction Payment
              <span style="color:#CFA128;">Confirmed</span>
            </h2>
            <p style="font-size:16px; color:#fff;">Hi {{customerName}},</p>
            <p style="font-size:16px; color:#fff;">We received your payment for auction #{{auctionId}}. Thank you!</p>
            <p style="font-size:16px; color:#fff;">Amount: {{amount}}$</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Payment received for auction {{auctionId}}.`, 
    },
  },

  b2b_payment_confirmation: {
    admin: {
      subject: "B2B Payment Received - {{tier}} Tier",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              B2B Payment
              <span style="color:#CFA128;">Received</span>
            </h2>
            <p style="font-size:16px; color:#fff;">B2B subscription payment confirmed</p>
            <p style="font-size:16px; color:#fff;">User ID: {{userId}}</p>
            <p style="font-size:16px; color:#fff;">User Email: {{userEmail}}</p>
            <p style="font-size:16px; color:#fff;">Tier: {{tier}}</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `B2B payment confirmed for {{tier}} tier.`,
    },
    seller: {
      subject: "B2B Subscription Payment Confirmed - {{tier}} Tier",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              B2B Subscription
              <span style="color:#CFA128;">Confirmed</span>
            </h2>
            <p style="font-size:16px; color:#fff;">Congratulations! Your B2B subscription payment has been processed successfully.</p>
            <p style="font-size:16px; color:#fff;">Tier: <strong>{{tier}}</strong></p>
            <p style="font-size:16px; color:#fff;">You now have access to B2B features and can start benefiting from your subscription.</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `B2B subscription confirmed for {{tier}} tier.`, 
    },
  },

  highest_bid: {
    buyer: {
      subject: "You have bid on {{auctionName}}. Hammer Bid Mart",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Bid
              <span style="color:#CFA128;">Update</span>
            </h2>
            
            <p style="font-size:16px; color:#fff;">You have the top bid for <strong>{{auctionName}}</strong> with a bid of <strong>{{newHighestBid}}$</strong>. Stay tuned!</p>
            
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `You are the highest buyer for {{auctionName}} with a bid of {{newHighestBid}}$.`,
    },
  },

  bid_placed: {
    buyer: {
      subject: "You have been outbid!",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Bid
              <span style="color:#CFA128;">Update</span>
            </h2>
            
            <p style="font-size:16px; color:#fff;">Someone just outbid you on <strong>{{auctionName}}</strong>. New highest bid: <strong>{{newHighestBid}}$</strong> by {{newHighestBuyerName}}. Bid again!</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `You've been outbid on {{auctionName}}. New highest bid is {{newHighestBid}}$.`,
    },
  },

  auction_won: {
    admin: {
      subject: "Auction Won - {{auctionId}}",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Auction
              <span style="color:#CFA128;">Won</span>
            </h2>
            
           <p style="font-size:16px; color:#fff;">{{winner.buyerName}} won auction {{auctionName}} with bid {{winningBid}}$.</p>
           <p style="font-size:16px; color:#fff;">Auction ID:{{auctionId}}</p>
            
     <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `Auction {{auctionId}} won by {{winner.buyerName}}.`,
    },
    buyer: {
      subject: "Congratulations! You won the auction!",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
    <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
         <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
            
             <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Auction
              <span style="color:#CFA128;">Winner</span>
            </h2>
            
            <p style="font-size:16px; color:#fff;">
              You won auction {{auctionName}} with a bid of {{winningBid}}$.<br/>
              Auction ID: {{auctionId}}
            </p>

            <!-- Button -->
            <div style="text-align:center; margin:30px 0;">
              <a href="{{redirectUrl}}" target="_blank" 
                 style="background:#CFA128; color:#10273F; text-decoration:none; 
                        padding:12px 24px; border-radius:6px; font-weight:600; 
                        display:inline-block; font-size:16px;">
                View Auction Details
              </a>
            </div>
            
            <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">

            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
        
    </div>
</div>`,
      text: `You won with a bid of {{winningBid}}$. Visit: {{redirectUrl}}`,
    },
  },
};

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.adminEmail = process.env.SMTP_USER;
    this.maxRetries = 3;
  }

  async sendNotification(
    eventType,
    recipientRole,
    recipientEmail,
    data,
    orderId,
    auctionId
  ) {
    try {
      const template = this.getTemplate(eventType, recipientRole);
      if (!template) {
        await this.sendErrorToAdmin(
          `Template not found: ${eventType}/${recipientRole}, { data }`
        );
        return false;
      }
      // handle array rendering for items if needed
      if (Array.isArray(data.items)) {
        data.items = data.items
          .map(
            (i) =>
              `<li>${i.name} (${i.sku}) - Qty: ${i.amount} - $${i.unitPrice}</li>`
          )
          .join("");
      }

      const processed = this.processTemplate(template, data);

      const log = await NotificationLog.create({
        recipient_email: recipientEmail,
        recipient_role: recipientRole,
        event_type: eventType,
        subject: processed.subject,
        template_used: `${eventType}/${recipientRole}`,
        data_payload: data,
        order_id: orderId,
        auction_id: auctionId,
      });

      return await this.sendEmailWithRetry(log._id, recipientEmail, processed);
    } catch (err) {
      console.error("Notification error:", err);
      await this.sendErrorToAdmin("Notification system failure", {
        error: err.message,
        eventType,
        recipientRole,
      });
      return false;
    }
  }

  getTemplate(eventType, role) {
    return templates[eventType]?.[role] || null;
  }

  processTemplate(template, data) {
    const replaceVars = (text) =>
      text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
        const value = path
          .split(".")
          .reduce((o, k) => (o ? o[k] : undefined), data);
        return value !== undefined ? value : match;
      });
    return {
      subject: replaceVars(template.subject),
      html: replaceVars(template.html),
      text: replaceVars(template.text),
    };
  }

  async sendEmailWithRetry(logId, recipientEmail, content) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.transporter.sendMail({
          from: this.adminEmail,
          to: recipientEmail,
          subject: content.subject,
          html: content.html,
          text: content.text,
        });
        await NotificationLog.findByIdAndUpdate(logId, {
          status: "sent",
          attempts: attempt,
          sent_at: new Date(),
        });
        return true;
      } catch (err) {
        await NotificationLog.findByIdAndUpdate(logId, {
          status: attempt === this.maxRetries ? "failed" : "retry",
          attempts: attempt,
          error_message: err.message,
        });
        if (attempt === this.maxRetries) {
          await this.sendErrorToAdmin("Email delivery failed", {
            recipientEmail,
            err: err.message,
            logId,
          });
          return false;
        }
        await new Promise((res) =>
          setTimeout(res, Math.pow(2, attempt) * 1000)
        );
      }
    }
    return false;
  }

  async sendErrorToAdmin(errorType, details) {
    try {
      await this.transporter.sendMail({
        from: this.adminEmail,
        to: this.adminEmail,
        subject: `System Error: ${errorType}`,
        html: `<h2>Error</h2><pre>${JSON.stringify(details, null, 2)}</pre>`,
      });
    } catch (err) {
      console.error("Failed to notify admin:", err);
    }
  }
}

export default new NotificationService();
