import { NextRequest, NextResponse } from "next/server"
import { formatPhoneForWhatsApp, generateWhatsAppUrl } from "@/lib/smsService"

/**
 * WhatsApp Send API
 * Generates WhatsApp links for messaging
 * Free alternative to paid SMS services
 */
export async function POST(request: NextRequest) {
    try {
        const { to, body } = await request.json()

        if (!to || !body) {
            return NextResponse.json(
                { error: "Phone number and message body are required" },
                { status: 400 }
            )
        }

        // Format phone and generate WhatsApp URL
        const formattedPhone = formatPhoneForWhatsApp(to)
        const whatsappUrl = generateWhatsAppUrl(to, body)

        return NextResponse.json({
            success: true,
            url: whatsappUrl,
            phone: formattedPhone,
            message: "WhatsApp link generated successfully"
        })

    } catch (error: any) {
        console.error("WhatsApp send error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate WhatsApp link" },
            { status: 500 }
        )
    }
}
