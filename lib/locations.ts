export type EmirateStatus = "ACTIVE" | "COMING_SOON" | "DISABLED";

export interface ServiceArea {
  id: string;
  emirateId: string;
  nameEn: string;
  nameAr: string;
  popularLandmarks?: string[];
  latitude?: number;
  longitude?: number;
  travelFee?: number;
  status: "ACTIVE" | "DISABLED";
}

export interface Emirate {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  status: EmirateStatus;
  centerLat: number;
  centerLng: number;
  defaultTravelFee: number;
  areas: ServiceArea[];
}

export interface LegacyLocation {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  landmarks: string[];
}

export const UAE_EMIRATES: Emirate[] = [
  {
    id: "abu-dhabi",
    slug: "abu-dhabi",
    nameEn: "Abu Dhabi",
    nameAr: "أبوظبي",
    status: "ACTIVE",
    centerLat: 24.4539,
    centerLng: 54.3773,
    defaultTravelFee: 0,
    areas: [
      { id: "khalifa-city", emirateId: "abu-dhabi", nameEn: "Khalifa City", nameAr: "مدينة خليفة", status: "ACTIVE" },
      { id: "al-reem-island", emirateId: "abu-dhabi", nameEn: "Al Reem Island", nameAr: "جزيرة الريم", status: "ACTIVE" },
      { id: "al-zahiyah", emirateId: "abu-dhabi", nameEn: "Al Zahiyah (Tourist Club)", nameAr: "الزاهية", status: "ACTIVE" },
      { id: "al-khalidiyah", emirateId: "abu-dhabi", nameEn: "Al Khalidiyah", nameAr: "الخالدية", status: "ACTIVE" },
      { id: "al-mushrif", emirateId: "abu-dhabi", nameEn: "Al Mushrif", nameAr: "المشرف", status: "ACTIVE" },
      { id: "al-bateen", emirateId: "abu-dhabi", nameEn: "Al Bateen", nameAr: "البطين", status: "ACTIVE" },
      { id: "yas-island", emirateId: "abu-dhabi", nameEn: "Yas Island", nameAr: "جزيرة ياس", status: "ACTIVE" },
      { id: "saadiyat-island", emirateId: "abu-dhabi", nameEn: "Saadiyat Island", nameAr: "جزيرة السعديات", status: "ACTIVE" },
      { id: "mohammed-bin-zayed", emirateId: "abu-dhabi", nameEn: "Mohammed Bin Zayed City (MBZ)", nameAr: "مدينة محمد بن زايد", status: "ACTIVE" },
      { id: "mussafah", emirateId: "abu-dhabi", nameEn: "Mussafah", nameAr: "مصفح", status: "ACTIVE" },
      { id: "al-raha-beach", emirateId: "abu-dhabi", nameEn: "Al Raha Beach", nameAr: "شاطئ الراحة", status: "ACTIVE" },
      { id: "al-shamkha", emirateId: "abu-dhabi", nameEn: "Al Shamkha", nameAr: "الشامخة", status: "ACTIVE" },
      { id: "al-falah", emirateId: "abu-dhabi", nameEn: "Al Falah", nameAr: "الفلاح", status: "ACTIVE" },
      { id: "al-karamah", emirateId: "abu-dhabi", nameEn: "Al Karamah", nameAr: "الكرامة", status: "ACTIVE" },
      { id: "al-danah", emirateId: "abu-dhabi", nameEn: "Al Danah", nameAr: "الدانة", status: "ACTIVE" },
      { id: "al-manaseer", emirateId: "abu-dhabi", nameEn: "Al Manaseer", nameAr: "المناصير", status: "ACTIVE" },
      { id: "al-ain", emirateId: "abu-dhabi", nameEn: "Al Ain City", nameAr: "مدينة العين", status: "ACTIVE" },
      { id: "other-abu-dhabi", emirateId: "abu-dhabi", nameEn: "Other Abu Dhabi Area", nameAr: "منطقة أخرى في أبوظبي", status: "ACTIVE" },
    ],
  },
  {
    id: "dubai",
    slug: "dubai",
    nameEn: "Dubai",
    nameAr: "دبي",
    status: "ACTIVE",
    centerLat: 25.2048,
    centerLng: 55.2708,
    defaultTravelFee: 0,
    areas: [
      { id: "dubai-marina", emirateId: "dubai", nameEn: "Dubai Marina", nameAr: "دبي مارينا", status: "ACTIVE" },
      { id: "downtown-dubai", emirateId: "dubai", nameEn: "Downtown Dubai", nameAr: "وسط مدينة دبي (داون تاون)", status: "ACTIVE" },
      { id: "business-bay", emirateId: "dubai", nameEn: "Business Bay", nameAr: "الخليج التجاري", status: "ACTIVE" },
      { id: "jlt", emirateId: "dubai", nameEn: "Jumeirah Lake Towers (JLT)", nameAr: "أبراج بحيرات جميرا", status: "ACTIVE" },
      { id: "jumeirah", emirateId: "dubai", nameEn: "Jumeirah (1, 2, 3)", nameAr: "جميرا", status: "ACTIVE" },
      { id: "palm-jumeirah", emirateId: "dubai", nameEn: "Palm Jumeirah", nameAr: "نخلة جميرا", status: "ACTIVE" },
      { id: "al-barsha", emirateId: "dubai", nameEn: "Al Barsha", nameAr: "البرشاء", status: "ACTIVE" },
      { id: "dubai-hills", emirateId: "dubai", nameEn: "Dubai Hills Estate", nameAr: "دبي هيلز", status: "ACTIVE" },
      { id: "al-quoz", emirateId: "dubai", nameEn: "Al Quoz", nameAr: "القوز", status: "ACTIVE" },
      { id: "deira", emirateId: "dubai", nameEn: "Deira", nameAr: "ديرة", status: "ACTIVE" },
      { id: "bur-dubai", emirateId: "dubai", nameEn: "Bur Dubai", nameAr: "بر دبي", status: "ACTIVE" },
      { id: "mirdif", emirateId: "dubai", nameEn: "Mirdif", nameAr: "مردف", status: "ACTIVE" },
      { id: "dubai-silicon-oasis", emirateId: "dubai", nameEn: "Dubai Silicon Oasis (DSO)", nameAr: "واحة دبي للسيليكون", status: "ACTIVE" },
      { id: "international-city", emirateId: "dubai", nameEn: "International City", nameAr: "المدينة العالمية", status: "ACTIVE" },
      { id: "jvc", emirateId: "dubai", nameEn: "Jumeirah Village Circle (JVC)", nameAr: "قرية جميرا الدائرية", status: "ACTIVE" },
      { id: "jvt", emirateId: "dubai", nameEn: "Jumeirah Village Triangle (JVT)", nameAr: "مثلث قرية جميرا", status: "ACTIVE" },
      { id: "damac-hills", emirateId: "dubai", nameEn: "DAMAC Hills", nameAr: "داماك هيلز", status: "ACTIVE" },
      { id: "arabian-ranches", emirateId: "dubai", nameEn: "Arabian Ranches", nameAr: "المرابع العربية", status: "ACTIVE" },
      { id: "dubai-creek-harbour", emirateId: "dubai", nameEn: "Dubai Creek Harbour", nameAr: "خور دبي", status: "ACTIVE" },
      { id: "al-nahda-dubai", emirateId: "dubai", nameEn: "Al Nahda (Dubai)", nameAr: "النهدة (دبي)", status: "ACTIVE" },
      { id: "other-dubai", emirateId: "dubai", nameEn: "Other Dubai Area", nameAr: "منطقة أخرى في دبي", status: "ACTIVE" },
    ],
  },
  {
    id: "sharjah",
    slug: "sharjah",
    nameEn: "Sharjah",
    nameAr: "الشارقة",
    status: "ACTIVE",
    centerLat: 25.3463,
    centerLng: 55.4209,
    defaultTravelFee: 0,
    areas: [
      { id: "al-majaz", emirateId: "sharjah", nameEn: "Al Majaz (1, 2, 3)", nameAr: "المجاز", status: "ACTIVE" },
      { id: "al-nahda-sharjah", emirateId: "sharjah", nameEn: "Al Nahda (Sharjah)", nameAr: "النهدة (الشارقة)", status: "ACTIVE" },
      { id: "al-taawun", emirateId: "sharjah", nameEn: "Al Taawun", nameAr: "التعاون", status: "ACTIVE" },
      { id: "muwaileh", emirateId: "sharjah", nameEn: "Muwaileh Commercial", nameAr: "مويلح", status: "ACTIVE" },
      { id: "al-qasimia", emirateId: "sharjah", nameEn: "Al Qasimia", nameAr: "القاسمية", status: "ACTIVE" },
      { id: "al-khan", emirateId: "sharjah", nameEn: "Al Khan", nameAr: "الخان", status: "ACTIVE" },
      { id: "al-mamzar-shj", emirateId: "sharjah", nameEn: "Al Mamzar (Sharjah)", nameAr: "الممزر (الشارقة)", status: "ACTIVE" },
      { id: "al-fisht", emirateId: "sharjah", nameEn: "Al Fisht", nameAr: "الفشت", status: "ACTIVE" },
      { id: "university-city-sharjah", emirateId: "sharjah", nameEn: "University City", nameAr: "المدينة الجامعية", status: "ACTIVE" },
      { id: "al-layyeh", emirateId: "sharjah", nameEn: "Al Layyeh", nameAr: "اللّية", status: "ACTIVE" },
      { id: "al-jazzat", emirateId: "sharjah", nameEn: "Al Jazzat", nameAr: "الجزات", status: "ACTIVE" },
      { id: "al-ghubaiba", emirateId: "sharjah", nameEn: "Al Ghubaiba", nameAr: "الغبيبة", status: "ACTIVE" },
      { id: "al-rahmaniya", emirateId: "sharjah", nameEn: "Al Rahmaniya", nameAr: "الرحمانية", status: "ACTIVE" },
      { id: "al-suyoh", emirateId: "sharjah", nameEn: "Al Suyoh", nameAr: "السيوح", status: "ACTIVE" },
      { id: "industrial-area-sharjah", emirateId: "sharjah", nameEn: "Industrial Areas (Sharjah)", nameAr: "المناطق الصناعية", status: "ACTIVE" },
      { id: "other-sharjah", emirateId: "sharjah", nameEn: "Other Sharjah Area", nameAr: "منطقة أخرى في الشارقة", status: "ACTIVE" },
    ],
  },
  {
    id: "ajman",
    slug: "ajman",
    nameEn: "Ajman",
    nameAr: "عجمان",
    status: "ACTIVE",
    centerLat: 25.4052,
    centerLng: 55.5136,
    defaultTravelFee: 0,
    areas: [
      { id: "al-nuaimiya", emirateId: "ajman", nameEn: "Al Nuaimiya (1, 2, 3)", nameAr: "النعيمية", status: "ACTIVE" },
      { id: "al-rashidiya", emirateId: "ajman", nameEn: "Al Rashidiya", nameAr: "الراشدية", status: "ACTIVE" },
      { id: "al-rawda", emirateId: "ajman", nameEn: "Al Rawda (1, 2, 3)", nameAr: "الروضة", status: "ACTIVE" },
      { id: "ajman-downtown", emirateId: "ajman", nameEn: "Ajman Downtown", nameAr: "وسط مدينة عجمان", status: "ACTIVE" },
      { id: "al-mowaihat", emirateId: "ajman", nameEn: "Al Mowaihat", nameAr: "المويهات", status: "ACTIVE" },
      { id: "al-jurf", emirateId: "ajman", nameEn: "Al Jurf", nameAr: "الجرف", status: "ACTIVE" },
      { id: "al-rumailah", emirateId: "ajman", nameEn: "Al Rumailah", nameAr: "الرميلة", status: "ACTIVE" },
      { id: "ajman-corniche", emirateId: "ajman", nameEn: "Ajman Corniche", nameAr: "كورنيش عجمان", status: "ACTIVE" },
      { id: "al-hamidiya", emirateId: "ajman", nameEn: "Al Hamidiya", nameAr: "الحميدية", status: "ACTIVE" },
      { id: "al-helio", emirateId: "ajman", nameEn: "Al Helio", nameAr: "الحليو", status: "ACTIVE" },
      { id: "al-yasmeen", emirateId: "ajman", nameEn: "Al Yasmeen", nameAr: "الياسمين", status: "ACTIVE" },
      { id: "other-ajman", emirateId: "ajman", nameEn: "Other Ajman Area", nameAr: "منطقة أخرى في عجمان", status: "ACTIVE" },
    ],
  },
  {
    id: "ras-al-khaimah",
    slug: "ras-al-khaimah",
    nameEn: "Ras Al Khaimah",
    nameAr: "رأس الخيمة",
    status: "COMING_SOON",
    centerLat: 25.7895,
    centerLng: 55.9432,
    defaultTravelFee: 0,
    areas: [
      { id: "al-nakheel", emirateId: "ras-al-khaimah", nameEn: "Al Nakheel", nameAr: "النخيل", status: "ACTIVE" },
      { id: "al-hamra", emirateId: "ras-al-khaimah", nameEn: "Al Hamra Village", nameAr: "قرية الحمراء", status: "ACTIVE" },
    ],
  },
  {
    id: "fujairah",
    slug: "fujairah",
    nameEn: "Fujairah",
    nameAr: "الفجيرة",
    status: "COMING_SOON",
    centerLat: 25.1288,
    centerLng: 56.3265,
    defaultTravelFee: 0,
    areas: [
      { id: "fujairah-city", emirateId: "fujairah", nameEn: "Fujairah City", nameAr: "مدينة الفجيرة", status: "ACTIVE" },
      { id: "dibba", emirateId: "fujairah", nameEn: "Dibba Al-Fujairah", nameAr: "دبا الفجيرة", status: "ACTIVE" },
    ],
  },
  {
    id: "umm-al-quwain",
    slug: "umm-al-quwain",
    nameEn: "Umm Al Quwain",
    nameAr: "أم القيوين",
    status: "COMING_SOON",
    centerLat: 25.5647,
    centerLng: 55.5552,
    defaultTravelFee: 0,
    areas: [
      { id: "uaq-city", emirateId: "umm-al-quwain", nameEn: "Umm Al Quwain City", nameAr: "مدينة أم القيوين", status: "ACTIVE" },
      { id: "al-salamah", emirateId: "umm-al-quwain", nameEn: "Al Salamah", nameAr: "السلامة", status: "ACTIVE" },
    ],
  },
];

