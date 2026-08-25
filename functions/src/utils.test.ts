import assert from "node:assert/strict"
import test from "node:test"

import { scoreTechnician, skillMatch } from "./matching"
import { haversineKm, normalizeSkill, toNumber, toStringArray, uniqueStrings } from "./utils"

test("normalizes and deduplicates technician data", () => {
  assert.equal(normalizeSkill("  Air   Conditioning "), "air_conditioning")
  assert.deepEqual(uniqueStrings(["a", "a", "", "b"]), ["a", "b"])
  assert.deepEqual(toStringArray([1, "two", false]), ["1", "two", "false"])
})

test("coerces finite numbers and uses safe fallbacks", () => {
  assert.equal(toNumber("12.5"), 12.5)
  assert.equal(toNumber("not-a-number", 7), 7)
  assert.equal(toNumber(null, 3), 3)
})

test("computes realistic distances", () => {
  const abuDhabiToDubai = haversineKm(
    { lat: 24.4539, lng: 54.3773 },
    { lat: 25.2048, lng: 55.2708 },
  )
  assert.ok(abuDhabiToDubai > 120 && abuDhabiToDubai < 140)
})

test("matches normalized and related skills", () => {
  assert.equal(skillMatch("Air Conditioning", ["air_conditioning"]), true)
  assert.equal(skillMatch("phone_repair", ["phone"]), true)
  assert.equal(skillMatch("washing_machine", ["laptop"]), false)
})

test("technician scoring rewards rating and penalizes distance and load", () => {
  const nearby = scoreTechnician({ distanceKm: 2, rating: 4.8, activeJobs: 0 })
  const busyAndFar = scoreTechnician({ distanceKm: 15, rating: 4.8, activeJobs: 3 })
  const betterRated = scoreTechnician({ distanceKm: 2, rating: 5, activeJobs: 0 })
  assert.ok(nearby > busyAndFar)
  assert.ok(betterRated > nearby)
})
