"use client"

import { createContext, useContext } from "react"
import type { SiteContact } from "@/lib/site-contact"

const defaultContact: SiteContact = {
  companyName: "KBI GLOBAL TECHNOLOGIES",
  whatsapp: "971502491034",
  phone: "+971502491034",
  email: "info@kbi.services",
  address: "Abu Dhabi, UAE",
  whatsappRaw: "971502491034",
  phoneDisplay: "+971 50 249 1034",
  socialLinks: { facebook: "", instagram: "", tiktok: "" },
  socialLinksEnabled: { facebook: true, instagram: true, tiktok: true },
}

const ContactContext = createContext<SiteContact>(defaultContact)

export function ContactProvider({
  contact,
  children,
}: {
  contact: SiteContact
  children: React.ReactNode
}) {
  return (
    <ContactContext.Provider value={contact}>
      {children}
    </ContactContext.Provider>
  )
}

export function useSiteContact(): SiteContact {
  return useContext(ContactContext)
}
