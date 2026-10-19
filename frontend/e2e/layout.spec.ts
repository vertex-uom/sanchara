import { expect, test } from "./support";

// Design widths. Saves screenshots for comparison with the mockups
// (test-results/screens) and checks nothing scrolls sideways.
const WIDTHS = [1440, 768, 375];
const SCREENS = [
  { name: "sign-in", path: "/sign-in" },
  { name: "sign-up", path: "/sign-up" },
];

for (const width of WIDTHS) {
  for (const screen of SCREENS) {
    test(`${screen.name} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width >= 1024 ? 900 : 1000 });
      await page.goto(screen.path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("form").first()).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      await page.screenshot({ path: `test-results/screens/${screen.name}-${width}.png`, fullPage: true });
    });
  }
}
