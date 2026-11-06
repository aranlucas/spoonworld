import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("failed audio activation retries on the next click and the bowl stays playable", async ({
  app,
  browser,
}) => {
  await browser.addInitScript(() => {
    // Keep the native receiver when invoking the saved method below.
    // eslint-disable-next-line typescript/unbound-method
    const resume = AudioContext.prototype.resume;
    let attempts = 0;
    AudioContext.prototype.resume = function () {
      attempts++;

      if (attempts === 1) {
        return Promise.reject(new Error("Controlled audio device failure"));
      }

      return resume.call(this);
    };
  });
  await app.open("/");
  const sound = browser.locator("#sound");
  await sound.tap();
  await expect(browser.locator("#toast")).toContainText("Sound is unavailable");
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.tap();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await browser.locator("#pause").tap();
  await expect(browser.locator("#pause")).toHaveAttribute("aria-pressed", "true");
  await browser.locator("#sprinkle").tap();
  await expect(browser.locator(".guide-count")).toHaveText("1/5");
  await sound.tap();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
});

test("canceled bowl press and right click preserve the world, then a left click works", async ({
  app,
  browser,
}) => {
  await app.open("/");
  await browser.locator("#pause").tap();
  await expect(browser.locator("#pause")).toHaveAttribute("aria-pressed", "true");
  await expect(browser.locator("canvas")).toBeVisible();

  const point = await browser.evaluate(() => {
    const canvas = document.querySelector("canvas");

    if (!canvas) {
      throw new Error("Missing bowl canvas");
    }

    const box = canvas.getBoundingClientRect();

    return {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
  });

  await browser.mouse.move(point.x, point.y);
  await browser.mouse.down();
  await browser.mouse.move(0, 0);
  await browser.mouse.up();
  await browser.mouse.move(point.x, point.y);
  await browser.locator("canvas").secondaryTap();
  await browser.keyboard.press("Escape");
  expect(await browser.evaluate(() => window.spoonworld.snapshot().doses)).toBe(0);
  await browser.mouse.down();
  await browser.mouse.up();
  expect(await browser.evaluate(() => window.spoonworld.snapshot().doses)).toBe(1);
  await browser.locator("#undo").tap();
  expect(await browser.evaluate(() => window.spoonworld.snapshot().doses)).toBe(0);
});

test("a discovered world survives reload and Undo restores the prior pinch", async ({
  app,
  browser,
}) => {
  await app.open("/");
  await browser.locator("#pause").tap();
  await expect(browser.locator("#pause")).toHaveAttribute("aria-pressed", "true");
  await browser.locator("#sprinkle").tap();
  await expect(browser.locator(".guide-count")).toHaveText("1/5");
  await browser.locator('[data-ingredient="sugar"]').tap();
  await browser.locator("#sprinkle").tap();
  await expect(browser.locator(".guide-count")).toHaveText("2/5");
  await browser.reload();
  await browser.locator("#pause").tap();
  await expect(browser.locator("#pause")).toHaveAttribute("aria-pressed", "true");
  await expect(browser.locator(".guide-count")).toHaveText("2/5");
  expect(await browser.evaluate(() => window.spoonworld.snapshot().doses)).toBe(2);
  await browser.locator("#undo").tap();
  await expect(browser.locator(".guide-count")).toHaveText("1/5");
  expect(await browser.evaluate(() => window.spoonworld.snapshot().doses)).toBe(1);
});
