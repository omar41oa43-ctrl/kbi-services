// Device data with brands, models, and issues

export const devices = [
  {
    id: "mobile",
    name: "Mobile Phone",
    icon: "Smartphone",
    brands: [
      {
        id: "apple",
        name: "Apple",
        models: [
          "iPhone 15 Pro Max",
          "iPhone 15 Pro",
          "iPhone 15",
          "iPhone 14 Pro Max",
          "iPhone 14 Pro",
          "iPhone 14",
          "iPhone 13",
          "iPhone 12",
          "iPhone 11",
          "iPhone SE",
        ],
      },
      {
        id: "samsung",
        name: "Samsung",
        models: [
          "Galaxy S24 Ultra",
          "Galaxy S24+",
          "Galaxy S24",
          "Galaxy S23 Ultra",
          "Galaxy S23",
          "Galaxy A54",
          "Galaxy A34",
          "Galaxy Z Fold 5",
          "Galaxy Z Flip 5",
        ],
      },
      {
        id: "xiaomi",
        name: "Xiaomi",
        models: ["Xiaomi 14 Ultra", "Xiaomi 14", "Redmi Note 13 Pro", "Redmi Note 13", "Poco F6 Pro", "Poco X6 Pro"],
      },
      { id: "huawei", name: "Huawei", models: ["Mate 60 Pro", "P60 Pro", "Nova 12", "Nova 11"] },
      { id: "oppo", name: "OPPO", models: ["Find X7 Ultra", "Reno 11 Pro", "A98"] },
      { id: "vivo", name: "Vivo", models: ["X100 Pro", "V30 Pro", "Y78"] },
      { id: "oneplus", name: "OnePlus", models: ["12", "12R", "Nord 3", "Nord CE 3"] },
      { id: "google", name: "Google", models: ["Pixel 8 Pro", "Pixel 8", "Pixel 7a"] },
    ],
    issues: [
      "Screen Replacement",
      "Battery Replacement",
      "Charging Port Repair",
      "Camera Replacement",
      "Speaker / Mic Fix",
      "Software Issues",
      "Water Damage",
      "Back Glass Replacement",
    ],
  },
  {
    id: "laptop",
    name: "Laptop",
    icon: "Laptop",
    brands: [
      {
        id: "apple-mac",
        name: "Apple MacBook",
        models: ['MacBook Pro 16"', 'MacBook Pro 14"', "MacBook Air M2", "MacBook Air M1"],
      },
      { id: "dell", name: "Dell", models: ["XPS 15", "XPS 13", "Inspiron 15", "Latitude 14"] },
      { id: "hp", name: "HP", models: ["Spectre x360", "Pavilion 15", "EliteBook", "Omen 16"] },
      { id: "lenovo", name: "Lenovo", models: ["ThinkPad X1 Carbon", "ThinkPad T14", "IdeaPad", "Legion 5"] },
      { id: "asus", name: "ASUS", models: ["ROG Zephyrus", "ZenBook", "VivoBook", "TUF Gaming"] },
      { id: "acer", name: "Acer", models: ["Swift 5", "Aspire 5", "Nitro 5", "Predator Helios"] },
      { id: "msi", name: "MSI", models: ["Stealth", "Raider", "Creator", "Modern"] },
    ],
    issues: [
      "Fan Cleaning & Thermal Paste",
      "Keyboard Replacement",
      "Screen Replacement",
      "USB / HDMI Port Repair",
      "Windows Installation",
      "Overheating Fix",
      "SSD/RAM Upgrade",
      "Battery Replacement",
      "Motherboard Repair",
    ],
  },
  {
    id: "pc",
    name: "PC / Desktop Computer",
    icon: "Monitor",
    brands: [
      { id: "dell-pc", name: "Dell", models: ["OptiPlex", "Precision", "Vostro", "Alienware"] },
      { id: "hp-pc", name: "HP", models: ["ProDesk", "EliteDesk", "Pavilion Desktop", "OMEN Desktop"] },
      { id: "lenovo-pc", name: "Lenovo", models: ["ThinkCentre", "IdeaCentre", "Legion Tower"] },
      { id: "asus-pc", name: "ASUS", models: ["ROG", "TUF", "ProArt", "ExpertCenter"] },
      { id: "acer-pc", name: "Acer", models: ["Aspire Desktop", "Nitro", "Predator"] },
      { id: "msi-pc", name: "MSI", models: ["MEG Trident", "MAG Infinite", "PRO"] },
      { id: "samsung-pc", name: "Samsung", models: ["Desktop Series"] },
      { id: "huawei-pc", name: "Huawei", models: ["MateStation"] },
      { id: "custom-pc", name: "Custom Build (PC Tower)", models: ["ATX Tower", "MicroATX", "Mini-ITX"] },
    ],
    issues: [
      "Hardware: Power Supply Issue",
      "Hardware: No Display",
      "Hardware: Overheating",
      "Hardware: CPU Fan Replacement",
      "Hardware: RAM Upgrade / Replacement",
      "Hardware: SSD Upgrade / OS Install",
      "Hardware: GPU Issue / No Signal",
      "Hardware: Motherboard Repair",
      "Software: Windows Installation",
      "Software: Virus Removal",
      "Software: System Slow",
      "Software: Driver Issues",
      "Software: BIOS Errors",
      "Physical: Broken Ports (USB / HDMI)",
      "Physical: Front Panel Not Working",
      "Physical: PSU Noise",
    ],
  },
  {
    id: "printer",
    name: "Printer",
    icon: "Printer",
    brands: [
      { id: "hp-printer", name: "HP", models: ["LaserJet Pro", "OfficeJet Pro", "DeskJet", "ENVY"] },
      { id: "canon", name: "Canon", models: ["PIXMA", "imageCLASS", "MAXIFY"] },
      { id: "epson", name: "Epson", models: ["EcoTank", "WorkForce", "Expression"] },
      { id: "brother", name: "Brother", models: ["MFC Series", "HL Series", "DCP Series"] },
    ],
    issues: [
      "Ink & Toner Issues",
      "Paper Jam Fix",
      "Cleaning & Maintenance",
      "Laser Printer Repair",
      "Inkjet Printer Repair",
      "Print Quality Issues",
      "Connectivity Issues",
    ],
  },

  {
    id: "tv",
    name: "TV",
    icon: "Tv",
    brands: [
      { id: "samsung-tv", name: "Samsung", models: ["Neo QLED 8K", "Neo QLED 4K", "Crystal UHD", "The Frame"] },
      { id: "sony-tv", name: "Sony", models: ["BRAVIA XR", "BRAVIA 4K", "X Series"] },
      { id: "lg-tv", name: "LG", models: ["OLED evo", "QNED", "NanoCell", "UHD"] },
      { id: "hisense", name: "Hisense", models: ["ULED", "Laser TV", "4K Series"] },
      { id: "tcl", name: "TCL", models: ["QM8", "Q7", "S4"] },
      { id: "philips", name: "Philips", models: ["OLED+", "The One", "PUS Series"] },
      { id: "panasonic", name: "Panasonic", models: ["JZ OLED", "JX LED", "LX Series"] },
      { id: "sharp", name: "Sharp", models: ["Aquos", "XLED"] },
    ],
    issues: [
      "TV Not Turning On",
      "Lines on Screen",
      "HDMI Port Repair",
      "Software / System Issue",
      "Sound Issues",
      "Backlight Repair",
      "Screen Replacement",
    ],
  },
  {
    id: "monitor",
    name: "Monitor Repair",
    icon: "Monitor",
    brands: [
      { id: "samsung-monitor", name: "Samsung", models: ["Odyssey", "Smart Monitor", "Essential"] },
      { id: "lg-monitor", name: "LG", models: ["UltraGear", "UltraWide", "UltraFine"] },
      { id: "dell-monitor", name: "Dell", models: ["Alienware", "UltraSharp", "S-Series"] },
      { id: "asus-monitor", name: "ASUS", models: ["ROG", "TUF Gaming", "ProArt"] },
      { id: "acer-monitor", name: "Acer", models: ["Predator", "Nitro", "ConceptD"] },
      { id: "benq", name: "BenQ", models: ["Mobiuz", "Zowie", "PD Series"] },
      { id: "aoc", name: "AOC", models: ["Agon", "G-Line"] },
      { id: "hp-monitor", name: "HP", models: ["Omen", "X-Series", "E-Series"] },
    ],
    issues: [
      "No Power",
      "No Display",
      "Lines on Screen",
      "Backlight Bleeding",
      "Flickering",
      "Dead Pixels",
      "Port Repair",
      "Physical Damage",
    ],
  },
  {
    id: "apple-watch",
    name: "Apple Watch",
    icon: "Watch",
    brands: [
      {
        id: "apple-watch",
        name: "Apple",
        models: [
          "Apple Watch Ultra 2",
          "Apple Watch Series 9",
          "Apple Watch SE",
          "Apple Watch Series 8",
          "Apple Watch Series 7",
        ],
      },
    ],
    issues: [
      "Screen Replacement",
      "Battery Replacement",
      "Crown Repair",
      "Sensor Issues",
      "Water Damage",
      "Pairing Issues",
    ],
  },
  {
    id: "gaming",
    name: "PlayStation / Xbox",
    icon: "Gamepad2",
    brands: [
      { id: "playstation", name: "PlayStation", models: ["PS5", "PS5 Digital", "PS4 Pro", "PS4 Slim"] },
      { id: "xbox", name: "Xbox", models: ["Xbox Series X", "Xbox Series S", "Xbox One X", "Xbox One S"] },
      { id: "nintendo", name: "Nintendo", models: ["Switch OLED", "Switch", "Switch Lite"] },
    ],
    issues: [
      "HDMI Port Repair",
      "Overheating Fix",
      "Disc Drive Repair",
      "Controller Sync Issues",
      "Power Issues",
      "Software / System Issues",
      "SSD Upgrade",
    ],
  },
  {
    id: "cctv",
    name: "CCTV",
    icon: "Camera",
    brands: [
      { id: "hikvision", name: "Hikvision", models: ["DS-2CD Series", "ColorVu", "AcuSense"] },
      { id: "dahua", name: "Dahua", models: ["IPC-HDW Series", "IPC-HFW Series", "XVR Series"] },
      { id: "uniview", name: "Uniview", models: ["Prime Series", "Easy Series"] },
      { id: "ezviz", name: "Ezviz", models: ["C6N", "C3W", "DB1C"] },
      { id: "cpplus", name: "CP Plus", models: ["E Series", "G Series"] },
      { id: "imou", name: "IMOU", models: ["Ranger Series", "Bullet Series"] },
      { id: "tplink-cctv", name: "TP-Link", models: ["Tapo C200", "Tapo C310", "VIGI"] },
      { id: "samsung-cctv", name: "Samsung CCTV", models: ["Wisenet", "SDH Series"] },
    ],
    issues: [
      "Full CCTV Installation",
      "DVR / NVR Setup",
      "Camera Not Working",
      "No Signal",
      "Night Vision Issues",
      "WiFi / Connectivity Fix",
      "Add New Cameras",
      "Camera Upgrade",
    ],
  },
  {
    id: "tv-install",
    name: "TV Installation",
    icon: "MonitorUp",
    brands: [
      { id: "samsung-install", name: "Samsung", models: ['32" - 43"', '50" - 55"', '65" - 75"', '85"+'] },
      { id: "sony-install", name: "Sony", models: ['32" - 43"', '50" - 55"', '65" - 75"', '85"+'] },
      { id: "lg-install", name: "LG", models: ['32" - 43"', '50" - 55"', '65" - 75"', '85"+'] },
      { id: "other-install", name: "Other Brand", models: ['32" - 43"', '50" - 55"', '65" - 75"', '85"+'] },
    ],
    issues: [
      "TV Wall Mount Installation",
      "Smart TV Setup",
      "Cable Management",
      "Soundbar Installation",
      "Full Home Theater Setup",
    ],
  },
  {
    id: "tablet",
    name: "iPad / Tablet",
    icon: "Laptop",
    brands: [
      { id: "apple-ipad", name: "Apple iPad", models: ["iPad (2018)", "iPad (2019)", "iPad (2020)", "iPad Air (2022)"] },
      { id: "samsung-tab", name: "Samsung Galaxy Tab", models: ["Galaxy Tab S9", "Galaxy Tab S8", "Galaxy Tab A8"] },
    ],
    issues: [
      "Screen Replacement",
      "Battery Replacement",
      "Charging Port Repair",
      "Camera Replacement",
      "Software Issues",
      "Water Damage",
      "Not Turning On",
    ],
  },
  {
    id: "networking",
    name: "Network Installation & Maintenance",
    icon: "Wifi",
    description: "Professional wired and wireless network setup and configuration with performance optimization.",
    brands: [
      { id: "cisco", name: "Cisco", models: ["Router", "Switch", "Access Point", "Firewall"] },
      { id: "ubiquiti", name: "Ubiquiti / UniFi", models: ["Dream Machine", "UniFi AP", "EdgeRouter"] },
      { id: "tp-link-net", name: "TP-Link", models: ["Archer", "Deco (Mesh)", "Omada"] },
      { id: "d-link", name: "D-Link", models: ["DIR Series", "DAP Series", "COVR"] },
      { id: "netgear", name: "Netgear", models: ["Nighthawk", "Orbi", "ProSafe"] },
      { id: "linksys", name: "Linksys", models: ["Velop", "Max-Stream"] },
      { id: "huawei-net", name: "Huawei", models: ["B Series", "HG Series"] },
      { id: "other-net", name: "Other Brand", models: ["Home Router", "Office Switch", "Mesh System"] },
    ],
    issues: [
      "LAN & Wi-Fi Installation",
      "Router & Switch Configuration",
      "Network Speed & Stability Optimization",
      "Signal Strength Improvement",
      "Connection Drop / Interruption Fix",
      "Periodic Maintenance & Support",
      "VPN / Remote Access Setup",
      "Cabling & Infrastructure (Cat6/Fiber)",
    ],
  },
  {
    id: "tech-support",
    name: "Technical Support",
    icon: "Headset",
    description: "Fast technical support to solve all hardware and system issues remotely or on-site.",
    brands: [
      { id: "windows-support", name: "Windows Support", models: ["Windows 11", "Windows 10", "Windows Server"] },
      { id: "mac-support", name: "macOS Support", models: ["macOS Sonoma", "macOS Ventura", "macOS Monterey"] },
      { id: "software-apps", name: "Software & Apps", models: ["Microsoft Office", "Adobe Suite", "Custom Apps"] },
      { id: "remote-help", name: "Remote Assistance", models: ["AnyDesk Support", "TeamViewer Support", "Zoom/Phone Help"] },
    ],
    issues: [
      "Remote Technical Support",
      "Hardware & Software Diagnostics",
      "System & Network Setup",
      "Virus Removal & Optimization",
      "Phone & WhatsApp Support",
      "Data Recovery",
      "Email & Cloud Setup",
    ],
  },
]

