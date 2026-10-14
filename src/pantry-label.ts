import type { Ingredient } from "./simulation.ts";

export const pinchLabel = (item: Ingredient): string =>
  `Add ${item.id === "water" ? "a splash" : "a pinch"} of ${item.name.toLowerCase()}`;
