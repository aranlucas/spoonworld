import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorld,
  addIngredient,
  stepWorld,
  residentMode,
} from "../src/simulation.js";
import {
  residentName,
  residentObservation,
  patchObservation,
} from "../src/naturalist.js";

test("resident notes follow current modes immediately, including exhausted fizz", () => {
  let w = createWorld("notebook");
  const resident = w.residents[0];
  assert.equal(residentMode(w, resident), "wandering");
  assert.match(residentObservation(w, resident), /Wandering/);
  w = addIngredient(
    addIngredient(w, "herbs", resident.cell),
    "herbs",
    resident.cell,
  );
  assert.equal(residentMode(w, resident), "nesting");
  assert.match(residentObservation(w, resident), /Nesting/);
  w = addIngredient(addIngredient(w, "salt", 0), "salt", 0);
  assert.equal(residentMode(w, resident), "sailing");
  assert.match(residentObservation(w, resident), /30%/);
  w = addIngredient(addIngredient(w, "lemon", 30), "soda", 30);
  assert.equal(residentMode(w, resident), "flying");
  assert.match(residentObservation(w, resident), /bubble ferry/);
  w = stepWorld(w, 250);
  assert.equal(w.fizz, 0);
  assert.equal(residentMode(w, resident), "sailing");
  assert.doesNotMatch(residentObservation(w, resident), /bubble ferry/);
  const names = w.residents.map(residentName);
  assert.equal(new Set(names).size, 12);
  assert.deepEqual(
    createWorld("another-seed").residents.map(residentName),
    names,
  );
});

test("patch notes explain the actual growth thresholds without mutating a save", () => {
  const w = createWorld(),
    c = w.cells[30],
    before = structuredClone(w);

  assert.match(patchObservation(w, c), /Roots are growing/);
  assert.deepEqual(w, before);
  c.moisture = 25;
  assert.match(patchObservation(w, c), /thirsty/);
  assert.equal(stepWorld(w).cells[30].herbs < c.herbs, true);
  c.moisture = 26;
  c.salt = 65;
  assert.match(patchObservation(w, c), /wilting/);
  assert.equal(stepWorld(w).cells[30].herbs < c.herbs, true);
  c.salt = 64;
  c.herbs = 36;
  c.sugar = 16;
  assert.match(patchObservation(w, c), /flowers for glowbugs/);
  assert.equal(stepWorld(w).cells[30].flowers > c.flowers, true);
  c.herbs = 0;
  assert.match(patchObservation(w, c), /Bare ground/);
  assert.match(patchObservation(w, w.cells[0]), /quiet sea/);
  w.salinity = 30;
  assert.match(patchObservation(w, w.cells[0]), /shell boats/);
});
