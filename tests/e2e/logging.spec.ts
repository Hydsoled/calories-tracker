import { test, expect } from "@playwright/test";
test("authenticated logging journey and responsive app", async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, "Requires a dedicated confirmed Supabase test account and all migrations.");
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Password", { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // This account must be dedicated to tests: the goal is deliberately updated.
  await page.goto("/settings");
  await page.getByLabel("Daily calorie goal (kcal)").fill("2000");
  await page.getByRole("button", { name: "Save goal", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Calorie goal saved" })).toBeVisible();
  await page.goto("/food");
  await page.getByLabel("Search foods in English or Georgian").fill("ხინკალი");
  await page.getByRole("button", { name: /Khinkali/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Quantity (piece)", { exact: true }).fill("6");
  await dialog.getByLabel("Calories per 1 piece", { exact: true }).fill("90");
  await expect(dialog.getByRole("status")).toHaveText("540 kcal");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: /Khinkali/ })).toBeFocused();
  // Custom label isolates this journey from existing test-account entries.
  const name = `E2E meal ${Date.now()}`;
  await page.getByRole("button", { name: "Custom food", exact: true }).click();
  await dialog.getByLabel("Food name", { exact: true }).fill(name);
  await dialog.getByLabel("Quantity (g)", { exact: true }).fill("250");
  await dialog.getByLabel("Calories per 100 g", { exact: true }).fill("165");
  await expect(dialog.getByRole("status")).toHaveText("412.5 kcal");
  await dialog.getByLabel("Override total calories").check();
  await dialog.getByLabel("Manual total calories").fill("123.456");
  await dialog.getByRole("button", { name: "Save food entry" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) });
  await expect(card).toContainText("123.456 kcal");
  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByRole("button", { name: "Use calculated total" }).click();
  await expect(dialog.getByRole("status")).toHaveText("412.5 kcal");
  await dialog.getByRole("button", { name: "Save food entry" }).click();
  await expect(card).toContainText("412.5 kcal");
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/dashboard", "/history", "/settings"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
  await page.goto("/food");
  page.once("dialog", (confirmation) => confirmation.accept());
  await card.getByRole("button", { name: `Delete ${name}`, exact: true }).click();
  await expect(card).toHaveCount(0);
});
