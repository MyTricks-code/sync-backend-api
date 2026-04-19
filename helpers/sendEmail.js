// import transporter from "../config/nodeMailer.js";

// const sendEmail = async (recipient, subject, text)=>{
//     try {
//     const info = await transporter.sendMail({
//       from: process.env.SENDER_EMAIL, // sender address
//       to: recipient, // list of recipients
//       subject: subject, // subject line
//       text: text, // plain text body
//       html: '<p>' + text + '</p>', // HTML body
//     });
//     console.log("Email sent:", info.response);
//     return true;
//   } catch (err) {
//     console.error("Error while sending mail", err);
//     return false;
//   }
// }

// export default sendEmail