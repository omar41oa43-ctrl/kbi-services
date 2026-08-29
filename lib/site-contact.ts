import { adminDb } from "@/lib/firebase-admin"
import { unstable_cache } from "next/cache"

export type SiteContact = {
    companyName?: string;
    whatsapp: string;
    phone: string;
    email: string;
    address: string;
    addressAr?: string;
    whatsappRaw: string;
    phoneDisplay: string;
    footerText?: string;
    footerTextAr?: string;
    serviceAreas?: string[];
    workingHoursWeekdays?: string;
    workingHoursFriday?: string;
    googleSiteVerification?: string;
    socialLinks: {
        facebook: string;
        instagram: string;
        tiktok: string;
    };
    socialLinksEnabled: {
        facebook: boolean;
        instagram: boolean;
        tiktok: boolean;
    };
    companyPresentationUrl?: string;
}

const DEFAULT_SITE_CONTACT: SiteContact = {
        companyName: "KBI Services",
        whatsapp: "971502491034",
        phone: "+971502491034",
        email: "support@kbi.services",
        address: "All 7 Emirates, UAE",
        addressAr: "جميع إمارات الدولة السبع",
        whatsappRaw: "971502491034",
        phoneDisplay: "050 249 1034",
        serviceAreas: [
            "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"
        ],
        workingHoursWeekdays: "8:00 AM - 10:00 PM",
        workingHoursFriday: "2:00 PM - 10:00 PM",
        socialLinks: {
            facebook: "",
            instagram: "",
            tiktok: ""
        },
        socialLinksEnabled: {
            facebook: true,
            instagram: true,
            tiktok: true
        },
        companyPresentationUrl: ""
}

const getCachedSiteContact = unstable_cache(
  async (): Promise<SiteContact> => {
    const defaults = DEFAULT_SITE_CONTACT

    try {
        const doc = await adminDb.collection("settings").doc("site").get()
        if (!doc.exists) return defaults

        const data = doc.data() || {}

        const rawPhone = data.mainPhone || defaults.phone
        const rawWhatsapp = data.whatsapp || defaults.whatsapp
        const address = data.address || defaults.address
        const addressAr = data.addressAr
        const footerText = data.footerText
        const footerTextAr = data.footerTextAr
        const serviceAreas = data.serviceAreas ? data.serviceAreas.split(",").map((s: string) => s.trim()) : defaults.serviceAreas
        const workingHoursWeekdays = data.workingHoursWeekdays || defaults.workingHoursWeekdays
        const workingHoursFriday = data.workingHoursFriday || defaults.workingHoursFriday
        const googleSiteVerification = data.googleSiteVerification
        const socialLinks = data.socialLinks || {}
        const socialLinksEnabled = data.socialLinksEnabled || {}
        const companyPresentationUrl = data.companyPresentationUrl || ""

        const value: SiteContact = {
            companyName: data.companyName || data.company || defaults.companyName,
            whatsapp: rawWhatsapp,
            phone: rawPhone,
            email: data.email || defaults.email,
            address: address,
            addressAr: addressAr,
            whatsappRaw: rawWhatsapp.replace(/[^0-9]/g, ""),
            phoneDisplay: rawPhone,
            footerText: footerText,
            footerTextAr: footerTextAr,
            serviceAreas: serviceAreas,
            workingHoursWeekdays: workingHoursWeekdays,
            workingHoursFriday: workingHoursFriday,
            googleSiteVerification: googleSiteVerification,
            socialLinks: {
                facebook: socialLinks.facebook || defaults.socialLinks.facebook,
                instagram: socialLinks.instagram || defaults.socialLinks.instagram,
                tiktok: socialLinks.tiktok || defaults.socialLinks.tiktok
            },
            socialLinksEnabled: {
                facebook: socialLinksEnabled.facebook ?? defaults.socialLinksEnabled.facebook,
                instagram: socialLinksEnabled.instagram ?? defaults.socialLinksEnabled.instagram,
                tiktok: socialLinksEnabled.tiktok ?? defaults.socialLinksEnabled.tiktok
            },
            companyPresentationUrl: companyPresentationUrl
        }
        return value
    } catch {
        return defaults
    }
  },
  ["kbi-site-contact-v1"],
  { revalidate: 600, tags: ["site-contact"] },
)

export async function getSiteContact(): Promise<SiteContact> {
  return getCachedSiteContact()
}
