import { Resend } from 'resend';

const resend = new Resend(
    process.env.RESEND_API_KEY
);

const sendMail = async (recipient, subject, content) => {
    try {
        console.log(
            "RESEND API KEY:",
            !!process.env.RESEND_API_KEY
        );

        const { data, error } =
            await resend.emails.send({

                from:
                    process.env.RESEND_FROM_EMAIL,
                to: recipient,
                subject: 'AIT NEXUS: ' + subject,
                html: `<p>${content}</p>`
            });

        console.log(
            "RESEND DATA:",
            data
        );

        console.log(
            "RESEND ERROR:",
            error
        );

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