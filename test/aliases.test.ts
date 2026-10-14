import { expect, test } from "vitest";
import { createWorld } from "@/simulation.ts";
import { worldSeed } from "@test/helpers/world-seed.ts";

test("resolves source and test-helper aliases", () => {
  expect(createWorld(worldSeed).seed).toBe(worldSeed);
});
