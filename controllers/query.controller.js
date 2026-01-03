import express from 'express';
import nodemailer from 'nodemailer';
import BusinessInquiry from '../models/BusinessInquiry.js'; // Adjust path as needed
import AuctionInquiry from '../models/AuctionInquiry.js';
import salewithus from '../models/SalewithusInquiry.js';

const router = express.Router();

// Business inquiry form
router.post('/business', async (req, res) => {
  const { fullName, firstName, lastName, email, message, phone, sellerId } = req.body;

  // Determine fullName dynamically
  let Name = '';
  if (fullName) {
    Name = fullName;
  } else if (firstName && lastName) {
    Name = `${firstName} ${lastName}`;
  } else {
    return res.status(400).json({ error: 'fullName or firstName + lastName is required.' });
  }

  if (!email || !message || !phone) {
    return res.status(400).json({ error: 'Email, phone, and message are required.' });
  }

  // Save to database
  try {
    const newInquiry = new BusinessInquiry({
      fullName: Name,
      email,
      phone,
      message,
      sellerId
    });
    await newInquiry.save();
    console.log('Business inquiry saved to database');
  } catch (dbErr) {
    console.error('Error saving to database:', dbErr);
    return res.status(500).json({ error: 'Failed to save inquiry to database.' });
  }

  const htmlTemplate = `
    <div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
  <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
      
       <!-- Logo -->
          <div style="text-align:left; margin-bottom:20px;">
            <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
          </div>
          
           <!-- Heading -->
          <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
            New Business
            <span style="color:#CFA128;">Contact Message</span>
          </h2>
          
          <p style="font-size:16px; color:#fff;">You have received a new business contact message from <strong>${Name}</strong>.</p>
          
           <!-- Heading -->
          <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
            <span style="color:#CFA128;">Contact Details:</span>
          </h2>
          
          <p style="font-size:16px; color:#fff;"><strong>Name:</strong> ${Name}</p>
          <p style="font-size:16px; color:#fff;"><strong>Email:</strong> ${email}</p>
          <p style="font-size:16px; color:#fff;"><strong>Phone:</strong> ${phone}</p>
          
          <!-- Heading -->
          <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
            <span style="color:#CFA128;">Message:</span>
          </h2>
          
          <p style="font-size:16px; color:#fff; white-space: pre-wrap;">${message}</p>
          
   <!-- Divider -->
          <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
  
          <!-- Footer -->
          <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
            © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
          </p>
      
  </div>
</div>
  `;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `${Name} <${email}>`,
      to: process.env.SMTP_USER,
      subject: `Business Inquiry: ${Name}`,
      html: htmlTemplate,
      text: `Phone: ${phone}\nEmail: ${email}\nMessage:\n${message}`
    });

    res.json({ message: 'Business inquiry sent successfully.' });
  } catch (err) {
    console.error('Error sending business inquiry email:', err);
    res.status(500).json({ error: 'Failed to send business inquiry.' });
  }
});


