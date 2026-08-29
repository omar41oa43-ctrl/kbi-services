"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Smartphone,
  Laptop,
  Printer,
  Tv,
  Tablet,
  Gamepad2,
  Watch,
  Camera,
  MonitorUp,
  Wifi,
  Headset,
  PcCase,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import { useLanguage, useT } from "@/components/language-provider"

interface HomeDevice {
  id: string
  name: string
  nameAr: string
  icon: typeof Smartphone
  category: "mobile" | "computer" | "home" | "office"
  popular?: boolean
  desc: string
  descAr: string
}

const devices: HomeDevice[] = [
  {
    id: "mobile",
    name: "Mobile Phone",
    nameAr: "هاتف جوال",
    icon: Smartphone,
    category: "mobile",
    popular: true,
    desc: "iPhone, Samsung, Xiaomi & more",
    descAr: "آيفون، سامسونج، شاومي والمزيد",
  },
  {
    id: "laptop",
    name: "Laptop",
    nameAr: "حاسوب محمول",
    icon: Laptop,
    category: "computer",
    popular: true,
    desc: "MacBook, Dell, HP, Lenovo & ASUS",
    descAr: "ماك بوك، ديل، إتش بي، لينوفو",
  },
  {
    id: "pc",
    name: "PC / Desktop Computer",
    nameAr: "كمبيوتر مكتبي",
    icon: PcCase,
    category: "computer",
    popular: true,
    desc: "Gaming rigs, All-in-Ones & Towers",
    descAr: "أجهزة الألعاب والمكاتب والتاور",
  },
  {
    id: "tablet",
    name: "Tablet / iPad",
    nameAr: "تابلت / آيباد",
    icon: Tablet,
    category: "mobile",
    popular: true,
    desc: "iPad Pro, Galaxy Tab & Surface",
    descAr: "آيباد برو، جالاكسي تاب وسيرفس",
  },
  {
    id: "printer",
    name: "Printer",
    nameAr: "طابعة",
    icon: Printer,
    category: "office",
    desc: "HP, Canon, Epson & Brother",
    descAr: "إتش بي، كانون، إبسون، براذر",
  },
  {
    id: "tv",
    name: "TV / Smart Screen",
    nameAr: "تلفاز / شاشات ذكية",
    icon: Tv,
    category: "home",
    desc: "Samsung, LG, Sony OLED & QLED",
    descAr: "سامسونج، إل جي، سوني أوليد",
  },
  {
    id: "gaming",
    name: "PlayStation / Xbox",
    nameAr: "أجهزة الألعاب",
    icon: Gamepad2,
    category: "home",
    popular: true,
    desc: "PS5, PS4, Xbox Series X & Switch",
    descAr: "بلايستيشن 5، إكس بوكس وسويتش",
  },
  {
    id: "apple-watch",
    name: "Smart Watch",
    nameAr: "ساعة ذكية",
    icon: Watch,
    category: "mobile",
    desc: "Apple Watch & Galaxy Watch",
    descAr: "ساعات آبل وجالاكسي ووتش",
  },
  {
    id: "cctv",
    name: "CCTV & Security",
    nameAr: "كاميرات مراقبة",
    icon: Camera,
    category: "office",
    desc: "Hikvision, Dahua & smart cams",
    descAr: "هيك فيجن، داهوا وكاميرات ذكية",
  },
  {
    id: "monitor",
    name: "Monitor Repair",
    nameAr: "شاشات العرض",
    icon: MonitorUp,
    category: "computer",
    desc: "Gaming & 4K production displays",
    descAr: "شاشات الألعاب والمونتاج 4K",
  },
  {
    id: "networking",
    name: "WiFi & Networking",
    nameAr: "شبكات وواي فاي",
    icon: Wifi,
    category: "office",
    desc: "Routers, mesh WiFi & cabling",
    descAr: "راوترات، شبكات مش والتمديدات",
  },
  {
    id: "tech-support",
    name: "IT Support",
    nameAr: "دعم فني شامل",
    icon: Headset,
    category: "office",
    desc: "On-site diagnostics & setup",
    descAr: "تشخيص وصيانة موقعية فورية",
  },
]

export function HomeDeviceSelector() {
  const t = useT()
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const [activeCategory, setActiveCategory] = useState<string>("all")

  const categories = [
    { id: "all", label: isAr ? "جميع الأجهزة" : "All Devices" },
    { id: "mobile", label: isAr ? "الهواتف والأجهزة اللوحية" : "Mobiles & Tablets" },
    { id: "computer", label: isAr ? "الكمبيوتر واللابتوب" : "Computers & Laptops" },
    { id: "home", label: isAr ? "المنزل والترفيه" : "Home & Gaming" },
    { id: "office", label: isAr ? "المكتب والشبكات" : "Office & IT" },
  ]

  const filteredDevices =
    activeCategory === "all"
      ? devices
      : devices.filter((d) => d.category === activeCategory)

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {isAr ? "اختر جهازك للصيانة الموقعية" : "Choose Your Device for On-Site Repair"}
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground text-balance">
            {isAr ? "ما هو الجهاز الذي ترغب بإصلاحه؟" : "What Device Needs Repair Today?"}
          </h2>
          <p className="mt-3 text-base md:text-lg text-muted-foreground">
            {isAr
              ? "فنيونا المعتمدون يصلون إلى باب منزلك أو مكتبك في أبوظبي ودبي والشارقة وعجمان مع قطع أصلية وضمان معتمد."
              : "Certified technicians come to your home or office with high-grade parts and warranty across Abu Dhabi, Dubai, Sharjah & Ajman."}
          </p>

          {/* Category Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-md shadow-cyan-500/10 scale-105"
                    : "bg-card hover:bg-muted text-muted-foreground border border-border"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 md:gap-5 max-w-6xl mx-auto">
          {filteredDevices.map((device) => {
            const Icon = device.icon
            return (
              <Link
                key={device.id}
                href={`/book?device=${device.id}`}
                className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card/80 dark:bg-card/40 backdrop-blur-md p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 active:scale-[0.98]"
              >
                {/* Popular Badge */}
                {device.popular && (
                  <span className="absolute top-3.5 right-3.5 md:top-4 md:right-4 inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {isAr ? "شائع" : "Popular"}
                  </span>
                )}

                <div>
                  <div className="grid h-12 w-12 md:h-14 md:w-14 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300 shadow-xs">
                    <Icon className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <h3 className="mt-4 text-base md:text-lg font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {isAr ? device.nameAr : device.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {isAr ? device.descAr : device.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  <span>{isAr ? "احجز الآن" : "Book Repair"}</span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 ${
                      isAr ? "rotate-180 group-hover:-translate-x-1" : ""
                    }`}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
