import { z } from "zod";
import { WorldSchema, MAX_HISTORY, type World } from "./simulation.ts";

export const SAVE_KEY = "spoonworld.save.v1";

export const MAX_SAVE_BYTES = 400000;

const SaveSchema = z.object({
  world: WorldSchema,
  history: z.array(WorldSchema).max(MAX_HISTORY),
});

export type SaveData = z.infer<typeof SaveSchema>;

export type LoadResult =
  | (SaveData & { status: "loaded" })
  | { status: "empty" }
  | { status: "invalid" };

export type SaveStorage = Pick<Storage, "getItem" | "setItem">;

// Saved and imported text is untrusted until it parses as a whole save.
export function parseSave(raw: string): SaveData {
  if (raw.length > MAX_SAVE_BYTES) throw new Error("This world file is too large or unreadable.");

  return SaveSchema.parse(JSON.parse(raw));
}

export function serializeSave(world: World, history: World[]): string {
  return JSON.stringify({ world, history: history.slice(-MAX_HISTORY) });
}

export function loadSave(storage: SaveStorage | null): LoadResult {
  try {
    if (!storage) throw new Error("Storage is unavailable.");
    const raw = storage.getItem(SAVE_KEY);

    return raw ? { ...parseSave(raw), status: "loaded" } : { status: "empty" };
  } catch {
    return { status: "invalid" };
  }
}

export function saveWorld(storage: SaveStorage | null, world: World, history: World[]): boolean {
  try {
    if (!storage) return false;
    storage.setItem(SAVE_KEY, serializeSave(world, history));

    return true;
  } catch {
    return false;
  }
}
