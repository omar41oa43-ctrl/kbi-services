import { test, expect } from "@playwright/test";

test("download defaults to brand dark mode and allows switching themes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("kbi-theme", "light"));
  await page.goto("/download");
  const surface = page.getByTestId("download-page");
  await expect(surface).toHaveAttribute("data-theme", "dark");
  await expect(surface).toHaveCSS("background-color", "rgb(8, 18, 24)");
  await expect(page.getByTestId("android-download")).toHaveCSS(
    "background-color",
    "rgb(30, 203, 199)",
  );
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(surface).toHaveAttribute("data-theme", "light");
  await expect(surface).toHaveCSS("background-color", "rgb(244, 249, 252)");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(surface).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("kbi-theme"))).toBe(
    "light",
  );
});

test("technician branding uses the main KBI logo with a TECH label", async ({
  page,
}) => {
  await page.goto("/download");
  const logo = page.getByTestId("technician-logo");
  await expect(logo).toBeVisible();
  await expect(logo.getByText("TECH", { exact: true })).toBeVisible();
  await expect(
    logo.getByRole("img", { name: "KBI", exact: true }),
  ).toHaveAttribute("src", /\/kbi-logo\.png/);
  await expect
    .poll(() =>
      logo
        .locator("img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBeTruthy();
  await expect(
    page
      .getByRole("link", { name: "KBI Services home" })
      .getByRole("img", { name: "KBI", exact: true }),
  ).toBeVisible();
});

test("download page has a working installer link and honest platform availability", async ({
  page,
  request,
}) => {
  await page.goto("/download");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Less admin.",
  );
  const installer = page.getByTestId("android-download");
  const href = await installer.getAttribute("href");
  expect(href).toMatch(
    /^https:\/\/github\.com\/omar41oa43-ctrl\/kbi-services\/releases\/download\/v1\.4\.5\/kbi-technician\.apk$/,
  );
  const response = await request.head(href!);
  expect(response.ok()).toBeTruthy();
  await expect(
    page.getByRole("link", { name: "Download for Android", exact: true }),
  ).toHaveCount(1);
  const ios = page.getByTestId("ios-download");
  await expect(ios).toHaveAttribute("href", /v1\.4\.5\/kbi-technician\.ipa$/);
  await expect(page.getByText("Registered devices", { exact: true })).toBeVisible();
  await expect(page.getByText(/does not install directly from Safari/)).toBeVisible();
  const iosResponse = await request.head((await ios.getAttribute("href"))!);
  expect(iosResponse.ok()).toBeTruthy();
  await page.getByText("Installation & help", { exact: true }).click();
  await page.getByText("Installing on iPhone", { exact: true }).click();
  await expect(page.getByText(/APK files cannot be installed on iPhone/)).toBeVisible();
  await expect(page.getByRole("img", { name: /QR code/ })).toBeVisible();
  await expect
    .poll(
      async () =>
        await page
          .getByRole("img", { name: /QR code/ })
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
    )
    .toBeTruthy();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://kbi.services/download",
  );
});

for (const width of [320, 390, 768, 1440]) {
  test(`download layout fits ${width}px and installation help works`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/download");
    await expect(page.getByTestId("android-download")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.getByRole("link", { name: "How to install" }).click();
    await expect(page).toHaveURL(/#installation$/);
    await expect(
      page.getByRole("heading", { name: "Ready in three simple steps." }),
    ).toBeInViewport();
    await page.getByText("Already have the app?", { exact: true }).click();
    await expect(page.getByText(/Do not uninstall first/)).toBeVisible();
    await page.getByText("Can’t sign in?", { exact: true }).click();
    await expect(page.getByText(/password-reset option/)).toBeVisible();
  });
}

test("copy page link reports success only after copying", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          sessionStorage.setItem("copied-download-link", value);
        },
      },
    });
  });
  await page.goto("/download");
  await page.getByRole("button", { name: "Copy page link" }).click();
  await expect(page.getByRole("status")).toContainText("Link copied.");
  expect(
    await page.evaluate(() => sessionStorage.getItem("copied-download-link")),
  ).toBe("https://kbi.services/download");
});

test("clipboard rejection and missing QR have useful fallbacks", async ({
  page,
}) => {
  await page.route("**/technician-download-qr.png*", (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Permission denied");
        },
      },
    });
  });
  await page.goto("/download");
  await expect(
    page.getByText("Open kbi.services/download on your phone.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy page link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Could not copy automatically",
  );
});
