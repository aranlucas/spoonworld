import { expect, test } from "vitest";
import { createWorld, addIngredient, stepWorld, weather, residentMode } from "@/simulation.ts";
import { residentName, residentObservation, patchObservation } from "@/naturalist.ts";

test("resident notes follow current modes immediately, including exhausted fizz", () => {
  let w = createWorld("notebook");
  const resident = w.residents[0];

  expect(residentMode(w, resident)).toBe("wandering");
  expect(residentObservation(w, resident)).toMatch(/Wandering/);
  w = addIngredient(addIngredient(w, "herbs", resident.cell), "herbs", resident.cell);
  expect(residentMode(w, resident)).toBe("nesting");
  expect(residentObservation(w, resident)).toMatch(/Nesting/);
  w = addIngredient(addIngredient(w, "salt", 0), "salt", 0);
  expect(residentMode(w, resident)).toBe("sailing");
  expect(residentObservation(w, resident)).toMatch(/30%/);
  w = addIngredient(addIngredient(w, "lemon", 30), "soda", 30);
  expect(residentMode(w, resident)).toBe("flying");
  expect(residentObservation(w, resident)).toMatch(/bubble ferry/);
  w = stepWorld(w, 250);
  expect(w.fizz).toBe(0);
  expect(residentMode(w, resident)).toBe("sailing");
  expect(residentObservation(w, resident)).not.toMatch(/bubble ferry/);

  const names = w.residents.map(residentName);

  expect(new Set(names).size).toBe(12);
  expect(createWorld("another-seed").residents.map(residentName)).toEqual(names);
});

test("patch notes explain the actual growth thresholds without mutating a save", () => {
  const w = createWorld();
  const c = w.cells[30];
  const before = structuredClone(w);

  expect(patchObservation(w, c)).toMatch(/Roots are growing/);
  expect(w).toEqual(before);
  c.moisture = 25;
  expect(patchObservation(w, c)).toMatch(/thirsty/);
  expect(stepWorld(w).cells[30].herbs).toBeLessThan(c.herbs);
  c.moisture = 26;
  c.salt = 65;
  expect(patchObservation(w, c)).toMatch(/wilting/);
  expect(stepWorld(w).cells[30].herbs).toBeLessThan(c.herbs);
  c.salt = 64;
  c.herbs = 36;
  c.sugar = 16;
  expect(patchObservation(w, c)).toMatch(/flowers for glowbugs/);
  expect(stepWorld(w).cells[30].flowers).toBeGreaterThan(c.flowers);
  c.herbs = 0;
  expect(patchObservation(w, c)).toMatch(/Bare ground/);
  expect(patchObservation(w, w.cells[0])).toMatch(/quiet sea/);
  w.salinity = 30;
  expect(patchObservation(w, w.cells[0])).toMatch(/shell boats/);
});

test.each([
  { salinity: 29.99, mode: "wandering", note: "quiet sea", weatherName: "Soft & sunny" },
  { salinity: 30, mode: "sailing", note: "shell boats", weatherName: "Briny & bright" },
])(
  "briny sea begins at 30%, including notes and sailors: $salinity",
  ({ salinity, mode, note, weatherName }) => {
    const world = { ...createWorld("notebook"), salinity };

    expect(residentMode(world, world.residents[0])).toBe(mode);
    expect(patchObservation(world, world.cells[0])).toContain(note);
    expect(weather(world).name).toBe(weatherName);
    expect(addIngredient(world, "herbs", 30).discovered.includes("sailors")).toBe(salinity === 30);
  },
);
