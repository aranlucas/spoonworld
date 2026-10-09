import { expect, test, vi } from "vitest";
import { createGame, CENTER_PATCH } from "../src/game.ts";
import { createWorld, MAX_HISTORY } from "../src/simulation.ts";
import { SAVE_KEY, serializeSave } from "../src/storage.ts";

function memoryStorage() {
  const map = new Map<string, string>();

  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

test("sprinkle records history, reports new field notes, and persists", () => {
  const storage = memoryStorage();
  const game = createGame(storage);
  const initial = game.getState().world;

  expect(game.loadStatus).toBe("empty");
  expect(game.sprinkle()?.id).toBe("grove");
  expect(game.sprinkle()).toBeUndefined();
  expect(game.getState().history).toEqual([initial, expect.anything()]);
  expect(storage.map.get(SAVE_KEY)).toBe(
    serializeSave(game.getState().world, game.getState().history),
  );
});

test("undo restores the exact prior world; reset and seed changes are undoable", () => {
  const game = createGame(memoryStorage());
  const initial = game.getState().world;

  game.sprinkle(12);
  expect(game.getState().target).toBe(12);
  expect(game.undo()).toBe(true);
  expect(game.getState().world).toBe(initial);
  expect(game.undo()).toBe(false);

  game.selectIngredient("lemon");
  game.sprinkle();
  const fizzed = game.getState().world;

  game.reset();
  expect(game.getState().world).toEqual(createWorld(initial.seed));
  expect(game.getState().target).toBe(CENTER_PATCH);
  game.undo();
  expect(game.getState().world).toBe(fizzed);

  game.changeSeed("wild-thyme");
  expect(game.getState().world).toEqual(createWorld("wild-thyme"));
  game.undo();
  expect(game.getState().world).toBe(fizzed);
});

test("history is capped", () => {
  const game = createGame(memoryStorage());

  for (let i = 0; i < MAX_HISTORY + 5; i++) game.sprinkle();
  expect(game.getState().history).toHaveLength(MAX_HISTORY);
});

test("import keeps exported history and puts the previous bowl last", () => {
  const source = createGame(memoryStorage());

  source.sprinkle();
  const exported = source.exportSave();
  const target = createGame(memoryStorage());
  const previous = target.getState().world;

  target.importSave(exported);
  expect(target.getState().world).toEqual(source.getState().world);
  expect(target.getState().history.at(-1)).toBe(previous);
  expect(target.getState().history).toHaveLength(2);
  expect(() => target.importSave('{"hello":42}')).toThrow();
  expect(target.getState().world).toEqual(source.getState().world);
});

test("loads a saved world and reports corrupt saves", () => {
  const storage = memoryStorage();
  const world = createWorld("saved");

  storage.map.set(SAVE_KEY, serializeSave(world, []));
  expect(createGame(storage).getState().world).toEqual(world);
  storage.map.set(SAVE_KEY, "{broken");
  expect(createGame(storage).loadStatus).toBe("invalid");
});

test("save failures surface in state and recover on retry", () => {
  const storage = memoryStorage();
  const game = createGame(storage);

  const setItem = vi.spyOn(storage, "setItem").mockImplementation(() => {
    throw new DOMException("Quota exceeded", "QuotaExceededError");
  });

  game.sprinkle();
  expect(game.getState().saving).toBe(false);
  setItem.mockRestore();
  expect(game.persist()).toBe(true);
  expect(game.getState().saving).toBe(true);
});

test("ticks advance the world, persist every fifth tick, and notify subscribers", () => {
  const storage = memoryStorage();
  const game = createGame(storage);
  const listener = vi.fn();
  const unsubscribe = game.subscribe(listener);

  for (let i = 0; i < 4; i++) game.tick();
  expect(storage.map.has(SAVE_KEY)).toBe(false);
  game.tick();
  expect(game.getState().world.tick).toBe(5);
  expect(storage.map.has(SAVE_KEY)).toBe(true);
  expect(listener).toHaveBeenCalledTimes(5);
  unsubscribe();
  game.togglePause();
  expect(listener).toHaveBeenCalledTimes(5);
  expect(game.getState().paused).toBe(true);
});
