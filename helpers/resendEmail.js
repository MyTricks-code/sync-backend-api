import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND);

const sendMail = async (recipient, subject, content) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: recipient,
            subject: 'AIT NEXUS: ' + subject,
            html: `<p>${content}</p>`
        });
        
        if (error) {
            console.log("Resend API Error: ", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.log("Error Sending Mail: " + err);
        return { success: false, error: err.message };
    }
}

export default sendMail