export const orderStatuses = [
  { id: 1, name: "Order Created", description: "Your order has been received" },
  { id: 2, name: "Technician Assigned", description: "A technician has been assigned to your order" },
  { id: 3, name: "Technician On the Way", description: "Your technician is heading to your location" },
  { id: 4, name: "Diagnostic in Progress", description: "We're diagnosing your device" },
  { id: 5, name: "Repair in Progress", description: "Your device is being repaired" },
  { id: 6, name: "Quality Check", description: "Final quality assurance check" },
  { id: 7, name: "Completed / Delivered", description: "Your repair is complete!" },
]

export type RepairTimesMap = Record<string, number>

const repairTimesKey = "repairTimes"

export function getAllRepairTimes(): RepairTimesMap {
  if (typeof window === "undefined") return {}
  const raw = localStorage.getItem(repairTimesKey)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as RepairTimesMap
  } catch {
    return {}
  }
}

export function setRepairTime(deviceId: string, issue: string, minutes: number) {
  if (typeof window === "undefined") return
  const map = getAllRepairTimes()
  map[`${deviceId}|${issue}`] = minutes
  localStorage.setItem(repairTimesKey, JSON.stringify(map))
}

export function removeRepairTime(deviceId: string, issue: string) {
  if (typeof window === "undefined") return
  const map = getAllRepairTimes()
  delete map[`${deviceId}|${issue}`]
  localStorage.setItem(repairTimesKey, JSON.stringify(map))
}

export function clearRepairTimes() {
  if (typeof window === "undefined") return
  localStorage.removeItem(repairTimesKey)
}

export function getRepairTime(deviceId: string, issue: string): number {
  const map = getAllRepairTimes()
  const key = `${deviceId}|${issue}`
  if (map[key] != null) return map[key]
  if (issue.startsWith("Hardware:")) return 90
  if (issue.startsWith("Software:")) return 60
  if (issue.startsWith("Physical:")) return 75
  return 60
}
