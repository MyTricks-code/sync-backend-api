import transporter from "../config/nodeMailer.js";

const TEST_EMAIL = "prashantnishant80@gmail.com"; // 🧪 Testing only — swap `TEST_EMAIL` → `recipient` when going live


const sendEmail = async (recipient, subject, text, html = null) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: TEST_EMAIL, // 👈 Change to `recipient` when ready to send to all users
      subject: subject,
      text: text,
      html: html || `<p>${text}</p>`,
    });
    console.log("Email sent:", info.response);
    return true;
  } catch (err) {
    console.error("Error while sending mail", err);
    return false;
  }
};

export default sendEmail;