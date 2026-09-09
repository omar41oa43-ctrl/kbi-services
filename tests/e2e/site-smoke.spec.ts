import { expect, test } from "@playwright/test"

const keyPages = ["/", "/book", "/services", "/corporate", "/contact", "/track", "/ar", "/ar/book"]
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]

test("all public sitemap pages respond successfully", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "One HTTP sweep is enough")
  const sitemap = await request.get("/sitemap.xml")
  expect(sitemap.ok()).toBeTruthy()
  const xml = await sitemap.text()
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  expect(urls.length).toBeGreaterThan(20)

  const results = await Promise.all(urls.map(async (url) => ({ url, response: await request.get(url) })))
  const failures = results.filter(({ response }) => !response.ok()).map(({ url, response }) => `${response.status()} ${url}`)
  expect(failures, failures.join("\n")).toEqual([])
})

for (const viewport of viewports) {
  test(`key pages are usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const errors: string[] = []
    const isCanceledWebKitPrefetch = (text: string) => text.includes("_rsc=") && text.includes("access control checks")
    page.on("pageerror", (error) => {
      if (!isCanceledWebKitPrefetch(error.message)) errors.push(error.message)
    })
    page.on("console", (message) => {
      const text = message.text()
      if (message.type() === "error" && !isCanceledWebKitPrefetch(text)) errors.push(text)
    })

    for (const path of keyPages) {
      const started = Date.now()
      const response = await page.goto(path, { waitUntil: "domcontentloaded" })
      expect(response?.ok(), `${path} should load`).toBeTruthy()
      await expect(page.locator("main").first()).toBeVisible()
      expect(Date.now() - started, `${path} should become usable quickly`).toBeLessThan(6_000)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
      expect(overflow, `${path} must not scroll horizontally`).toBeFalsy()
    }

    expect(errors, errors.join("\n")).toEqual([])
  })
}

test("booking draft survives refresh and offline submission stays safe", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/book")
  await page.getByRole("button", { name: /Mobile Phone/ }).click()
  await page.getByRole("button", { name: "Screen", exact: true }).click()
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page.getByRole("button", { name: "Dubai", exact: true }).click()
  await page.getByRole("textbox", { name: "Area, community or building" }).fill("Dubai Marina")
  await page.getByRole("button", { name: "Continue", exact: true }).click()
  await page.getByRole("textbox", { name: "e.g. Sultan Al Nuaimi" }).fill("Automated Test")
  await page.getByRole("textbox", { name: "050 123 4567" }).fill("0500000000")
  await page.waitForTimeout(350)
  await page.reload()

  await expect(page.getByRole("textbox", { name: "e.g. Sultan Al Nuaimi" })).toHaveValue("Automated Test")
  await expect(page.getByRole("textbox", { name: "050 123 4567" })).toHaveValue("0500000000")

  await context.setOffline(true)
  await page.getByRole("button", { name: "Confirm Booking", exact: true }).click()
  await expect(page.getByText("You are offline. Check your connection and try again.")).toBeVisible()
  await context.setOffline(false)
})

test("Arabic booking controls render in Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/ar/book")
  await expect(page.getByRole("heading", { name: "احجز فنيًا" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "ما الجهاز الذي يحتاج إلى صيانة؟" })).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
})
