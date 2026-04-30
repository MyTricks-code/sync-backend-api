import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND);

const sendMail = async () => {
    try {
        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'prashantnishant80@gmail.com',
            subject: 'SYNC AIT: Test',
            html: '<p>Test</p>'
        });
        console.log("Success:", data);
    } catch (err) {
        console.log("Error Sending Mail: " + err);
    }
}
sendMail();
