import transporter from "../config/nodeMailer.js";

const sendEmail = async (recipient, subject, text, html = null) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: recipient,
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