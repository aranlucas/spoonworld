import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createWorld } from "../src/simulation.js";
import { serializeSave, parseSave } from "../src/storage.js";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const pause = async (page) => {
  await page.locator("#pause").click();
  await expect(page.locator("#pause")).toHaveAttribute("aria-pressed", "true");
};
const add = async (page, id) => {
  await page.locator(`[data-ingredient="${id}"]`).click();
  await page.locator("#sprinkle").click();
};
const snapshot = (page) => page.evaluate(() => window.spoonworld.snapshot());

test("desktop boots without errors or third-party requests; screenshot", async ({
  page,
}) => {
  const errors = [],
    external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4188") &&
      !r.url().startsWith("blob:")
    )
      external.push(r.url());
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("#offline-status")).toHaveText("Offline ready");
  await expect(page.locator("h1")).toHaveText("A world by the spoonful.");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "evidence/desktop-initial.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("all five goals work through the UI; illustrated guide screenshot", async ({
  page,
}) => {
  await page.goto("/");
  await pause(page);
  for (const id of [
    "herbs",
    "salt",
    "salt",
    "water",
    "chili",
    "chili",
    "sugar",
    "lemon",
    "soda",
  ])
    await add(page, id);
  const w = await snapshot(page);
  expect(w.discovered).toHaveLength(5);
  expect(w.fizz).toBeGreaterThan(10);
  await page.screenshot({
    path: "evidence/desktop-bubble-ferry.png",
    fullPage: true,
  });
  await page.locator(".guide-button").first().click();
  await expect(page.locator(".guide-entry.discovered")).toHaveCount(5);
  await expect(page.locator("#guide-dialog")).toContainText("The bubble ferry");
  await page.screenshot({ path: "evidence/field-guide.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.locator("#guide-dialog")).not.toBeVisible();
});
test("undo restores exact state, reset is seeded, and reset can be undone", async ({
  page,
}) => {
  await page.goto("/");
  await pause(page);
  const initial = await snapshot(page);
  await add(page, "herbs");
  const grown = await snapshot(page);
  expect(grown.discovered).toContain("grove");
  await page.locator("#undo").click();
  expect(await snapshot(page)).toEqual(initial);
  await add(page, "lemon");
  await add(page, "soda");
  const fizz = await snapshot(page);
  await page.locator("#reset").click();
  expect(await snapshot(page)).toEqual(createWorld(initial.seed));
  await page.locator("#undo").click();
  expect(await snapshot(page)).toEqual(fizz);
});
test("world and undo history persist across reload", async ({ page }) => {
  await page.goto("/");
  await pause(page);
  await add(page, "herbs");
  await add(page, "sugar");
  const before = await snapshot(page);
  await page.reload();
  await pause(page);
  expect(await snapshot(page)).toEqual(before);
  await expect(page.locator("#undo")).toBeEnabled();
  await page.locator("#undo").click();
  expect((await snapshot(page)).doses).toBe(1);
});
test("seed changes produce different terrain and are reversible", async ({
  page,
}) => {
  await page.goto("/");
  await pause(page);
  const before = await snapshot(page);
  await page.locator("#seed-open").click();
  await page.locator("#seed-input").fill("wild-thyme");
  await page.locator("#seed-form button[type=submit]").click();
  expect(await snapshot(page)).toEqual(createWorld("wild-thyme"));
  await page.locator("#undo").click();
  expect(await snapshot(page)).toEqual(before);
});
test("export/import preserves world; invalid file leaves bowl untouched", async ({
  page,
}) => {
  await page.goto("/");
  await pause(page);
  await add(page, "herbs");
  const before = await snapshot(page),
    downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await downloadPromise;
  const exported = await readFile(await download.path(), "utf8");
  expect(parseSave(exported).world).toEqual(before);
  await page.locator("#reset").click();
  await page.locator("#import-file").setInputFiles({
    name: "saved.json",
    mimeType: "application/json",
    buffer: Buffer.from(exported),
  });
  await expect(page.locator("#toast")).toContainText("World imported");
  expect(await snapshot(page)).toEqual(before);
  await page.locator("#import-file").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"hello":42}'),
  });
  await expect(page.locator("#toast")).toContainText("not a valid");
  expect(await snapshot(page)).toEqual(before);
});
test("corrupt saved data recovers to a usable new bowl", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("spoonworld.save.v1", "{broken"),
  );
  await page.goto("/");
  await expect(page.locator("#toast")).toContainText("could not be read");
  await pause(page);
  await add(page, "herbs");
  expect((await snapshot(page)).discovered).toContain("grove");
});
test("storage quota failure offers export and retry, retry recovers", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
    window.restoreStorage = () => {
      Storage.prototype.setItem = original;
    };
  });
  await page.goto("/");
  await expect(page.locator("#save-status")).toContainText("Save unavailable");
  await pause(page);
  await add(page, "herbs");
  expect((await snapshot(page)).doses).toBe(1);
  await expect(page.locator("#save-retry")).toBeVisible();
  await page.evaluate(() => window.restoreStorage());
  await page.locator("#save-retry").click();
  await expect(page.locator("#save-status")).toContainText(
    "Saved on this device",
  );
});
test("production works after an offline reload, including ingredients and persistence", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator("#offline-status")).toHaveText("Offline ready");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await pause(page);
  await add(page, "herbs");
  const before = await snapshot(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  await pause(page);
  expect(await snapshot(page)).toEqual(before);
  await add(page, "sugar");
  expect((await snapshot(page)).discovered).toContain("glow");
  await page.screenshot({ path: "evidence/offline.png", fullPage: true });
  await context.setOffline(false);
});
test.describe("touch device", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  test("mobile touch adds once at the selected patch; no overflow; screenshot", async ({
    page,
  }) => {
    await page.goto("/");
    await pause(page);
    const box = await page.locator("canvas").boundingBox();
    await page.touchscreen.tap(
      box.x + box.width * 0.5,
      box.y + box.height * (307 / 640),
    );
    expect((await snapshot(page)).doses).toBe(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: "evidence/mobile.png", fullPage: true });
    await page.locator(".guide-button").first().click();
    await expect(page.locator("#guide-dialog")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});
test("keyboard and reduced motion work; resources remain bounded", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await pause(page);
  await page.keyboard.press("6");
  await page.locator("#world-view").focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  expect((await snapshot(page)).doses).toBe(1);
  expect(await page.evaluate(() => window.spoonworld.selected())).toEqual({
    ingredient: "lemon",
    target: 29,
  });
  for (let i = 0; i < 25; i++) await page.locator("#sprinkle").click();
  const debug = await page.evaluate(() => window.spoonworld.debug());
  expect(debug.history).toBe(12);
  expect(debug.particles).toBe(0);
  expect(debug.cells).toBe(61);
  expect(debug.residents).toBe(12);
  expect(debug.canvas).toBe(960 * 640);
  await page.keyboard.press("z");
  expect((await snapshot(page)).doses).toBe(25);
});
test("desktop, guide, and mobile have no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  const reports = [];
  reports.push({
    surface: "desktop",
    ...(await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()),
  });
  await page.locator(".guide-button").first().click();
  reports.push({
    surface: "guide",
    ...(await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()),
  });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  reports.push({
    surface: "mobile",
    ...(await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()),
  });
  await writeFile(
    "evidence/accessibility-results.json",
    JSON.stringify(
      reports.map(({ surface, violations }) => ({ surface, violations })),
      null,
      2,
    ),
  );
  for (const report of reports)
    expect(report.violations, report.surface).toEqual([]);
});
test("small phone and tablet layouts preserve usable controls", async ({
  page,
}) => {
  await page.goto("/");
  await pause(page);
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator("#sprinkle").click();
    await expect(page.locator("#sprinkle")).toBeVisible();
  }
  expect((await snapshot(page)).doses).toBe(3);
});
test("runtime clock advances and the renderer respects its bounded frame budget", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const first = await page.evaluate(() => ({
    world: window.spoonworld.snapshot(),
    debug: window.spoonworld.debug(),
  }));
  const start = Date.now();
  await page.waitForTimeout(3000);
  const last = await page.evaluate(() => ({
    world: window.spoonworld.snapshot(),
    debug: window.spoonworld.debug(),
  }));
  const metrics = await cdp.send("Performance.getMetrics");
  const report = {
    browser: page.context().browser().version(),
    elapsedMs: Date.now() - start,
    simulationTicks: last.world.tick - first.world.tick,
    renderFrames: last.debug.frames - first.debug.frames,
    budget: last.debug,
    metrics: metrics.metrics.filter((m) =>
      ["JSHeapUsedSize", "JSHeapTotalSize", "Nodes", "TaskDuration"].includes(
        m.name,
      ),
    ),
  };
  await writeFile(
    "evidence/runtime-budget.json",
    JSON.stringify(report, null, 2),
  );
  expect(report.simulationTicks).toBeGreaterThanOrEqual(2);
  expect(report.simulationTicks).toBeLessThanOrEqual(4);
  expect(report.renderFrames).toBeGreaterThan(10);
  expect(report.renderFrames).toBeLessThan(110);
  expect(report.budget.particles).toBeLessThanOrEqual(48);
});