router.post('/business-admin', async (req, res) => {
  const { fullName, firstName, lastName, email, message, phone} = req.body;

  // Determine fullName dynamically
  let Name = '';
  if (fullName) {
    Name = fullName;
  } else if (firstName && lastName) {
    Name = `${firstName} ${lastName}`;
  } else {
    return res.status(400).json({ error: 'fullName or firstName + lastName is required.' });
  }

  if (!email || !message || !phone) {
    return res.status(400).json({ error: 'Email, phone, and message are required.' });
  }

  // Save to database
  try {
    const newInquiry = new BusinessInquiry({
      fullName: Name,
      email,
      phone,
      message,
      
    });
    await newInquiry.save();
    console.log('Business inquiry saved to database');
  } catch (dbErr) {
    console.error('Error saving to database:', dbErr);
    return res.status(500).json({ error: 'Failed to save inquiry to database.' });
  }

  const htmlTemplate = `
    <div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
  <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
      
       <!-- Logo -->
          <div style="text-align:left; margin-bottom:20px;">
            <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
          </div>
          
           <!-- Heading -->
          <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
            New Business
            <span style="color:#CFA128;">Contact Message</span>
          </h2>
          
          <p style="font-size:16px; color:#fff;">You have received a new business contact message from <strong>${Name}</strong>.</p>
          
           <!-- Heading -->
          <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
            <span style="color:#CFA128;">Contact Details:</span>
          </h2>
          
          <p style="font-size:16px; color:#fff;"><strong>Name:</strong> ${Name}</p>
          <p style="font-size:16px; color:#fff;"><strong>Email:</strong> ${email}</p>
          <p style="font-size:16px; color:#fff;"><strong>Phone:</strong> ${phone}</p>
          
          <!-- Heading -->
          <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
            <span style="color:#CFA128;">Message:</span>
          </h2>
          
          <p style="font-size:16px; color:#fff; white-space: pre-wrap;">${message}</p>
          
   <!-- Divider -->
          <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
  
          <!-- Footer -->
          <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
            © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
          </p>
      
  </div>
</div>
  `;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `${Name} <${email}>`,
      to: process.env.SMTP_USER,
      subject: `Business Inquiry: ${Name}`,
      html: htmlTemplate,
      text: `Phone: ${phone}\nEmail: ${email}\nMessage:\n${message}`
    });

    res.json({ message: 'Business inquiry sent successfully.' });
  } catch (err) {
    console.error('Error sending business inquiry email:', err);
    res.status(500).json({ error: 'Failed to send business inquiry.' });
  }
});

router.post('/auction', async (req, res) => {
  const { fullName, firstName, lastName, email, message, phone } = req.body;

  // Determine fullName dynamically
  let Name = '';
  if (fullName) {
    Name = fullName;
  } else if (firstName && lastName) {
    Name = `${firstName} ${lastName}`;
  } else {
    return res.status(400).json({ error: 'fullName or firstName + lastName is required.' });
  }

  if (!email || !message || !phone) {
    return res.status(400).json({ error: 'Email, phone, and message are required.' });
  }

  // Save to database
  try {
    const newInquiry = new AuctionInquiry({
      fullName: Name,
      email,
      phone,
      message
    });
    await newInquiry.save();
    console.log('Auction inquiry saved to database');
  } catch (dbErr) {
    console.error('Error saving to database:', dbErr);
    return res.status(500).json({ error: 'Failed to save inquiry to database.' });
  }

  const htmlTemplate = `
    <div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
      <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">

        <!-- Logo -->
        <div style="text-align:left; margin-bottom:20px;">
          <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
        </div>
        
        <!-- Heading -->
        <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
          New Auction
          <span style="color:#CFA128;">Inquiry Message</span>
        </h2>
        
        <p style="font-size:16px; color:#fff;">You have received a new auction inquiry from <strong>${Name}</strong>.</p>

        <!-- Contact Details -->
        <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
          <span style="color:#CFA128;">Contact Details:</span>
        </h2>
        
        <p style="font-size:16px; color:#fff;"><strong>Name:</strong> ${Name}</p>
        <p style="font-size:16px; color:#fff;"><strong>Email:</strong> ${email}</p>
        <p style="font-size:16px; color:#fff;"><strong>Phone:</strong> ${phone}</p>

        <!-- Message -->
        <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
          <span style="color:#CFA128;">Message:</span>
        </h2>
        
        <p style="font-size:16px; color:#fff; white-space: pre-wrap;">${message}</p>

        <!-- Divider -->
        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">

        <!-- Footer -->
        <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
          © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
        </p>
      </div>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `${Name} <${email}>`,
      to: process.env.SMTP_USER,
      subject: `Auction Inquiry: ${Name}`,
      html: htmlTemplate,
      text: `Phone: ${phone}\nEmail: ${email}\nMessage:\n${message}`
    });

    res.json({ message: 'Auction inquiry sent successfully.' });
  } catch (err) {
    console.error('Error sending auction inquiry email:', err);
    res.status(500).json({ error: 'Failed to send auction inquiry.' });
  }
});

router.post('/', async (req, res) => {
  const { fullName, firstName, lastName, email, message, phone } = req.body;

  // Determine fullName dynamically
  let Name = '';
  if (fullName) {
    Name = fullName;
  } else if (firstName && lastName) {
    Name = `${firstName} ${lastName}`;
  } else {
    return res.status(400).json({ error: 'fullName or firstName + lastName is required.' });
  }

  if (!email || !message || !phone) {
    return res.status(400).json({ error: 'Email, phone, and message are required.' });
  }

  // Save to database
  try {
    const newInquiry = new salewithus({
      fullName: Name,
      email,
      phone,
      message
    });
    await newInquiry.save();
    console.log('Sale With Us inquiry saved to database');
  } catch (dbErr) {
    console.error('Error saving to database:', dbErr);
    return res.status(500).json({ error: 'Failed to save inquiry to database.' });
  }

  const htmlTemplate = `
    <div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
      <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
        <!-- Logo -->
        <div style="text-align:left; margin-bottom:20px;">
          <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
        </div>

        <!-- Heading -->
        <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
          New <span style="color:#CFA128;">Sale With Us</span> Inquiry
        </h2>
        
        <p style="font-size:16px; color:#fff;">You have received a new <strong>Sale With Us</strong> inquiry from <strong>${Name}</strong>.</p>

        <!-- Contact Details -->
        <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
          <span style="color:#CFA128;">Contact Details:</span>
        </h2>

        <p style="font-size:16px; color:#fff;"><strong>Name:</strong> ${Name}</p>
        <p style="font-size:16px; color:#fff;"><strong>Email:</strong> ${email}</p>
        <p style="font-size:16px; color:#fff;"><strong>Phone:</strong> ${phone}</p>

        <!-- Message -->
        <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:left; color:#ffffff;">
          <span style="color:#CFA128;">Message:</span>
        </h2>

        <p style="font-size:16px; color:#fff; white-space: pre-wrap;">${message}</p>

        <!-- Divider -->
        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">

        <!-- Footer -->
        <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
          © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
        </p>
      </div>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `${Name} <${email}>`,
      to: process.env.SMTP_USER,
      subject: `Sale With Us Inquiry: ${Name}`,
      html: htmlTemplate,
      text: `Phone: ${phone}\nEmail: ${email}\nMessage:\n${message}`
    });

    res.json({ message: 'Sale With Us inquiry sent successfully.' });
  } catch (err) {
    console.error('Error sending Sale With Us inquiry email:', err);
    res.status(500).json({ error: 'Failed to send Sale With Us inquiry.' });
  }
});





