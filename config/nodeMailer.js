import nodemailer from 'nodemailer'

const PORT = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: PORT,
  secure: PORT === 465, // Explicitly check for 465 (Implicit TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default transporter;