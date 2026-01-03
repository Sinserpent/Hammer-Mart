import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,      // your Gmail email
    pass: process.env.SMTP_PASS,  // your Gmail App Password
  },
});

export default transporter;
