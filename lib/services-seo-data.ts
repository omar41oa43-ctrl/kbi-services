export interface ServiceProblem {
  title: string
  description: string
}

export interface ServiceSeoData {
  slug: string
  legacySlug?: string
  bookingParam: string
  name: string
  h1: string
  seoTitle: string
  metaDescription: string
  heroSubtitle: string
  overview: {
    paragraph1: string
    paragraph2: string
  }
  commonProblems: ServiceProblem[]
  supportedBrands: {
    name: string
    models?: string[]
  }[]
  highlights: {
    title: string
    description: string
  }[]
  ctaText: string
  relatedServices: {
    slug: string
    name: string
  }[]
  arabic: {
    name: string
    h1: string
    description: string
  }
}

export const SERVICES_SEO_DATA: ServiceSeoData[] = [
  {
    slug: "mobile-phone-repair",
    legacySlug: "mobile",
    bookingParam: "mobile",
    name: "Mobile Phone Repair",
    h1: "Mobile Phone Repair at Your Doorstep Across the UAE",
    seoTitle: "Mobile Phone Repair Across the UAE",
    metaDescription: "Professional mobile phone repair across the UAE. KBI technicians come to your home or office for screen, battery, charging, camera, speaker and software issues.",
    heroSubtitle: "Expert on-site smartphone diagnostics and repairs at your home or office across Abu Dhabi, Dubai, Sharjah, and all seven Emirates. Transparent quotes and quality parts.",
    overview: {
      paragraph1: "Smartphones are essential tools for our daily communication, work, and banking. When your phone suffers a cracked screen, rapidly draining battery, or unresponsive charging port, visiting a physical repair shop and leaving your device behind can be frustrating and inconvenient. KBI Services brings professional mobile phone repair directly to your doorstep anywhere in the UAE.",
      paragraph2: "Our mobile technicians carry specialized diagnostic tools and replacement parts to your home or workplace. We perform a thorough preliminary inspection, explain the available repair options, and confirm your transparent quote before any paid work begins. Most common smartphone repairs—including display and battery replacements—are completed on-site in a single visit."
    },
    commonProblems: [
      {
        title: "Cracked or Broken Screen Replacement",
        description: "Precision replacement of broken glass panels, unresponsive OLED/LCD digitizers, and screens with green lines or black spots."
      },
      {
        title: "Battery Replacement & Health Restoration",
        description: "Fix rapid battery drain, unexpected shutdowns, and degraded battery maximum capacity with high-grade replacement batteries."
      },
      {
        title: "Charging Port & Connection Faults",
        description: "Repair or replace loose, damaged, or debris-filled USB-C and Lightning ports that fail to charge or connect to computers."
      },
      {
        title: "Front & Rear Camera Module Fixes",
        description: "Resolve blurry photos, cracked camera glass lenses, autofocus buzzing, and black screen camera app crashes."
      },
      {
        title: "Ear Speaker & Microphone Issues",
        description: "Restore clear call volume, fix distorted loudspeaker playback, and repair microphones that prevent callers from hearing you."
      },
      {
        title: "Software Troubleshooting & Boot Loops",
        description: "Diagnose operating system crashes, stuck Apple logo or Android recovery screens, and failed system update restorations."
      },
      {
        title: "Overheating & Power Management",
        description: "Inspect devices getting unusually hot during charging or normal use, identifying faulty internal ICs or short circuits."
      },
      {
        title: "Liquid Exposure Inspection",
        description: "Careful ultrasonic cleaning, corrosion assessment, and board-level diagnostic evaluation following water contact."
      }
    ],
    supportedBrands: [
      { name: "Apple iPhone", models: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Series", "iPhone 13", "iPhone 12", "iPhone 11", "iPhone SE"] },
      { name: "Samsung Galaxy", models: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Series", "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy A Series"] },
      { name: "Google Pixel", models: ["Pixel 8 Pro", "Pixel 8", "Pixel 7 Pro", "Pixel 7a", "Pixel 6"] },
      { name: "Xiaomi & Redmi", models: ["Xiaomi 14 Ultra", "Xiaomi 14", "Redmi Note 13 Pro", "Poco F6 Pro", "Poco X6 Pro"] },
      { name: "Huawei", models: ["Mate 60 Pro", "P60 Pro", "Nova 12", "Nova 11", "P50 Pro"] },
      { name: "OnePlus", models: ["OnePlus 12", "OnePlus 12R", "Nord 3", "Nord CE 3"] },
      { name: "OPPO & Vivo", models: ["Find X7 Ultra", "Reno 11 Pro", "X100 Pro", "V30 Pro"] }
    ],
    highlights: [
      { title: "Convenient Doorstep Service", description: "Technicians travel to your home, office, or hotel anywhere in the UAE." },
      { title: "Same-Day Service Available", description: "Flexible scheduling with same-day time slots based on location and technician availability." },
      { title: "Upfront Pricing", description: "Quote confirmed after diagnostic check before any paid work begins." },
      { title: "Written Warranty", description: "3–6 month warranty coverage on eligible hardware repairs noted on your invoice." }
    ],
    ctaText: "Book Mobile Phone Repair",
    relatedServices: [
      { slug: "tablet-repair", name: "Tablet Repair" },
      { slug: "apple-watch-repair", name: "Apple Watch Repair" },
      { slug: "laptop-repair", name: "Laptop Repair" }
    ],
    arabic: {
      name: "صيانة الهواتف الذكية",
      h1: "صيانة الهواتف في جميع أنحاء الإمارات",
      description: "خدمة صيانة الهواتف المتنقلة عند باب منزلك أو مكتبك في الإمارات لكافة أعطال الشاشات والبطاريات والمنافذ."
    }
  },
  {
    slug: "laptop-repair",
    legacySlug: "laptop",
    bookingParam: "laptop",
    name: "Laptop Repair",
    h1: "Professional Laptop Repair Across the UAE",
    seoTitle: "Laptop Repair Across the UAE",
    metaDescription: "Professional on-site laptop repair across the UAE for screen, keyboard, battery, overheating, charging, Windows and hardware issues.",
    heroSubtitle: "On-site diagnostic and repair services for MacBooks, Windows laptops, and gaming notebooks across all seven Emirates. Quality components and certified care.",
    overview: {
      paragraph1: "A malfunctioning laptop directly impacts your daily productivity, study, and business operations. Whether your device suffers from a cracked screen, erratic keyboard, depleted battery, or persistent thermal throttling, transporting it to a distant service shop is time-consuming. KBI Services provides dependable, on-site laptop repair throughout the UAE.",
      paragraph2: "Our field technicians visit your home, office, or co-working space equipped with professional hardware testing equipment. We handle both hardware replacements and operating system troubleshooting, verifying every component after repair. You receive a clear, upfront quote before work begins and pay only upon successful completion."
    },
    commonProblems: [
      {
        title: "Laptop Screen Replacement",
        description: "Replacement of shattered LCD/OLED panels, flickering displays, horizontal lines, and faulty display flex cables."
      },
      {
        title: "Keyboard & Trackpad Repair",
        description: "Fix sticky, missing, or unresponsive keys, liquid-damaged keyboards, and erratic touchpad tracking."
      },
      {
        title: "Battery Replacement & Runtime Restoration",
        description: "Replace swollen, weak, or non-charging laptop batteries to restore reliable cordless battery life."
      },
      {
        title: "Charging Port & DC Jack Repair",
        description: "Repair broken Type-C power delivery ports and loose charging jacks that require wiggling the cable."
      },
      {
        title: "Fan Cleaning & Thermal Paste Service",
        description: "Deep cooling fan cleaning and premium thermal compound reapplication to eliminate loud fan noise and overheating."
      },
      {
        title: "Windows & macOS Recovery",
        description: "Resolve operating system boot errors, blue screens (BSOD), corrupted system files, and software update failures."
      },
      {
        title: "SSD Storage & Speed Upgrades",
        description: "Upgrade slow mechanical drives to high-speed NVMe SSDs with complete operating system and data cloning."
      },
      {
        title: "RAM Memory Expansion",
        description: "Install additional high-speed memory for smoother multitasking, video editing, and software execution."
      },
      {
        title: "Motherboard & Port Diagnostics",
        description: "Diagnostic assessment of liquid spill damage, non-working USB/HDMI ports, and power rail failures."
      }
    ],
    supportedBrands: [
      { name: "Apple MacBook", models: ["MacBook Pro 16\"", "MacBook Pro 14\"", "MacBook Air M3", "MacBook Air M2", "MacBook Air M1"] },
      { name: "Dell", models: ["XPS 15", "XPS 13", "Inspiron 15", "Latitude Enterprise", "Alienware Gaming"] },
      { name: "HP", models: ["Spectre x360", "Envy", "Pavilion 15", "EliteBook", "Omen Gaming"] },
      { name: "Lenovo", models: ["ThinkPad X1 Carbon", "ThinkPad T-Series", "IdeaPad", "Legion Gaming Series", "Yoga 2-in-1"] },
      { name: "ASUS", models: ["ROG Zephyrus", "ZenBook", "VivoBook", "TUF Gaming Series"] },
      { name: "Acer", models: ["Swift Series", "Aspire", "Nitro Gaming", "Predator Helios"] },
      { name: "MSI & Surface", models: ["MSI Stealth", "Raider", "Modern", "Microsoft Surface Laptop", "Surface Pro"] }
    ],
    highlights: [
      { title: "Direct On-Site Service", description: "Repairs performed at your workplace or home without leaving your laptop behind." },
      { title: "Data Privacy Respected", description: "Your private files and documents remain securely under your supervision." },
      { title: "Transparent Costing", description: "Detailed cost breakdown confirmed before any part is replaced." },
      { title: "3–6 Month Warranty", description: "Warranty coverage on eligible replaced screens, batteries, and hardware components." }
    ],
    ctaText: "Book Laptop Repair",
    relatedServices: [
      { slug: "computer-repair", name: "Computer & PC Repair" },
      { slug: "it-support", name: "IT Support" },
      { slug: "network-support", name: "Network Installation & Support" }
    ],
    arabic: {
      name: "صيانة أجهزة اللابتوب",
      h1: "صيانة اللابتوب في جميع أنحاء الإمارات",
      description: "خدمة صيانة اللابتوب المتنقلة لكافة الماركات مثل أبل وماك بوك وديل وإتش بي ولينوفو في منزلك أو مكتبك."
    }
  },
  {
    slug: "computer-repair",
    legacySlug: "pc",
    bookingParam: "pc",
    name: "Computer & PC Repair",
    h1: "Computer & PC Repair Across the UAE",
    seoTitle: "Computer & PC Repair Across the UAE",
    metaDescription: "On-site computer and desktop PC repair across the UAE for hardware, Windows, overheating, performance, upgrades and connectivity problems.",
    heroSubtitle: "Professional desktop computer and custom PC tower diagnostics, hardware repair, and system optimization across all seven Emirates.",
    overview: {
      paragraph1: "Desktop computers and workstations are the powerhouse of many offices and home setups in the UAE. From corporate workstations to high-performance gaming rigs, hardware failures like failing power supplies, overheating processors, or corrupted Windows installations can halt your workflow. Carrying a heavy PC tower to a repair center is cumbersome and risks transit damage.",
      paragraph2: "KBI Services provides on-site computer and PC repair across the UAE. Our technicians arrive at your location to diagnose hardware components, test power supply rails, benchmark cooling, and resolve complex software errors. We service both brand-name pre-built desktops and custom-built PC towers."
    },
    commonProblems: [
      {
        title: "Power Supply (PSU) Failure & Power Cycling",
        description: "Diagnose PCs that will not turn on, click repeatedly, shut down suddenly under load, or produce electrical burning smells."
      },
      {
        title: "No Display / GPU Signal Loss",
        description: "Troubleshoot dedicated graphics cards, PCIe connections, display cables, and integrated graphics showing black screens."
      },
      {
        title: "Windows Startup & BSOD Blue Screen Errors",
        description: "Resolve blue screen stop codes, endless automatic repair loops, driver conflicts, and corrupted boot records."
      },
      {
        title: "High-Speed SSD Storage Upgrades",
        description: "Clone existing systems to ultra-fast NVMe M.2 SSDs to dramatically accelerate boot times and program loading."
      },
      {
        title: "RAM Memory Replacement & Expansion",
        description: "Diagnose faulty memory sticks causing random crashes, and upgrade RAM capacity with dual-channel performance."
      },
      {
        title: "CPU Overheating & Thermal Management",
        description: "Clean dust-choked radiators, replace dried thermal compound, and service liquid AIO coolers and case fans."
      },
      {
        title: "Motherboard & BIOS Diagnostics",
        description: "Recover from failed BIOS updates, CMOS battery exhaustion, and motherboard hardware component faults."
      },
      {
        title: "Malware, Adware & Virus Clean-Up",
        description: "Deep security scans to eliminate background malware, cryptominers, and persistent system spyware."
      },
      {
        title: "Cable Management & Airflow Optimization",
        description: "Re-route internal cabling, optimize intake and exhaust fan curves, and improve chassis ventilation."
      }
    ],
    supportedBrands: [
      { name: "Dell Desktop", models: ["OptiPlex", "Precision Workstations", "Vostro", "Inspiron Desktop", "Alienware Aurora"] },
      { name: "HP Workstations", models: ["ProDesk", "EliteDesk", "Z Workstations", "Pavilion Desktop", "OMEN Gaming PC"] },
      { name: "Lenovo Desktops", models: ["ThinkCentre", "IdeaCentre", "Legion Tower Series"] },
      { name: "ASUS & Acer", models: ["ASUS ROG Strix", "ProArt Workstations", "Acer Predator", "Nitro Desktops"] },
      { name: "Custom PC Builds", models: ["Custom Gaming Towers", "ATX / Micro-ATX Systems", "Mini-ITX Small Form Factor", "Content Creation Rigs"] }
    ],
    highlights: [
      { title: "No Need to Transport Towers", description: "Avoid transporting heavy, fragile PC cases; our technician visits your desk." },
      { title: "Component-Level Testing", description: "On-site multimeter, RAM testing, and thermal imaging diagnostics." },
      { title: "Clear Estimates", description: "Complete price quotation confirmed prior to starting any hardware replacement." },
      { title: "Warranty Protection", description: "Written warranty coverage on eligible replacement components." }
    ],
    ctaText: "Book Computer Repair",
    relatedServices: [
      { slug: "laptop-repair", name: "Laptop Repair" },
      { slug: "it-support", name: "IT Support" },
      { slug: "monitor-repair", name: "Monitor Repair" }
    ],
    arabic: {
      name: "صيانة أجهزة الكمبيوتر والـ PC",
      h1: "صيانة الكمبيوتر المكتبي والـ PC في الإمارات",
      description: "صيانة كمبيوترات سطح المكتب وأجهزة الألعاب وقطع الهاردوير والويندوز في موقعك مباشرة."
    }
  },
  {
    slug: "printer-repair",
    legacySlug: "printer",
    bookingParam: "printer",
    name: "Printer Repair & Maintenance",
    h1: "Printer Repair & Maintenance Across the UAE",
    seoTitle: "Printer Repair & Maintenance Across the UAE",
    metaDescription: "Professional printer repair and maintenance across the UAE for paper jams, print quality, connectivity, toner, ink and hardware problems.",
    heroSubtitle: "On-site printer servicing, paper jam removal, printhead recovery, and network setup for homes and offices across all seven Emirates.",
    overview: {
      paragraph1: "When a printer fails during a busy workday or before an important client deadline, operations grind to a halt. From frequent paper feed jams and faded, streaky printouts to stubborn network offline errors, printer problems can be messy and confusing to solve without technical expertise.",
      paragraph2: "KBI Services offers comprehensive on-site printer repair and preventative maintenance for home and business printers throughout the UAE. Our technicians service laser printers, all-in-one multifunction units, and ink tank systems from leading manufacturers like HP, Canon, Epson, and Brother, restoring smooth and clear printing."
    },
    commonProblems: [
      {
        title: "Frequent Paper Jams & Roller Slipping",
        description: "Clean or replace worn pickup rollers, clear trapped paper remnants, and fix misaligned paper feed trays."
      },
      {
        title: "Printer Offline & Network Connection Errors",
        description: "Reconfigure Wi-Fi settings, assign static IP addresses, and resolve driver communication drops on Windows and Mac."
      },
      {
        title: "Poor Print Quality, Streaks & Faded Text",
        description: "Deep printhead cleaning, laser optics cleaning, and transfer belt inspection for sharp, dark printouts."
      },
      {
        title: "Toner & Ink Cartridge Recognition Faults",
        description: "Fix cartridge sensor errors, chip communication failures, and ink delivery system air lock issues."
      },
      {
        title: "Laser Printer Fuser & Drum Replacement",
        description: "Replace worn imaging drums, fixing fuser smudges, ghosting marks, and wrinkled paper output."
      },
      {
        title: "Initial Printer Setup & Office Sharing",
        description: "Install fresh drivers, configure wireless sharing across multiple computers, and enable scan-to-folder."
      },
      {
        title: "Grinding Noises & Mechanical Gear Wear",
        description: "Lubricate internal carriage rails, inspect plastic drive gears, and remove foreign objects."
      },
      {
        title: "Preventative Office Maintenance",
        description: "Thorough internal dust removal, paper path cleaning, and roller reconditioning to extend printer lifespan."
      }
    ],
    supportedBrands: [
      { name: "HP", models: ["LaserJet Pro", "OfficeJet Pro", "DeskJet Series", "Color LaserJet Enterprise", "Neverstop Laser"] },
      { name: "Canon", models: ["imageCLASS Laser", "PIXMA MegaTank", "MAXIFY Business", "imageRUNNER"] },
      { name: "Epson", models: ["EcoTank L-Series", "WorkForce Pro", "Expression Home", "SureColor"] },
      { name: "Brother", models: ["MFC Multi-Function", "HL Monochrome Laser", "DCP Series", "Color LED Printers"] },
      { name: "Xerox & Ricoh", models: ["Phaser", "WorkCentre", "SP Series", "Aficio"] }
    ],
    highlights: [
      { title: "No Mess, We Come to You", description: "Avoid transporting messy toner and ink tanks in your vehicle; we service on-site." },
      { title: "Network Setup Included", description: "We ensure all your laptops, desktops, and phones can print seamlessly." },
      { title: "Genuine Maintenance Parts", description: "High-grade pickup rollers, separation pads, and maintenance boxes." },
      { title: "Corporate & Home", description: "We handle individual home printers as well as corporate multi-printer office fleets." }
    ],
    ctaText: "Book Printer Repair",
    relatedServices: [
      { slug: "network-support", name: "Network Installation & Support" },
      { slug: "it-support", name: "IT Support" },
      { slug: "computer-repair", name: "Computer & PC Repair" }
    ],
    arabic: {
      name: "صيانة الطابعات",
      h1: "صيانة الطابعات في جميع أنحاء الإمارات",
      description: "صيانة طابعات الليزر والحبر وإصلاح انحشار الورق ومشاكل التوصيل بالشبكة في المكاتب والمنازل."
    }
  },
  {
    slug: "tv-repair",
    legacySlug: "tv",
    bookingParam: "tv",
    name: "TV Repair",
    h1: "TV Repair at Your Home Across the UAE",
    seoTitle: "TV Repair Across the UAE",
    metaDescription: "Professional TV repair across the UAE for no display, backlight, HDMI, power, sound and smart TV issues. KBI technicians come to your location.",
    heroSubtitle: "Convenient on-site TV diagnostics and repairs for Samsung, LG, Sony, TCL, and other leading smart TV brands across the UAE.",
    overview: {
      paragraph1: "Modern smart TVs are the centerpiece of home entertainment. When a television refuses to turn on, loses its backlight, produces horizontal lines across the display, or loses audio, transporting a fragile 65-inch or 75-inch screen to a workshop poses severe risks of panel cracking. KBI Services solves this problem with on-site TV repair.",
      paragraph2: "Our experienced TV technicians travel directly to your residence or commercial venue with electronic diagnostic instruments. We inspect power supply boards, main logic boards, T-Con boards, and LED backlight strips, confirming the issue and providing an honest estimate before any repair commences."
    },
    commonProblems: [
      {
        title: "No Display / Black Screen with Sound",
        description: "Diagnose failing LED backlight arrays or power inverter circuits where sound plays but the picture remains pitch black."
      },
      {
        title: "TV Will Not Turn On / Blinking Power LED",
        description: "Inspect faulty power supply capacitors, blown main fuses, and standby power rail shorts."
      },
      {
        title: "Dark Patches & Backlight Bleed",
        description: "Repair burned-out LED backlight strips causing dim spots or half-screen darkening on LED and QLED panels."
      },
      {
        title: "Damaged HDMI Ports & Loose Connectors",
        description: "Repair or replace physically broken HDMI inputs caused by heavy cables or sudden pulls."
      },
      {
        title: "Sound Distortion or Complete Audio Loss",
        description: "Diagnose buzzing internal speakers, crackling audio ICs, and optical audio output failures."
      },
      {
        title: "Smart TV OS Freezing & Boot Loops",
        description: "Resolve smart television firmware crashes, restarting on the brand logo, and software memory corruption."
      },
      {
        title: "Wi-Fi & App Connectivity Failures",
        description: "Replace faulty internal Wi-Fi/Bluetooth modules that prevent streaming apps from connecting."
      },
      {
        title: "Horizontal & Vertical Display Lines",
        description: "Assess T-Con board ribbon cables, COF flex bonds, and driver circuitry to determine repairability."
      }
    ],
    supportedBrands: [
      { name: "Samsung", models: ["Neo QLED 8K", "Neo QLED 4K", "Crystal UHD Series", "The Frame", "OLED Series"] },
      { name: "LG", models: ["OLED evo Series (C3, G3, B3)", "QNED MiniLED", "NanoCell Series", "UHD 4K TVs"] },
      { name: "Sony", models: ["BRAVIA XR OLED", "BRAVIA 4K HDR", "Full Array LED Series", "X90 Series"] },
      { name: "TCL & Hisense", models: ["TCL QM8 / Q7 / C Series", "Hisense ULED 4K", "Laser TV Series", "A6 Series"] },
      { name: "Philips & Panasonic", models: ["Philips Ambilight OLED", "Panasonic OLED Series", "Sharp Aquos"] }
    ],
    highlights: [
      { title: "Safe In-Home Inspection", description: "Zero risk of dropping or cracking your delicate television screen in transit." },
      { title: "Board-Level Expertise", description: "Diagnostic evaluation of power supply, mainboard, and T-Con modules." },
      { title: "Transparent Feasibility Advice", description: "Honest evaluation of whether repair is cost-effective compared to replacement." },
      { title: "Warranty Coverage", description: "Written warranty on eligible replaced electrical and backlight components." }
    ],
    ctaText: "Book TV Repair",
    relatedServices: [
      { slug: "tv-installation", name: "TV Installation" },
      { slug: "monitor-repair", name: "Monitor Repair" },
      { slug: "gaming-console-repair", name: "PlayStation & Xbox Repair" }
    ],
    arabic: {
      name: "صيانة التلفزيونات",
      h1: "صيانة التلفزيونات في جميع أنحاء الإمارات",
      description: "صيانة شاشات التلفزيون في المنزل وإصلاح أعطال الإضاءة الخلفية واللوحة الأم ومنافذ HDMI."
    }
  },
  {
    slug: "monitor-repair",
    legacySlug: "monitor",
    bookingParam: "monitor",
    name: "Monitor Repair",
    h1: "Computer Monitor Repair Across the UAE",
    seoTitle: "Monitor Repair Across the UAE",
    metaDescription: "Professional monitor repair across the UAE for gaming, curved, 4K and office monitors. On-site diagnostics for display, power and port issues.",
    heroSubtitle: "On-site computer monitor testing and repair for high-refresh gaming displays, ultra-wide screens, and professional color-accurate monitors across the UAE.",
    overview: {
      paragraph1: "High-performance monitors are critical for modern gaming setups, digital creative studios, and productive home offices. When a monitor refuses to power on, suffers sudden backlight flickering, or fails to detect HDMI and DisplayPort signals, replacing the entire display unit is not always necessary. KBI Services provides skilled on-site monitor diagnostics.",
      paragraph2: "We service gaming monitors (144Hz, 240Hz, 360Hz), curved ultrawide screens, and professional color-calibrated panels. Our technicians test external power bricks, internal power regulator circuits, and input ports right at your desk, giving you an honest repair quote before proceeding."
    },
    commonProblems: [
      {
        title: "Monitor Not Powering On / Dead Unit",
        description: "Test external power adapters, internal power management boards, and replace blown capacitors."
      },
      {
        title: "No Signal Detected on DisplayPort / HDMI",
        description: "Diagnose loose or bent port pins, faulty input selector chips, and EDID handshake errors."
      },
      {
        title: "Screen Flickering & Blackout Stutter",
        description: "Fix unstable power supply rails, backlight PWM controller failures, and refresh rate synchronization drops."
      },
      {
        title: "Backlight Bleeding & Dim Screen Sections",
        description: "Inspect edge-lit LED modules and internal diffuser layers for uneven illumination and dark corners."
      },
      {
        title: "Color Tinting & Image Artifacts",
        description: "Resolve color space corruption, pink/green screen tints, and internal scaler board glitches."
      },
      {
        title: "Physical Damage & Panel Evaluation",
        description: "Professional inspection of display panels to verify integrity and advise on repairability."
      },
      {
        title: "OSD Menu Button & Joystick Repair",
        description: "Repair stuck or broken directional control switches used to configure monitor brightness and inputs."
      }
    ],
    supportedBrands: [
      { name: "Samsung", models: ["Odyssey G9", "Odyssey G7", "Odyssey Neo", "ViewFinity", "Smart Monitor M8"] },
      { name: "LG", models: ["UltraGear OLED", "UltraWide 34\"", "UltraFine 4K / 5K", "DualUp Monitor"] },
      { name: "Dell & Alienware", models: ["Alienware 34\" Curved QD-OLED", "UltraSharp Color Series", "Gaming S-Series"] },
      { name: "ASUS", models: ["ROG Swift Gaming", "TUF Gaming Series", "ProArt Professional Studio"] },
      { name: "BenQ & AOC", models: ["Mobiuz Gaming", "ZOWIE eSports", "AOC Agon Pro", "Porsche Design"] },
      { name: "Acer & HP", models: ["Predator X34", "Nitro Gaming", "HP Omen", "HP Z Displays"] }
    ],
    highlights: [
      { title: "Desk-Side Diagnostics", description: "Convenient inspection right where your workstation is set up." },
      { title: "Gaming & Studio Expertise", description: "Deep familiarity with high-refresh rate and color-critical displays." },
      { title: "No Surprise Fees", description: "Diagnosis completed and price confirmed before repair begins." },
      { title: "Warranty on Replaced Parts", description: "3–6 month coverage on eligible hardware repair parts." }
    ],
    ctaText: "Book Monitor Repair",
    relatedServices: [
      { slug: "computer-repair", name: "Computer & PC Repair" },
      { slug: "laptop-repair", name: "Laptop Repair" },
      { slug: "gaming-console-repair", name: "PlayStation & Xbox Repair" }
    ],
    arabic: {
      name: "صيانة الشاشات",
      h1: "صيانة شاشات الكمبيوتر في جميع أنحاء الإمارات",
      description: "صيانة شاشات الألعاب والشاشات المنحنية وشاشات المكاتب والمصممين في موقعك."
    }
  },
  {
    slug: "tablet-repair",
    legacySlug: "tablet",
    bookingParam: "tablet",
    name: "Tablet Repair",
    h1: "Tablet Repair Across the UAE",
    seoTitle: "Tablet Repair Across the UAE",
    metaDescription: "Professional on-site tablet and iPad repair across the UAE for screen replacement, battery health, charging ports, software and connectivity.",
    heroSubtitle: "Convenient on-site repair for Apple iPads, Samsung Galaxy Tabs, and other tablets at your home or office anywhere across the UAE.",
    overview: {
      paragraph1: "Tablets and iPads are indispensable for children's schoolwork, corporate field operations, digital illustration, and everyday relaxation. Due to their portable nature, cracked glass displays, damaged charging ports, and declining battery runtimes are frequent headaches for tablet owners in the UAE.",
      paragraph2: "KBI Services provides on-site tablet repair across all seven Emirates. Our technicians arrive with precision tools suited for delicate glass separation and micro-electronics assembly, completing screen and battery replacements at your home or office without requiring days in a repair queue."
    },
    commonProblems: [
      {
        title: "Cracked Front Glass & Touch Screen Repair",
        description: "Replace shattered front glass and unresponsive touch digitizers while safeguarding the inner LCD/OLED display."
      },
      {
        title: "Fast Battery Drain & Swollen Batteries",
        description: "Install fresh, high-capacity battery packs to eliminate sudden shutdowns and bulging screen pressure."
      },
      {
        title: "Damaged USB-C / Lightning Charging Ports",
        description: "Repair loose, oxidised, or broken charging connectors that prevent the tablet from charging properly."
      },
      {
        title: "Stuck on Apple Logo & Boot Loops",
        description: "Restore iPadOS and Android tablet firmware from corrupted system states and update errors."
      },
      {
        title: "Front & Rear Camera Replacement",
        description: "Fix blurry video calling cameras, cracked camera lenses, and camera app freezing."
      },
      {
        title: "Speaker Distortion & Muffled Microphones",
        description: "Clean or replace internal speakers and mics so online video calls and media playback sound crisp."
      },
      {
        title: "Wi-Fi, Bluetooth & Apple Pencil Sync Drops",
        description: "Diagnose wireless antenna faults causing weak internet reception or pencil pairing disconnects."
      },
      {
        title: "Bent Frame & Chassis Straightening",
        description: "Carefully realign bent aluminum tablet enclosures to ensure new replacement screens seat flush and secure."
      }
    ],
    supportedBrands: [
      { name: "Apple iPad", models: ["iPad Pro 12.9\" & 11\"", "iPad Air (M2 & M1)", "iPad (10th, 9th, 8th Gen)", "iPad mini 6 & 5"] },
      { name: "Samsung Galaxy Tab", models: ["Galaxy Tab S9 Ultra / S9+ / S9", "Galaxy Tab S8 Series", "Galaxy Tab A9+ / A8", "Tab Active Enterprise"] },
      { name: "Microsoft Surface", models: ["Surface Pro 9", "Surface Pro 8", "Surface Go 3"] },
      { name: "Lenovo & Huawei", models: ["Lenovo Tab P12", "Tab M10", "Huawei MatePad Pro"] }
    ],
    highlights: [
      { title: "Direct to Your Location", description: "Save time by having our technician service your tablet at home or work." },
      { title: "Clean Room Precision", description: "Dust-free adhesive sealing for long-lasting screen durability." },
      { title: "Quote Upfront", description: "Inspection completed and repair quote approved before starting." },
      { title: "Warranty Coverage", description: "Written warranty terms on eligible replaced components." }
    ],
    ctaText: "Book Tablet Repair",
    relatedServices: [
      { slug: "mobile-phone-repair", name: "Mobile Phone Repair" },
      { slug: "apple-watch-repair", name: "Apple Watch Repair" },
      { slug: "laptop-repair", name: "Laptop Repair" }
    ],
    arabic: {
      name: "صيانة الأجهزة اللوحية (الآيباد والتابلت)",
      h1: "صيانة التابلت والآيباد في جميع أنحاء الإمارات",
      description: "صيانة أجهزة الآيباد والتابلت عند باب منزلك للشاشات والبطاريات ومنافذ الشحن."
    }
  },
  {
    slug: "apple-watch-repair",
    legacySlug: "apple-watch",
    bookingParam: "apple-watch",
    name: "Apple Watch Repair",
    h1: "Apple Watch Repair Across the UAE",
    seoTitle: "Apple Watch Repair Across the UAE",
    metaDescription: "On-site Apple Watch and smartwatch repair across the UAE for screen replacement, battery fixes, digital crown, sensors and charging issues.",
    heroSubtitle: "Precision smartwatch repair and glass replacement for Apple Watch Ultra, Series, and SE models across all seven Emirates.",
    overview: {
      paragraph1: "The Apple Watch is an essential everyday companion for fitness tracking, notifications, and biometric health monitoring. Because it sits constantly on your wrist, accidental door frame knocks, gym impacts, and battery aging are common issues. Repairing a smartwatch requires steady hands, specialized heating equipment, and micro-tools.",
      paragraph2: "KBI Services provides Apple Watch and smartwatch repair across the UAE. We inspect broken glass, degraded battery cells, malfunctioning Digital Crowns, and sensor arrays, executing repairs with precision adhesives to maintain proper fit and functionality."
    },
    commonProblems: [
      {
        title: "Cracked or Shattered Front Glass",
        description: "Precision replacement of broken sapphire and Ion-X front glass while preserving touch sensitivity."
      },
      {
        title: "Battery Replacement & Swelling Fix",
        description: "Replace exhausted batteries that fail to last a full day or push against the display assembly."
      },
      {
        title: "Magnetic Charging Puck Failures",
        description: "Diagnose watches getting excessively hot on the magnetic charger or failing to register charging."
      },
      {
        title: "Stuck on Apple Logo & WatchOS Boot Loops",
        description: "Resolve software update stalls, red exclamation mark errors, and failed firmware syncs."
      },
      {
        title: "Unresponsive Digital Crown & Side Button",
        description: "Clean or replace internal tactile switches and haptic feedback motors for smooth rotational scrolling."
      },
      {
        title: "Biometric Heart Rate Sensor Faults",
        description: "Inspect cracked ceramic back crystals, photoplethysmography (PPG) sensors, and ECG electrodes."
      },
      {
        title: "iPhone Bluetooth & Wi-Fi Sync Drops",
        description: "Re-establish clean wireless pairing between Apple Watch and paired iOS devices."
      }
    ],
    supportedBrands: [
      { name: "Apple Watch Ultra", models: ["Apple Watch Ultra 2 (49mm)", "Apple Watch Ultra 1 (49mm)"] },
      { name: "Apple Watch Series", models: ["Series 9 (45mm & 41mm)", "Series 8", "Series 7", "Series 6", "Series 5", "Series 4"] },
      { name: "Apple Watch SE", models: ["Apple Watch SE (2nd Gen)", "Apple Watch SE (1st Gen)"] },
      { name: "Samsung Galaxy Watch", models: ["Galaxy Watch 6 Classic", "Galaxy Watch 5 Pro", "Galaxy Watch 4"] }
    ],
    highlights: [
      { title: "Delicate Micro-Repair", description: "Specialized micro-soldering and adhesive equipment for wearable devices." },
      { title: "Convenient Doorstep Service", description: "Technician visits your location across Abu Dhabi, Dubai, and all Emirates." },
      { title: "Transparent Pricing", description: "Clear pricing confirmed before proceeding with any repair." },
      { title: "3–6 Month Warranty", description: "Warranty on eligible screen and battery replacements." }
    ],
    ctaText: "Book Apple Watch Repair",
    relatedServices: [
      { slug: "mobile-phone-repair", name: "Mobile Phone Repair" },
      { slug: "tablet-repair", name: "Tablet Repair" },
      { slug: "laptop-repair", name: "Laptop Repair" }
    ],
    arabic: {
      name: "صيانة ساعات أبل الذكية",
      h1: "صيانة ساعات أبل في جميع أنحاء الإمارات",
      description: "صيانة وإصلاح شاشات وبطاريات ساعات أبل ووتش وأبل ألترا بقطع عالية الجودة."
    }
  },
  {
    slug: "gaming-console-repair",
    legacySlug: "gaming",
    bookingParam: "gaming",
    name: "PlayStation & Xbox Repair",
    h1: "PlayStation & Xbox Repair Across the UAE",
    seoTitle: "PlayStation & Xbox Repair Across the UAE",
    metaDescription: "Professional PlayStation and Xbox repair across the UAE for HDMI, overheating, power, storage, fan, controller and software problems.",
    heroSubtitle: "On-site gaming console diagnostics and repair for PS5, PS4, Xbox Series X/S, and Nintendo Switch across all seven Emirates.",
    overview: {
      paragraph1: "Modern gaming consoles are advanced entertainment systems packed with custom silicon, high-speed NVMe storage, and demanding thermal architectures. When an HDMI port gets bumped during moving, a cooling fan chokes with desert dust, or a system shuts down mid-match due to overheating, getting fast assistance is essential for gamers.",
      paragraph2: "KBI Services offers dedicated gaming console repair across the UAE. We travel to your doorstep to diagnose HDMI port failures, clean blocked heatsinks, replace liquid metal or thermal paste, upgrade storage, and repair optical disc drives for PlayStation 5, Xbox Series X, and Nintendo Switch."
    },
    commonProblems: [
      {
        title: "PS5 & Xbox HDMI Port Replacement",
        description: "Repair bent pins, loose solder pads, and broken HDMI 2.1 ports outputting black screens or 'No Signal'."
      },
      {
        title: "Overheating & Mid-Game Emergency Shutdown",
        description: "Eliminate thermal shutdown warnings, clean clogged heatsink fins, and renew dried thermal paste."
      },
      {
        title: "Loud, Whining Fan Noise (Jet Engine Noise)",
        description: "Disassemble internal blower fans, remove fine dust layers, and replace failing fan bearings."
      },
      {
        title: "No Power / Blinking Light of Death",
        description: "Diagnose internal power supply units (PSU), mainboard short circuits, and power regulator chips."
      },
      {
        title: "Blu-ray Disc Drive Reading & Eject Errors",
        description: "Replace optical laser lenses that fail to read game discs, and fix mechanical disc rollers."
      },
      {
        title: "High-Speed M.2 NVMe SSD Expansion",
        description: "Install and format compatible Gen4 NVMe solid-state drives for expanded game library storage."
      },
      {
        title: "Controller Stick Drift & Sync Issues",
        description: "Diagnose analog stick drifting, loose bumper buttons, and wireless pairing disconnects on DualSense and Xbox controllers."
      },
      {
        title: "System Software Rebuild & Database Recovery",
        description: "Restore corrupted system operating systems, resolve safe mode loops, and recover console storage."
      }
    ],
    supportedBrands: [
      { name: "Sony PlayStation", models: ["PlayStation 5 (Disc & Digital)", "PlayStation 5 Slim", "PlayStation 4 Pro", "PlayStation 4 Slim"] },
      { name: "Microsoft Xbox", models: ["Xbox Series X", "Xbox Series S", "Xbox One X", "Xbox One S"] },
      { name: "Nintendo", models: ["Nintendo Switch OLED", "Nintendo Switch Standard", "Nintendo Switch Lite"] },
      { name: "Controllers & Peripherals", models: ["DualSense Wireless", "DualSense Edge", "Xbox Elite Series 2", "Joy-Con Controllers"] }
    ],
    highlights: [
      { title: "On-Site Diagnostics", description: "Convenient inspection right at your gaming setup." },
      { title: "Micro-Soldering Capability", description: "Precision replacement of micro HDMI ports and board connectors." },
      { title: "Safe Thermal Materials", description: "Proper handling of liquid metal barriers and high-performance thermal paste." },
      { title: "Written Warranty", description: "3–6 month coverage on eligible hardware repair parts." }
    ],
    ctaText: "Book Gaming Console Repair",
    relatedServices: [
      { slug: "tv-repair", name: "TV Repair" },
      { slug: "tv-installation", name: "TV Installation" },
      { slug: "computer-repair", name: "Computer & PC Repair" }
    ],
    arabic: {
      name: "صيانة أجهزة الألعاب وبلايستيشن وإكس بوكس",
      h1: "صيانة بلايستيشن وإكس بوكس في جميع أنحاء الإمارات",
      description: "صيانة أجهزة بلايستيشن وإكس بوكس وإصلاح منافذ HDMI ومشاكل الحرارة العالية ومزود الطاقة."
    }
  },
  {
    slug: "cctv",
    legacySlug: "cctv",
    bookingParam: "cctv",
    name: "CCTV Installation & Maintenance",
    h1: "CCTV Installation & Maintenance Across the UAE",
    seoTitle: "CCTV Installation & Maintenance Across the UAE",
    metaDescription: "Professional CCTV installation, setup and maintenance for homes and businesses across the UAE.",
    heroSubtitle: "Complete security camera setup, DVR/NVR configuration, mobile app viewing, and scheduled maintenance for villas, offices, and warehouses across all seven Emirates.",
    overview: {
      paragraph1: "Protecting your family, property, and business assets requires a dependable surveillance system. Whether you need a brand-new IP camera network installed in a villa, an analog DVR system upgraded to 4K color night vision, or troubleshooting for disconnected cameras, expert technical execution is paramount for continuous recording.",
      paragraph2: "KBI Services provides end-to-end CCTV installation, cabling, camera mounting, and preventative maintenance across the UAE. We work with leading surveillance brands including Hikvision, Dahua, Uniview, and Ezviz, configuring secure remote viewing on your mobile phones and tablets so you can monitor your property from anywhere."
    },
    commonProblems: [
      {
        title: "Full CCTV System Installation & Setup",
        description: "Turnkey planning, camera mounting, Cat6 cabling, and PoE switch installation for villas, shops, and offices."
      },
      {
        title: "DVR / NVR Recorder Setup & Storage",
        description: "Install surveillance-grade hard drives, configure continuous/motion recording, and setup overwrite cycles."
      },
      {
        title: "Remote Mobile App Viewing Configuration",
        description: "Configure secure cloud accounts (Hik-Connect, DMSS, EZVIZ) for live streaming and playback on iOS and Android."
      },
      {
        title: "Camera Black Screen & Video Loss",
        description: "Troubleshoot broken coaxial connectors, severed Cat6 lines, damaged PoE ports, and power supply failures."
      },
      {
        title: "Infrared Night Vision & ColorVu Tuning",
        description: "Fix foggy night vision, glare reflection on dome covers, and calibrate supplementary white-light illumination."
      },
      {
        title: "IP Camera Network Addressing & PoE Wiring",
        description: "Resolve IP address conflicts, configure dedicated surveillance VLANs, and terminate weatherproof RJ45 jacks."
      },
      {
        title: "Scheduled Preventative Maintenance",
        description: "Clean external camera lenses, inspect weather-sealed junction boxes, test recording retention, and tighten brackets."
      },
      {
        title: "Existing System Upgrades & Expansion",
        description: "Add new 4K cameras to existing setups and replace outdated low-resolution analog recorders."
      }
    ],
    supportedBrands: [
      { name: "Hikvision", models: ["ColorVu 4K Series", "AcuSense AI Cameras", "TandemVu PTZ", "DeepinView NVRs"] },
      { name: "Dahua Technology", models: ["TiOC Three-in-One", "WizSense AI Series", "Starlight Full-Color", "XVR & NVR Recorders"] },
      { name: "Uniview (UNV)", models: ["Prime Series", "Easy Series", "Tri-Guard Cameras", "PoE NVRs"] },
      { name: "Ezviz & IMOU", models: ["Ezviz C6N & C3W", "IMOU Cruiser & Ranger", "Solar Battery Cameras"] },
      { name: "TP-Link & CP Plus", models: ["Tapo C310 / C200", "VIGI Commercial Series", "CP Plus Orange Line"] }
    ],
    highlights: [
      { title: "Residential & Commercial", description: "Villas, retail shops, corporate offices, warehouses, and storage facilities." },
      { title: "Clean, Concealed Cabling", description: "Neat surface trunking and concealed conduit routing that preserves your interior." },
      { title: "Remote Access Guaranteed", description: "We test mobile streaming on all your devices before leaving." },
      { title: "Service Warranty", description: "Warranty on supplied cameras, storage drives, and installation workmanship." }
    ],
    ctaText: "Request CCTV Service",
    relatedServices: [
      { slug: "network-support", name: "Network Installation & Support" },
      { slug: "it-support", name: "IT Support" },
      { slug: "tv-installation", name: "TV Installation" }
    ],
    arabic: {
      name: "تركيب وصيانة كاميرات المراقبة",
      h1: "تركيب وصيانة كاميرات المراقبة في الإمارات",
      description: "تركيب أنظمة كاميرات المراقبة للمنازل والشركات وربطها بالهواتف الذكية مع صيانة الأعطال."
    }
  },
  {
    slug: "network-support",
    legacySlug: "networking",
    bookingParam: "networking",
    name: "Network Installation & Support",
    h1: "Network Installation & Support Across the UAE",
    seoTitle: "Network Installation & Support Across the UAE",
    metaDescription: "Professional Wi-Fi and network installation, router configuration, office cabling and troubleshooting across all seven Emirates of the UAE.",
    heroSubtitle: "High-speed Wi-Fi dead-zone elimination, mesh network deployment, Cat6 structured cabling, and router configuration across the UAE.",
    overview: {
      paragraph1: "Fast and reliable internet connectivity is the digital backbone of modern homes and businesses throughout the United Arab Emirates. Large villas with concrete walls and multi-story office layouts frequently suffer from frustrating Wi-Fi dead zones, dropping Zoom calls, and sluggish speeds despite having high-speed Etisalat or du fiber connections.",
      paragraph2: "KBI Services provides professional on-site network installation and technical support across the UAE. We design and install seamless Wi-Fi mesh systems, configure enterprise-grade routers and managed switches, terminate structured Cat6 cabling, and ensure uninterrupted wireless coverage from the basement to the rooftop."
    },
    commonProblems: [
      {
        title: "Villa & Office Wi-Fi Dead Zone Elimination",
        description: "Deploy access points and unified mesh nodes to blanket multi-floor villas and large offices in strong, fast Wi-Fi."
      },
      {
        title: "Seamless Roaming Mesh Wi-Fi Setup",
        description: "Configure centralized mesh controllers that smoothly transition devices between nodes without disconnecting calls."
      },
      {
        title: "Router, Managed Switch & Firewall Setup",
        description: "Configure Gigabit/10G switches, VLAN network segmentation, and secure perimeter firewalls."
      },
      {
        title: "Frequent Disconnections & High Latency",
        description: "Perform spectrum frequency analysis, eliminate channel congestion, and resolve packet loss causes."
      },
      {
        title: "Structured Cat6 / Cat6a Data Cabling",
        description: "Neat network cable pulling, keystone jack termination, patch panel labeling, and server rack dressing."
      },
      {
        title: "ISP Gateway (Etisalat / du) Integration",
        description: "Configure bridge mode, custom DNS routing, and integrate ISP fiber modems with third-party routers."
      },
      {
        title: "Isolated Guest Wi-Fi & Smart Home IoT Networks",
        description: "Create secure, isolated sub-networks for visitors and smart home devices to safeguard main data."
      },
      {
        title: "Secure Remote VPN Configuration",
        description: "Set up encrypted VPN tunnels allowing remote staff to securely access company file servers and printers."
      }
    ],
    supportedBrands: [
      { name: "Ubiquiti UniFi", models: ["UniFi Dream Machine", "UniFi U6 Pro APs", "UniFi U6 Enterprise", "PoE Managed Switches"] },
      { name: "Cisco & Meraki", models: ["Cisco Business Series", "Catalyst Switches", "Meraki Go Cloud APs", "RV Routers"] },
      { name: "TP-Link", models: ["Deco XE75 / X50 Mesh", "Omada Software-Defined SDN", "Archer Wi-Fi 6/7 Routers"] },
      { name: "Netgear", models: ["Orbi Wi-Fi 6E/7 Quad-Band", "Nighthawk Pro Gaming", "ProSafe Switches"] },
      { name: "Linksys & D-Link", models: ["Velop Intelligent Mesh", "D-Link Eagle Pro AI", "DAP Business APs"] },
      { name: "Huawei", models: ["OptiXstar Fiber Routers", "AirEngine Wi-Fi 6 APs", "HiSilicon Mesh"] }
    ],
    highlights: [
      { title: "Full Villa & Office Coverage", description: "Custom signal mapping to eliminate every stubborn weak spot." },
      { title: "Gigabit-Speed Optimization", description: "Get the full speed you pay for across all your connected devices." },
      { title: "Clean Hardware Mounting", description: "Ceiling-mounted and wall-mounted access points with concealed cabling." },
      { title: "Enterprise & Home", description: "Tailored solutions from family villas to multi-user corporate offices." }
    ],
    ctaText: "Book Network Support",
    relatedServices: [
      { slug: "it-support", name: "IT Support" },
      { slug: "cctv", name: "CCTV Installation & Maintenance" },
      { slug: "computer-repair", name: "Computer & PC Repair" }
    ],
    arabic: {
      name: "تركيب ودعم شبكات الواي فاي والإنترنت",
      h1: "تركيب ودعم الشبكات في جميع أنحاء الإمارات",
      description: "تغطية الفلل والمكاتب بشبكات واي فاي قوية وسريعة وحل مشاكل بطء وانقطاع الإنترنت."
    }
  },
  {
    slug: "it-support",
    legacySlug: "tech-support",
    bookingParam: "tech-support",
    name: "IT Support",
    h1: "Professional IT Support Across the UAE",
    seoTitle: "IT Support Across the UAE",
    metaDescription: "On-demand IT support and technical assistance for homes, offices and businesses across the UAE. Hardware diagnostics, software troubleshooting and network help.",
    heroSubtitle: "On-demand technical assistance, workstation troubleshooting, cloud configuration, and systems maintenance for homes and businesses across the UAE.",
    overview: {
      paragraph1: "In today's interconnected environment, smooth computing is indispensable for both daily work and leisure. Technical hiccups—such as sudden operating system failures, corrupted email profiles, ransomware threats, or disconnected network printers—create immediate frustration and costly operational delays.",
      paragraph2: "KBI Services provides dependable, on-demand IT support for homes, small businesses, and enterprise teams across the UAE. Our technicians arrive at your location with comprehensive troubleshooting capabilities for Windows, macOS, Microsoft 365, local networks, and peripheral devices, resolving technology headaches swiftly."
    },
    commonProblems: [
      {
        title: "Workstation Diagnostics & Performance Tuning",
        description: "Diagnose freezing computers, clean startup bottlenecks, and optimize system responsiveness for productive workflows."
      },
      {
        title: "Windows & macOS Operating System Fixes",
        description: "Resolve critical OS errors, broken system updates, user account corruptions, and driver conflicts."
      },
      {
        title: "Malware, Spyware & Ransomware Remediation",
        description: "Eliminate malicious software, remove unauthorized browser extensions, and apply endpoint defense settings."
      },
      {
        title: "Microsoft 365 & Business Email Configuration",
        description: "Set up Outlook, Exchange, and Google Workspace with custom company domains, SPF, DKIM, and mailbox migration."
      },
      {
        title: "Automated Cloud Backup & Data Recovery",
        description: "Implement automated backup routines (OneDrive, Google Drive, NAS) and recover accidentally deleted critical files."
      },
      {
        title: "New Computer Setup & Seamless Data Migration",
        description: "Transfer documents, software configurations, bookmarks, and user profiles to brand-new laptops or desktops."
      },
      {
        title: "Shared Office Peripherals & Scanner Setup",
        description: "Configure network printers, multi-function scanners, and shared folders across all team workstations."
      },
      {
        title: "Remote Technical Assistance",
        description: "Rapid, encrypted remote desktop sessions for quick software fixes, configurations, and user guidance."
      }
    ],
    supportedBrands: [
      { name: "Operating Systems", models: ["Windows 11 Pro", "Windows 10", "Windows Server 2022/2019", "macOS Sonoma / Ventura / Monterey"] },
      { name: "Cloud & Productivity", models: ["Microsoft 365 / Office 365", "Google Workspace", "Adobe Creative Cloud", "Dropbox Business"] },
      { name: "Business Hardware", models: ["Dell Workstations", "HP Elite Desktops", "Lenovo ThinkCentre", "Apple Mac Studio / mini"] },
      { name: "Remote Support Tools", models: ["Encrypted Remote Assist", "TeamViewer Business", "AnyDesk Enterprise"] }
    ],
    highlights: [
      { title: "Rapid On-Site Dispatch", description: "Technicians come directly to your office or home anywhere in the UAE." },
      { title: "No Tech Jargon", description: "Clear, friendly explanations and practical solutions without confusing acronyms." },
      { title: "Privacy First", description: "Strict non-disclosure and respectful handling of confidential personal and business files." },
      { title: "Flexible Plans", description: "Available for single on-demand visits as well as ongoing corporate monthly maintenance." }
    ],
    ctaText: "Request IT Support",
    relatedServices: [
      { slug: "network-support", name: "Network Installation & Support" },
      { slug: "laptop-repair", name: "Laptop Repair" },
      { slug: "computer-repair", name: "Computer & PC Repair" }
    ],
    arabic: {
      name: "الدعم الفني وتقنية المعلومات",
      h1: "الدعم الفني وتقنية المعلومات في الإمارات",
      description: "خدمات الدعم الفني وحلول مشاكل الأنظمة والبرامج والبريد الإلكتروني للشركات والمنازل."
    }
  },
  {
    slug: "tv-installation",
    legacySlug: "tv-install",
    bookingParam: "tv-install",
    name: "TV Installation",
    h1: "Professional TV Installation Across the UAE",
    seoTitle: "TV Installation Across the UAE",
    metaDescription: "Professional TV wall mounting, bracket installation, cable concealment and smart TV setup across the UAE. Safe, secure on-site service.",
    heroSubtitle: "Safe, precision TV wall mounting, heavy-duty bracket installation, and concealed cable trunking for all screen sizes across all seven Emirates.",
    overview: {
      paragraph1: "Wall-mounting a large modern television transforms your living room or conference space into a clean, cinematic environment. However, mounting heavy displays—ranging from 55 inches up to 85 inches or more—on hollow partition drywall or tough concrete walls requires structural wall anchors, precise leveling, and heavy-duty brackets to prevent dangerous drops.",
      paragraph2: "KBI Services provides professional TV installation across the UAE. Our technicians arrive with commercial-grade mounting hardware, precision laser levels, and cable concealment trunking, ensuring your television is mounted securely at the ideal eye-level height with all connected devices neatly arranged."
    },
    commonProblems: [
      {
        title: "Precision TV Wall Mounting on Any Wall Type",
        description: "Secure mounting on concrete, solid brick, hollow block, wooden studs, and gypsum drywall partitions."
      },
      {
        title: "Bracket Installation (Fixed, Tilt & Full-Motion)",
        description: "Install slim flush-mount brackets, tilting brackets for glare reduction, or heavy-duty cantilever swivel arms."
      },
      {
        title: "Clean Surface Trunking & Cable Concealment",
        description: "Hide dangling power cords, HDMI cables, and antenna wires inside neat surface trunking or in-wall conduits."
      },
      {
        title: "Extra-Large Display Mounting (65\", 75\", 85\"+)",
        description: "Two-technician safety mounting for heavy, ultra-large screens, Neo QLED, and OLED displays."
      },
      {
        title: "Soundbar & Home Theater Speaker Mounting",
        description: "Mount matching soundbars below the display with clean eARC HDMI or optical audio connections."
      },
      {
        title: "Smart TV Setup & Streaming App Hookup",
        description: "Connect to home Wi-Fi, update firmware, and configure streaming accounts (Netflix, Shahid, YouTube, Prime)."
      },
      {
        title: "Peripheral Cable Management",
        description: "Neatly organize Apple TV boxes, PlayStation, Xbox, and set-top receivers with hidden bracket attachments."
      },
      {
        title: "TV Unmounting & Relocation",
        description: "Safely unmount existing televisions, pack brackets, and re-install them in your new home or office room."
      }
    ],
    supportedBrands: [
      { name: "Samsung TVs", models: ["The Frame (Custom No-Gap Wall Mount)", "Neo QLED 85\" & 75\"", "OLED S95C Series", "Crystal UHD"] },
      { name: "LG TVs", models: ["LG OLED G-Series (Gallery Flush Mount)", "LG OLED C-Series", "QNED 75\" & 86\"", "UHD Series"] },
      { name: "Sony BRAVIA", models: ["Sony BRAVIA XR OLED", "Full Array 4K HDR", "X95L / X90L Series"] },
      { name: "TCL & Hisense", models: ["TCL 98\" / 85\" / 75\" Screens", "Hisense ULED Mini-LED", "Laser Cinema Displays"] },
      { name: "Universal Mounts", models: ["Sanus", "VonHaus", "Vogel's", "Heavy-Duty Dual-Arm Cantilever Mounts"] }
    ],
    highlights: [
      { title: "Laser-Level Accuracy", description: "Precision horizontal alignment for a perfectly balanced visual viewing experience." },
      { title: "Structural Safety First", description: "Heavy-duty steel anchors tested to comfortably exceed display weight requirements." },
      { title: "No Mess Left Behind", description: "We use drill dust catchers and vacuum the work area thoroughly after mounting." },
      { title: "Workmanship Warranty", description: "Written warranty on the stability and security of our wall-mounting installation." }
    ],
    ctaText: "Book TV Installation",
    relatedServices: [
      { slug: "tv-repair", name: "TV Repair" },
      { slug: "cctv", name: "CCTV Installation & Maintenance" },
      { slug: "gaming-console-repair", name: "PlayStation & Xbox Repair" }
    ],
    arabic: {
      name: "تركيب وتثبيت التلفزيونات على الحائط",
      h1: "تركيب التلفزيونات في جميع أنحاء الإمارات",
      description: "تركيب وتثبيت شاشات التلفزيون على الجدران بمختلف المقاسات وإخفاء الأسلاك باحترافية."
    }
  }
]

// Slug lookup map
export const SERVICES_BY_SLUG: Record<string, ServiceSeoData> = SERVICES_SEO_DATA.reduce(
  (acc, service) => {
    acc[service.slug] = service
    return acc
  },
  {} as Record<string, ServiceSeoData>
)

// Legacy slug redirection map
export const LEGACY_SLUG_MAP: Record<string, string> = {
  mobile: "mobile-phone-repair",
  laptop: "laptop-repair",
  pc: "computer-repair",
  printer: "printer-repair",
  tv: "tv-repair",
  monitor: "monitor-repair",
  tablet: "tablet-repair",
  "apple-watch": "apple-watch-repair",
  gaming: "gaming-console-repair",
  networking: "network-support",
  "tech-support": "it-support",
  "tv-install": "tv-installation",
}

export function getServiceBySlug(slug: string): ServiceSeoData | undefined {
  return SERVICES_BY_SLUG[slug]
}

export function getLegacySlugRedirect(slug: string): string | null {
  return LEGACY_SLUG_MAP[slug] || null
}

export function getAllServiceSlugs(): string[] {
  return SERVICES_SEO_DATA.map((s) => s.slug)
}