export function getActiveEmirates(): Emirate[] {
  return UAE_EMIRATES.filter((e) => e.status === "ACTIVE");
}

export function getAllEmirates(): Emirate[] {
  return UAE_EMIRATES;
}

export function getEmirateById(id: string): Emirate | undefined {
  return UAE_EMIRATES.find((e) => e.id.toLowerCase() === id.toLowerCase() || e.slug.toLowerCase() === id.toLowerCase());
}

export function getAreasByEmirate(emirateId: string): ServiceArea[] {
  const emirate = getEmirateById(emirateId);
  return emirate?.areas || [];
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Estimates driving time in minutes with average urban UAE traffic considerations
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 5;
  // Avg urban speed ~35 km/h -> ~1.7 min per km + 3 min buffer
  return Math.max(5, Math.round(distanceKm * 1.7 + 3));
}

/**
 * Detects closest UAE Emirate based on GPS latitude and longitude
 */
export function detectEmirateFromGPS(lat: number, lng: number): Emirate | null {
  const activeEmirates = getActiveEmirates();
  let nearestEmirate: Emirate | null = null;
  let minDistance = Infinity;

  for (const emirate of activeEmirates) {
    const dist = getHaversineDistanceKm(lat, lng, emirate.centerLat, emirate.centerLng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestEmirate = emirate;
    }
  }

  // Maximum reasonable distance within UAE bounding box (~180km)
  if (minDistance > 180) return null;
  return nearestEmirate;
}

