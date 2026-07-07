import nodemailer from 'nodemailer'

const PORT = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: PORT,
  secure: PORT === 465,
  family: 4,
  pool: true,            // Reuse SMTP connections instead of opening a new one per email
  maxConnections: 3,     // Gmail allows ~3 concurrent connections safely
  maxMessages: 100,      // Recycle a connection after 100 messages
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default transporter;