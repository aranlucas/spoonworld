import { validateWorld, MAX_HISTORY } from "./simulation.js";
export const SAVE_KEY = "spoonworld.save.v1";
export function parseSave(raw) {
  if (typeof raw !== "string" || raw.length > 400000)
    throw new Error("This world file is too large or unreadable.");
  const data = JSON.parse(raw);
  if (
    !validateWorld(data.world) ||
    !Array.isArray(data.history) ||
    data.history.length > MAX_HISTORY ||
    data.history.some((w) => !validateWorld(w))
  )
    throw new Error("This is not a valid Spoonworld save.");
  return { world: data.world, history: data.history };
}
export function serializeSave(world, history) {
  return JSON.stringify({ world, history: history.slice(-MAX_HISTORY) });
}
export function loadSave(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    return raw ? { ...parseSave(raw), status: "loaded" } : { status: "empty" };
  } catch {
    return { status: "invalid" };
  }
}
export function saveWorld(storage, world, history) {
  try {
    storage.setItem(SAVE_KEY, serializeSave(world, history));
    return true;
  } catch {
    return false;
  }
}
