import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND);

const sendMail = async (recipient, subject, content) => {
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: recipient,
            subject: 'SYNC AIT: ' + subject,
            html: `<p>${content}</p>`
        });
        return true
    } catch (err) {
        console.log("Error Sending Mail: " + err);
        return false;
    }
}

export default sendMail