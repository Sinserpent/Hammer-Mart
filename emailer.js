import nodemailer from "nodemailer";
import mongoose from "mongoose";
import User from "./models/bidder.model.js";
import Seller from "./models/seller.model.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- Admin: stays as is ---
export async function messageToAdmin(subject, message) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject,
      text: message,
    });
    console.log("Report sent:", info.messageId);
  } catch (err) {
    console.error("Failed to send report:", err);
  }
}

// --- Dynamic sender for buyer/seller/etc ---
export async function messageToUser(subject, order, userId, role = "user") {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId format");
  }

  let user = null;
  if (role === "user") {
    user = await User.findById(userId).select("email");
  } else if (role === "seller") {
    user = await Seller.findById(userId).select("email");
  }

  if (!user) {
    throw new Error(`${role} not found`);
  }

  // tailor message depending on role
  let message;
  if (role === "user") {
    message = `Thanks for your purchase!\n\nYour order:\n${order.items
      .map(i => `${i.name} x${i.qty}`)
      .join("\n")}`;
  } else if (role === "seller") {
    message = `New order received.\n\nItems to fulfill:\n${order.items
      .map(i => `${i.name} x${i.qty}`)
      .join("\n")}`;
  } else {
    message = `Order details:\n${JSON.stringify(order, null, 2)}`;
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: user.email,
    subject,
    text: message,
  });

  console.log(`Email sent to ${role}:`, info.messageId, "->", user.email);
}
