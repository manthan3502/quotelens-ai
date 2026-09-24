import { expect, test } from "@playwright/test";

test("opens a complete fictional comparison from the landing page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "View sample comparison" }).click();

  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole("heading", { name: "10 Business Laptops - September 2026" })).toBeVisible();
  await expect(page.getByText("Northstar Systems").first()).toBeVisible();
  await expect(page.getByText("PixelPeak Supply").first()).toBeVisible();
  await expect(page.getByText("Cedar Office Tech").first()).toBeVisible();
  await expect(page.getByText("Lowest comparable calculated cost")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Line-item comparison" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print / Export PDF" })).toBeVisible();

  if (process.env.CAPTURE_DEMO_ASSET === "1") {
    await page.screenshot({ path: "docs/images/demo-comparison.png", fullPage: true });
  }
});
