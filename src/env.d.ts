/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
import type { IngredientId, World } from "./simulation.ts";
import type { WorldRenderer } from "./renderer.ts";

declare global {
  interface Window {
    spoonworld: Readonly<{
      snapshot: () => World;
      debug: () => ReturnType<WorldRenderer["debug"]> & {
        history: number;
        cells: number;
        residents: number;
        paused: boolean;
        saving: boolean;
      };
      selected: () => { ingredient: IngredientId; target: number };
    }>;
  }
}
