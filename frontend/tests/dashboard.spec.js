import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomBytes } from "node:crypto";
const routes = [
  "/",
  "/heatmap",
  "/incidents",
  "/scan",
  "/report",
  "/awareness",
  "/trends",
  "/search?q=UPI",
];
async function visit(page, path) {
  await page.goto(path);
  await page.locator("h1").waitFor();
  await page.waitForLoadState("networkidle");
}
test("all routes are accessible in both themes and emit no console warnings", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      errors.push(message.text());
  });
  for (const theme of ["dark", "light"]) {
    await page.goto("/");
    await page.evaluate(
      (value) => localStorage.setItem("crimelens_theme", value),
      theme,
    );
    for (const route of routes) {
      await visit(page, route);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        audit.violations.map((issue) => ({
          id: issue.id,
          targets: issue.nodes.map((node) => node.target),
        })),
        route + " " + theme,
      ).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});
test("mobile layouts fit the screen and the navigation menu traps focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await visit(page, route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
  await page.getByRole("button", { name: "More navigation" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement.closest("[role=dialog]"),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
test("incidents filter, paginate, export, open details, and map markers open a drawer", async ({
  page,
}) => {
  await visit(page, "/incidents");
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page.locator("#incident-category").selectOption("PHISHING");
  await page.getByRole("button", { name: "Next page" }).click();
  await page.locator("tbody button").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await download).suggestedFilename()).toBe("cyberlens-incidents.csv");
  const href = await page.locator("tbody a").first().getAttribute("href"),
    id = href.split("/").at(-1);
  await page.goto(href);
  await expect(
    page.getByRole("heading", { name: "AI intelligence summary" }),
  ).toBeVisible();
  await visit(page, "/heatmap");
  await page.locator("#map-query").fill(id);
  await expect(page.getByText("1 mapped", { exact: true })).toBeVisible();
  await page.locator(".leaflet-marker-icon").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Expand map full screen" }).click();
  await expect(
    page.getByRole("button", { name: "Exit full-screen map" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .locator("#map-query")
    .fill("no-matching-incident-for-browser-test");
  await expect(
    page.getByText("No mapped incidents", { exact: true }),
  ).toBeVisible();
});
test("real text, URL, and image analysis preserve the scan API integration", async ({
  page,
}) => {
  await visit(page, "/scan");
  await page.getByRole("button", { name: "KYC message" }).click();
  await page.getByRole("button", { name: "Analyze message" }).click();
  await expect(
    page.getByRole("button", { name: "Start another scan" }),
  ).toBeVisible({ timeout: 45000 });
  await page.getByRole("tab", { name: "URL / UPI" }).click();
  await page
    .locator("#scan-input")
    .fill("https://example.invalid/verify-kyc?otp=required");
  await page.getByRole("button", { name: "Analyze URL / UPI" }).click();
  await expect(
    page.getByRole("button", { name: "Start another scan" }),
  ).toBeVisible({ timeout: 45000 });
  await page.getByRole("tab", { name: "Image", exact: true }).click();
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 800, 200);
    ctx.fillStyle = "black";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("Your bank KYC expired", 30, 65);
    ctx.fillText("Share your OTP to verify your account", 30, 130);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#scan-file").setInputFiles({
    name: "scan-test.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await page.getByRole("button", { name: "Analyze image" }).click();
  await expect(
    page.getByRole("button", { name: "Start another scan" }),
  ).toBeVisible({ timeout: 45000 });
});
test("report validates all steps and downloads an unsubmitted local summary", async ({
  page,
}) => {
  await visit(page, "/report");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("[aria-invalid=true]").first()).toBeVisible();
  await page.locator("#report-category").selectOption("UPI_FRAUD");
  await page
    .locator("#report-title")
    .fill("Unauthorized UPI payment from impersonation");
  await page
    .locator("#report-date")
    .fill(new Date().toISOString().slice(0, 10));
  await page.locator("#report-state").fill("Maharashtra");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .locator("#report-description")
    .fill(
      "A caller impersonated a bank employee and requested an unauthorized UPI payment. Evidence has been preserved.",
    );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#report-name").fill("Browser Test");
  await page.locator("#report-email").fill("browser-test@example.invalid");
  await page.locator("#report-phone").fill("9876543210");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report summary" }).click();
  expect((await download).suggestedFilename()).toBe(
    "cyberlens-report-summary.txt",
  );
  await expect(
    page.getByRole("heading", { name: "Your report summary is ready." }),
  ).toBeVisible();
  await expect(
    page.getByText("Your report has not been submitted.", { exact: false }),
  ).toBeVisible();
});
test("registration, login, and logout work through the real authentication API", async ({
  page,
}) => {
  await visit(page, "/");
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("button", { name: "Sign in / register" }).click();
  await page
    .getByRole("button", { name: "New here? Create an account" })
    .click();
  const username = "browser_" + Date.now(),
    password = randomBytes(18).toString("base64url");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(
    await page.evaluate(() => !!localStorage.getItem("crimelens_token")),
  ).toBe(true);
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForFunction(() => !localStorage.getItem("crimelens_token"));
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("button", { name: "Sign in / register" }).click();
  await page
    .getByRole("button", { name: "Already have an account? Sign in" })
    .click();
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});
test("feed loading, service error, retry, and empty states are usable", async ({
  page,
}) => {
  await page.route("**/api/incidents?**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: "Test service unavailable",
      }),
    });
  });
  await page.goto("/incidents");
  await expect(page.locator("[aria-busy=true]").first()).toBeVisible();
  await expect(
    page.getByText("Incidents unavailable", { exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/incidents?**");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page
    .locator("#incident-query")
    .fill("no-matching-incident-for-browser-test");
  await expect(
    page.getByRole("heading", { name: "No incidents found" }),
  ).toBeVisible();
});

test("notification messages stay readable in both themes over the full-screen map", async ({
  page,
}) => {
  for (const theme of ["dark", "light"]) {
    await page.goto("/heatmap");
    await page.evaluate(
      (value) => localStorage.setItem("crimelens_theme", value),
      theme,
    );
    await visit(page, "/heatmap");
    await page.getByRole("button", { name: "Expand map full screen" }).click();
    await page.getByRole("button", { name: "Toggle heat layer" }).click();
    const toast = page
      .getByRole("status")
      .filter({ hasText: "Heat layer hidden." });
    await expect(toast).toBeVisible();
    const colors = await toast.evaluate((element) => ({
      text: getComputedStyle(element.querySelector("p")).color,
      background: getComputedStyle(element).backgroundColor,
      root: getComputedStyle(document.documentElement).color,
    }));
    expect(colors.text).toBe(
      theme === "dark" ? "rgb(241, 245, 249)" : "rgb(15, 23, 42)",
    );
    expect(colors.root).toBe(colors.text);
    expect(colors.background).toBe(
      theme === "dark" ? "rgb(15, 23, 42)" : "rgb(255, 255, 255)",
    );
    const audit = await new AxeBuilder({ page })
      .include('[aria-live="polite"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    await toast.getByRole("button", { name: "Dismiss notification" }).click();
    await expect(toast).toBeHidden();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Notifications, 0 unread live alerts" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByText(
        "New incidents will appear here as they arrive on the live intelligence stream.",
      ),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
