import { describe, expect, test } from "vitest";
import {
  createWorld,
  addIngredient,
  stepWorld,
  validateWorld,
  INGREDIENTS,
  GUIDE,
  random,
  hashSeed,
  MAX_HISTORY,
  type IngredientId,
} from "../src/simulation.ts";
import { parseSave, serializeSave, saveWorld, loadSave, SAVE_KEY } from "../src/storage.ts";

describe("simulation", () => {
  test("seeded terrain and inhabitants reproduce; distinct seeds vary", () => {
    expect(createWorld("thyme")).toEqual(createWorld("thyme"));
    expect(createWorld("thyme").cells).not.toEqual(createWorld("salt").cells);
    expect(createWorld().cells).toHaveLength(61);
    expect(createWorld().residents).toHaveLength(12);
  });

  test("fixed clock is independent of batch size", () => {
    let a = createWorld("test");

    for (let i = 0; i < 100; i++) a = stepWorld(a);
    expect(a).toEqual(stepWorld(createWorld("test"), 100));
  });

  test("actions do not mutate their input; effects remain local", () => {
    const before = createWorld(),
      copy = structuredClone(before);

    const after = addIngredient(before, "herbs", 30);

    expect(before).toEqual(copy);
    expect(after.cells[30].herbs).toBeGreaterThan(before.cells[30].herbs);
    expect(after.cells[0].herbs).toBe(before.cells[0].herbs);
    // SAFETY: deliberately bypasses the type to exercise the runtime guard.
    expect(() => addIngredient(before, "unknown" as IngredientId, 30)).toThrow();
    expect(() => addIngredient(before, "salt", 900)).toThrow();
  });

  test("all five discoverable combinations produce causal effects", () => {
    let w = addIngredient(createWorld(), "herbs", 30);

    expect(w.discovered).toContain("grove");
    w = addIngredient(addIngredient(w, "salt", 30), "salt", 30);
    expect(w.discovered).toContain("sailors");
    w = addIngredient(addIngredient(w, "water", 30), "chili", 30);
    w = addIngredient(w, "chili", 30);
    expect(w.discovered).toContain("rain");
    w = addIngredient(w, "sugar", 30);
    expect(w.discovered).toContain("glow");
    w = addIngredient(addIngredient(w, "lemon", 30), "soda", 30);
    expect(w.fizz).toBeGreaterThan(10);
    expect(w.discovered).toContain("ferry");
    w = stepWorld(w);
    expect(w.residents.every((r) => r.mood === "flying")).toBe(true);
    expect(w.discovered).toHaveLength(GUIDE.length);
  });

  test("water dilutes salt, restores a stressed grove, and cools a hot bowl", () => {
    let w = addIngredient(createWorld(), "herbs", 30);

    for (let i = 0; i < 3; i++) w = addIngredient(w, "salt", 30);
    expect(stepWorld(w, 20).cells[30].herbs).toBeLessThan(w.cells[30].herbs);

    for (let i = 0; i < 3; i++) w = addIngredient(w, "water", 30);
    expect(stepWorld(w, 20).cells[30].herbs).toBeGreaterThan(w.cells[30].herbs);
    expect(w.salinity).toBeLessThan(30);
    expect(w.heat).toBeLessThan(26);
  });

  test("long randomized simulation stays finite and bounded", () => {
    let w = createWorld("stress");
    const rng = random(hashSeed("actions"));

    for (let i = 0; i < 3000; i++) {
      w = addIngredient(w, INGREDIENTS[Math.floor(rng() * 7)].id, Math.floor(rng() * 61));
      w = stepWorld(w, 3);
      expect(validateWorld(w), `Invalid world at action ${i}`).toBe(true);
    }

    expect(w.cells).toHaveLength(61);
    expect(w.residents).toHaveLength(12);
    expect(w.events.length).toBeLessThanOrEqual(6);
    expect(w.discovered.length).toBeLessThanOrEqual(5);
    expect(serializeSave(w, []).length).toBeLessThan(18000);
    // 3,000 full save validations take ~1s locally but much longer on shared CI runners.
  }, 30_000);
});

describe("storage", () => {
  test("full save and undo history round-trip exactly", () => {
    const previous = createWorld("portable");
    const next = stepWorld(addIngredient(previous, "herbs", 30), 10);

    expect(parseSave(serializeSave(next, [previous]))).toEqual({
      world: next,
      history: [previous],
    });
    expect(createWorld(next.seed)).toEqual(previous);
  });

  test("corrupt, oversized, future, and out-of-range saves are rejected", () => {
    const w = createWorld();

    expect(() => parseSave("{oops")).toThrow();
    expect(() => parseSave("x".repeat(400001))).toThrow();
    expect(() => parseSave("null")).toThrow();

    const invalid = [
      { ...w, version: 99 },
      { ...w, heat: Infinity },
      { ...w, discovered: ["fake"] },
      { ...w, discovered: ["grove", "grove"] },
      { ...w, cells: [] },
      { ...w, cells: w.cells.map((c) => ({ ...c, land: !c.land })) },
      { ...w, residents: [] },
      { ...w, doses: -1 },
      { ...w, events: [{ tick: 0, text: "x".repeat(181) }] },
    ];

    for (const world of invalid)
      expect(() => parseSave(JSON.stringify({ world, history: [] }))).toThrow();
    expect(() =>
      parseSave(JSON.stringify({ world: w, history: Array(MAX_HISTORY + 1).fill(w) })),
    ).toThrow();
  });

  test("storage access and quota failures are recoverable", () => {
    const w = createWorld();

    const fail = {
      getItem(): string | null {
        throw Error("denied");
      },
      setItem() {
        throw Error("quota");
      },
    };

    expect(loadSave(fail).status).toBe("invalid");
    expect(loadSave(null).status).toBe("invalid");
    expect(saveWorld(fail, w, [])).toBe(false);

    const map = new Map<string, string>();

    const working = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    };

    expect(loadSave(working).status).toBe("empty");
    expect(saveWorld(working, w, [])).toBe(true);
    expect(loadSave(working)).toMatchObject({ status: "loaded", world: w });
    map.set(SAVE_KEY, "oops");
    expect(loadSave(working).status).toBe("invalid");
  });
});
