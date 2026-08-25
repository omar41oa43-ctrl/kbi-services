"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const matching_1 = require("./matching");
const utils_1 = require("./utils");
(0, node_test_1.default)("normalizes and deduplicates technician data", () => {
    strict_1.default.equal((0, utils_1.normalizeSkill)("  Air   Conditioning "), "air_conditioning");
    strict_1.default.deepEqual((0, utils_1.uniqueStrings)(["a", "a", "", "b"]), ["a", "b"]);
    strict_1.default.deepEqual((0, utils_1.toStringArray)([1, "two", false]), ["1", "two", "false"]);
});
(0, node_test_1.default)("coerces finite numbers and uses safe fallbacks", () => {
    strict_1.default.equal((0, utils_1.toNumber)("12.5"), 12.5);
    strict_1.default.equal((0, utils_1.toNumber)("not-a-number", 7), 7);
    strict_1.default.equal((0, utils_1.toNumber)(null, 3), 3);
});
(0, node_test_1.default)("computes realistic distances", () => {
    const abuDhabiToDubai = (0, utils_1.haversineKm)({ lat: 24.4539, lng: 54.3773 }, { lat: 25.2048, lng: 55.2708 });
    strict_1.default.ok(abuDhabiToDubai > 120 && abuDhabiToDubai < 140);
});
(0, node_test_1.default)("matches normalized and related skills", () => {
    strict_1.default.equal((0, matching_1.skillMatch)("Air Conditioning", ["air_conditioning"]), true);
    strict_1.default.equal((0, matching_1.skillMatch)("phone_repair", ["phone"]), true);
    strict_1.default.equal((0, matching_1.skillMatch)("washing_machine", ["laptop"]), false);
});
(0, node_test_1.default)("technician scoring rewards rating and penalizes distance and load", () => {
    const nearby = (0, matching_1.scoreTechnician)({ distanceKm: 2, rating: 4.8, activeJobs: 0 });
    const busyAndFar = (0, matching_1.scoreTechnician)({ distanceKm: 15, rating: 4.8, activeJobs: 3 });
    const betterRated = (0, matching_1.scoreTechnician)({ distanceKm: 2, rating: 5, activeJobs: 0 });
    strict_1.default.ok(nearby > busyAndFar);
    strict_1.default.ok(betterRated > nearby);
});
