"use client"

import type { ReactNode } from "react"
import { LanguageProvider } from "@/components/language-provider"
import { DICTIONARY } from "@/lib/i18n-dictionary"

export function ArabicLanguageProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider initialLang="ar" initialDictionary={DICTIONARY}>
      {children}
    </LanguageProvider>
  )
}
