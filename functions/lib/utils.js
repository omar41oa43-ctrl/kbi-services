"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = toNumber;
exports.toStringArray = toStringArray;
exports.haversineKm = haversineKm;
exports.normalizeSkill = normalizeSkill;
exports.uniqueStrings = uniqueStrings;
function toNumber(v, fallback = 0) {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : fallback;
}
function toStringArray(v) {
    return Array.isArray(v) ? v.map((x) => String(x)) : [];
}
function haversineKm(a, b) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    return R * c;
}
function normalizeSkill(s) {
    return String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
}
function uniqueStrings(items) {
    const out = [];
    const seen = new Set();
    for (const raw of items) {
        const v = String(raw);
        if (!v)
            continue;
        if (seen.has(v))
            continue;
        seen.add(v);
        out.push(v);
    }
    return out;
}
