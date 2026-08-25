import nodemailer from "nodemailer"

interface EmailOptions {
    to: string
    subject: string
    text: string
    html?: string
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
    const host = process.env.SMTP_HOST || "smtpout.secureserver.net"
    const port = parseInt(process.env.SMTP_PORT || "465")
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!user || !pass) {
        console.warn("SMTP credentials not found. Email not sent.")
        return { success: false, error: "SMTP credentials missing" }
    }

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
        })

        const info = await transporter.sendMail({
            from: `"KBI Corporate" <${user}>`,
            to,
            subject,
            text,
            html,
        })

        console.log("Email sent: %s", info.messageId)
        return { success: true, id: info.messageId }
    } catch (error: any) {
        console.error("Error sending email:", error)
        return { success: false, error: error.message }
    }
}
