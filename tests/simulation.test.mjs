import test from "node:test";
import assert from "node:assert/strict";
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
} from "../src/simulation.js";
import {
  parseSave,
  serializeSave,
  saveWorld,
  loadSave,
  SAVE_KEY,
} from "../src/storage.js";

test("seeded terrain and inhabitants reproduce; distinct seeds vary", () => {
  assert.deepEqual(createWorld("thyme"), createWorld("thyme"));
  assert.notDeepEqual(createWorld("thyme").cells, createWorld("salt").cells);
  assert.equal(createWorld().cells.length, 61);
  assert.equal(createWorld().residents.length, 12);
});

test("fixed clock is independent of batch size", () => {
  let a = createWorld("test");

  for (let i = 0; i < 100; i++) a = stepWorld(a);
  assert.deepEqual(a, stepWorld(createWorld("test"), 100));
});

test("actions do not mutate their input; effects remain local", () => {
  const before = createWorld(),
    copy = structuredClone(before);

  const after = addIngredient(before, "herbs", 30);
  assert.deepEqual(before, copy);
  assert.ok(after.cells[30].herbs > before.cells[30].herbs);
  assert.equal(after.cells[0].herbs, before.cells[0].herbs);
  assert.throws(() => addIngredient(before, "unknown", 30));
  assert.throws(() => addIngredient(before, "salt", 900));
});

test("all five discoverable combinations produce causal effects", () => {
  let w = createWorld();
  w = addIngredient(w, "herbs", 30);
  assert.ok(w.discovered.includes("grove"));
  w = addIngredient(addIngredient(w, "salt", 30), "salt", 30);
  assert.ok(w.discovered.includes("sailors"));
  w = addIngredient(addIngredient(w, "water", 30), "chili", 30);
  w = addIngredient(w, "chili", 30);
  assert.ok(w.discovered.includes("rain"));
  w = addIngredient(w, "sugar", 30);
  assert.ok(w.discovered.includes("glow"));
  w = addIngredient(addIngredient(w, "lemon", 30), "soda", 30);
  assert.ok(w.fizz > 10);
  assert.ok(w.discovered.includes("ferry"));
  w = stepWorld(w);
  assert.ok(w.residents.every((r) => r.mood === "flying"));
  assert.equal(w.discovered.length, GUIDE.length);
});

test("water dilutes salt, restores a stressed grove, and cools a hot bowl", () => {
  let w = addIngredient(createWorld(), "herbs", 30);

  for (let i = 0; i < 3; i++) w = addIngredient(w, "salt", 30);
  const stress = stepWorld(w, 20).cells[30].herbs;
  assert.ok(stress < w.cells[30].herbs);

  for (let i = 0; i < 3; i++) w = addIngredient(w, "water", 30);
  assert.ok(stepWorld(w, 20).cells[30].herbs > w.cells[30].herbs);
  assert.ok(w.salinity < 30);
  assert.ok(w.heat < 26);
});

test("long randomized simulation stays finite and bounded", () => {
  let w = createWorld("stress");
  const rng = random(hashSeed("actions"));

  for (let i = 0; i < 3000; i++) {
    w = addIngredient(
      w,
      INGREDIENTS[Math.floor(rng() * 7)].id,
      Math.floor(rng() * 61),
    );
    w = stepWorld(w, 3);
    assert.ok(validateWorld(w), `Invalid world at action ${i}`);
  }

  assert.equal(w.cells.length, 61);
  assert.equal(w.residents.length, 12);
  assert.ok(w.events.length <= 6);
  assert.ok(w.discovered.length <= 5);
  assert.ok(serializeSave(w, []).length < 18000);
});

test("full save and undo history round-trip exactly", () => {
  const previous = createWorld("portable");
  const next = stepWorld(addIngredient(previous, "herbs", 30), 10);
  assert.deepEqual(parseSave(serializeSave(next, [previous])), {
    world: next,
    history: [previous],
  });
  assert.deepEqual(createWorld(next.seed), previous);
});

test("corrupt, oversized, future, and out-of-range saves are rejected", () => {
  const w = createWorld();
  assert.throws(() => parseSave("{oops"));
  assert.throws(() => parseSave("x".repeat(400001)));

  for (const invalid of [
    { ...w, version: 99 },
    { ...w, heat: Infinity },
    { ...w, discovered: ["fake"] },
    { ...w, cells: [] },
    { ...w, residents: [] },
    { ...w, doses: -1 },
  ])
    assert.throws(() =>
      parseSave(JSON.stringify({ world: invalid, history: [] })),
    );
  assert.throws(() =>
    parseSave(
      JSON.stringify({ world: w, history: Array(MAX_HISTORY + 1).fill(w) }),
    ),
  );
});

test("storage access and quota failures are recoverable", () => {
  const w = createWorld();

  const fail = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("quota");
    },
  };

  assert.equal(loadSave(fail).status, "invalid");
  assert.equal(saveWorld(fail, w, []), false);

  const map = new Map(),
    working = {
      getItem: (k) => map.get(k) || null,
      setItem: (k, v) => map.set(k, v),
    };

  assert.equal(loadSave(working).status, "empty");
  assert.equal(saveWorld(working, w, []), true);
  assert.deepEqual(loadSave(working).world, w);
  map.set(SAVE_KEY, "oops");
  assert.equal(loadSave(working).status, "invalid");
});