export const locations: LegacyLocation[] = [
  {
    id: "abu-dhabi",
    slug: "abu-dhabi",
    name: "Abu Dhabi",
    nameAr: "أبوظبي",
    description: "Full on-site doorstep technology and electronic repair services across Abu Dhabi City.",
    landmarks: ["Corniche", "Al Reem Island", "Khalifa City", "Yas Island", "Al Zahiyah"],
  },
  {
    id: "dubai",
    slug: "dubai",
    name: "Dubai",
    nameAr: "دبي",
    description: "Fast doorstep mobile, laptop, and IT equipment repair across Dubai.",
    landmarks: ["Downtown Dubai", "Dubai Marina", "Business Bay", "JLT", "Palm Jumeirah", "Deira"],
  },
  {
    id: "sharjah",
    slug: "sharjah",
    name: "Sharjah",
    nameAr: "الشارقة",
    description: "On-site device diagnosis and repair appointments across Sharjah.",
    landmarks: ["Al Majaz", "Al Nahda", "Al Taawun", "Muwaileh", "Al Qasimia"],
  },
  {
    id: "ajman",
    slug: "ajman",
    name: "Ajman",
    nameAr: "عجمان",
    description: "Doorstep tech and electronics repair anywhere in Ajman.",
    landmarks: ["Al Nuaimiya", "Al Rashidiya", "Al Rawda", "Ajman Downtown", "Corniche"],
  },
  {
    id: "khalifa-city",
    slug: "khalifa-city",
    name: "Khalifa City",
    nameAr: "مدينة خليفة",
    description: "On-site tech repair services in Khalifa City, Abu Dhabi.",
    landmarks: ["Al Forsan", "Central Mall", "Etihad Plaza"],
  },
  {
    id: "al-reem-island",
    slug: "al-reem-island",
    name: "Al Reem Island",
    nameAr: "جزيرة الريم",
    description: "Doorstep device maintenance for residential towers in Al Reem Island.",
    landmarks: ["Shams Abu Dhabi", "Marina Square", "Reem Mall"],
  },
  {
    id: "dubai-marina",
    slug: "dubai-marina",
    name: "Dubai Marina",
    nameAr: "دبي مارينا",
    description: "On-site mobile and laptop service appointments in Dubai Marina.",
    landmarks: ["Marina Walk", "Marina Mall", "JBR"],
  },
  {
    id: "downtown-dubai",
    slug: "downtown-dubai",
    name: "Downtown Dubai",
    nameAr: "وسط مدينة دبي",
    description: "Doorstep repairs in Downtown Dubai, Burj Khalifa area, and Business Bay.",
    landmarks: ["Burj Khalifa", "Dubai Mall", "Financial Centre"],
  },
];