// Payment query form
router.post("/paymentQuery", async (req, res) => {
  const { fullName, email, message } = req.body;

  if (!fullName || !email || !message) {
    return res
      .status(400)
      .json({ error: "fullName, email, and message are required." });
  }

  const htmlTemplate = `
    <div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
      <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
        
        <!-- Logo -->
        <div style="text-align:left; margin-bottom:20px;">
          <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
        </div>
        
        <!-- Heading -->
        <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
          Payment Query
          <span style="color:#CFA128;">Message</span>
        </h2>
        
        <!-- Message Section -->
        <h2 style="margin:0 0 20px; font-size:20px; font-weight:600; text-align:left; color:#ffffff;">
          <span style="color:#CFA128;">Message:</span>
        </h2>
        <p style="font-size:16px; color:#fff; white-space: pre-wrap;">${message}</p>
        
        <!-- Divider -->
        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
        
        <!-- Contact Info -->
        <p style="font-size:16px; color:#fff;"><strong>Name:</strong> ${fullName}</p>
        <p style="font-size:16px; color:#fff;"><strong>Email:</strong> ${email}</p>
        
        <!-- Footer -->
        <p style="margin:0; font-size:14px; color:#fff; text-align:center; margin-top:30px;">
          © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
        </p>
        
      </div>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
  });

  try {
    await transporter.sendMail({
      from: `${fullName} <${email}>`,
      to: process.env.SMTP_USER,
      subject: `Payment Query: ${fullName}`,
      html: htmlTemplate,
      text: `Name: ${fullName}\nEmail: ${email}\nMessage:\n${message}`,
    });

    res.json({ message: "Message sent successfully." });
  } catch (err) {
    console.error("Error sending payment query email:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

export default router;
