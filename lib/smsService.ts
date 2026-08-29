/**
 * WhatsApp Messaging Service - Free Alternative to SMS
 * Uses WhatsApp Web API for sending messages
 * Popular and free in UAE
 */

export interface WhatsAppMessage {
    to: string
    body: string
}

/**
 * Format phone number for WhatsApp (removes +, spaces, dashes)
 */
export function formatPhoneForWhatsApp(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "")

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, "")

    // Add UAE country code if not present
    if (!cleaned.startsWith("971")) {
        cleaned = `971${cleaned}`
    }

    return cleaned
}

/**
 * Generate WhatsApp click-to-chat URL
 * This opens WhatsApp with a pre-filled message
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
    const formattedPhone = formatPhoneForWhatsApp(phone)
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Open WhatsApp in new window (for client-side use)
 */
export function openWhatsApp(phone: string, message: string): void {
    const url = generateWhatsAppUrl(phone, message)
    window.open(url, "_blank")
}

/**
 * Send WhatsApp via API (for server-side automation)
 * This requires WhatsApp Business API setup
 */
export async function sendWhatsApp(
    to: string,
    body: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const response = await fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to, body })
        })

        const result = await response.json()

        if (!response.ok) {
            return { success: false, error: result.error || "Failed to send" }
        }

        return { success: true, url: result.url }
    } catch {
        return { success: false, error: "Failed to send message" }
    }
}

/**
 * WhatsApp Message Templates - Pre-written for common scenarios
 */
export const WhatsAppTemplates = {
    orderConfirmation: (orderId: string, customerName: string) =>
        `مرحباً ${customerName}! 👋

تم استلام طلب الإصلاح رقم #${orderId} بنجاح ✅

سيتم تعيين فني لك قريباً.

للمتابعة: kbi.services/track

KBI Services`,

    technicianAssigned: (orderId: string, techName: string, techPhone: string) =>
        `أخبار سارة! 🎉

تم تعيين الفني *${techName}* لطلبك #${orderId}

📞 للتواصل: ${techPhone}

سيصل إليك قريباً!`,

    onTheWay: (orderId: string, techName: string, eta?: string) =>
        `🚗 الفني ${techName} في الطريق إليك!

طلب: #${orderId}
${eta ? `الوصول المتوقع: ${eta}` : ""}

يرجى التأكد من توفركم.`,

    repairStarted: (orderId: string) =>
        `🔧 بدأ العمل على طلبك #${orderId}

سنُعلمك فور الانتهاء.`,

    repairComplete: (orderId: string, rateLink: string) =>
        `✅ تم إنجاز الإصلاح بنجاح!

طلب: #${orderId}

⭐ قيّم تجربتك: ${rateLink}

شكراً لاختيارك KBI Services!`,

    waitingParts: (orderId: string) =>
        `⏳ تحديث لطلبك #${orderId}

نحن بانتظار وصول قطع الغيار.
سنُعلمك فور استئناف العمل.`
}

/**
 * Get WhatsApp business number for company
 */
export const COMPANY_WHATSAPP = "+971502491034"
