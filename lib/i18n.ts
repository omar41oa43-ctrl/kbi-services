"use client"

import { useLanguage as useLangProvider, useT as useTProvider } from "@/components/language-provider"

export function useLanguage() {
  const { lang, setLang } = useLangProvider()
  const t = useTProvider()

  return {
    language: lang,
    setLanguage: setLang,
    t
  }
}
