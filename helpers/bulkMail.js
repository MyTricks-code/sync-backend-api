import { Resend } from 'resend';
import userModel from '../models/userModel.js';

const resend = new Resend(process.env.RESEND);

const sendMail = async (recipientIds, subject, content) => {
  try {
    if (!recipientIds || recipientIds.length === 0) {
      throw new Error("No recipients provided");
    }

    // 🔹 Fetch all users in one DB query
    const users = await userModel.find({
      _id: { $in: recipientIds }
    });

    if (!users.length) {
      throw new Error("No valid users found");
    }

    // 🔹 Extract emails
    const emails = users
      .map(user => user.email)
      .filter(Boolean);

    if (!emails.length) {
      throw new Error("No valid email addresses found");
    }

    // 🔹 Send single private email using BCC
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'onboarding@resend.dev', // required visible recipient
      bcc: emails,                 // 🔥 hidden recipients
      subject: `SYNC AIT: ${subject}`,
      html: `<p>${content}</p>`
    });

    return true;

  } catch (err) {
    console.error("Error Sending Mail:", err);
    return false;
  }
};

export default sendMail;