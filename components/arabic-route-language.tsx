"use client"

import { useEffect } from "react"
import { useLanguage } from "@/components/language-provider"

export function ArabicRouteLanguage() {
  const { setLang } = useLanguage()

  useEffect(() => {
    setLang("ar")
    document.documentElement.lang = "ar"
    document.documentElement.dir = "rtl"

    return () => {
      document.documentElement.lang = "en"
      document.documentElement.dir = "ltr"
    }
  }, [setLang])

  return null
}
