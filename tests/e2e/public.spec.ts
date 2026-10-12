import { test, expect } from "@playwright/test";
for (const width of [320, 375, 768, 1440]) {
  test(`public pages and protected redirects at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("simpler way");
    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Create an account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "A fresh start" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto("/login?error=confirmation");
    await expect(page.getByRole("alert")).toContainText("invalid or expired");
    for (const route of ["/dashboard", "/food", "/history", "/settings"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    }
    expect(errors).toEqual([]);
  });
}
