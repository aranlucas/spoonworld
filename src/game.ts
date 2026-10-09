import {
  addIngredient,
  createWorld,
  stepWorld,
  GUIDE,
  MAX_HISTORY,
  type GuideEntry,
  type IngredientId,
  type World,
} from "./simulation.ts";
import {
  loadSave,
  parseSave,
  saveWorld,
  serializeSave,
  MAX_SAVE_BYTES,
  type LoadResult,
  type SaveStorage,
} from "./storage.ts";

export const CENTER_PATCH = 30;

export interface GameState {
  world: World;
  history: World[];
  ingredient: IngredientId;
  target: number;
  paused: boolean;
  saving: boolean;
}

export interface Game {
  getState(): GameState;
  subscribe(listener: () => void): () => void;
  loadStatus: LoadResult["status"];
  selectIngredient(id: IngredientId): void;
  setTarget(id: number): void;
  /** Adds the selected ingredient. Returns a newly found field note, if any. */
  sprinkle(cellId?: number): GuideEntry | undefined;
  undo(): boolean;
  reset(): void;
  changeSeed(seed: string): void;
  importSave(raw: string): void;
  exportSave(): string;
  togglePause(): boolean;
  tick(): void;
  persist(): boolean;
}

// Owns the world, its undo history, and persistence. The UI and renderer read
// snapshots; every change goes through these actions.
export function createGame(storage: SaveStorage | null): Game {
  const saved = loadSave(storage);

  let state: GameState = {
    world: saved.status === "loaded" ? saved.world : createWorld(),
    history: saved.status === "loaded" ? saved.history : [],
    ingredient: "herbs",
    target: CENTER_PATCH,
    paused: false,
    saving: true,
  };

  const listeners = new Set<() => void>();

  const update = (patch: Partial<GameState>) => {
    state = { ...state, ...patch };

    for (const listener of listeners) listener();
  };

  const withHistory = () => [...state.history, state.world].slice(-MAX_HISTORY);

  const persist = () => {
    const saving = saveWorld(storage, state.world, state.history);

    if (saving !== state.saving) update({ saving });

    return saving;
  };

  const replaceWorld = (world: World, history = withHistory()) => {
    update({ world, history, target: CENTER_PATCH });
    persist();
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    loadStatus: saved.status,
    selectIngredient: (ingredient) => update({ ingredient }),
    setTarget: (target) => update({ target }),
    sprinkle(cellId = state.target) {
      const before = state.world.discovered.length;
      const history = withHistory();
      const world = addIngredient(state.world, state.ingredient, cellId);

      update({ world, history, target: cellId });
      persist();

      return world.discovered.length > before
        ? GUIDE.find((g) => g.id === world.discovered.at(-1))
        : undefined;
    },
    undo() {
      const world = state.history.at(-1);

      if (!world) return false;
      update({ world, history: state.history.slice(0, -1) });
      persist();

      return true;
    },
    reset: () => replaceWorld(createWorld(state.world.seed)),
    changeSeed: (seed) => replaceWorld(createWorld(seed)),
    importSave(raw) {
      if (raw.length > MAX_SAVE_BYTES) throw new Error("This world file is too large.");
      const imported = parseSave(raw);

      replaceWorld(imported.world, [...imported.history, state.world].slice(-MAX_HISTORY));
    },
    exportSave: () => serializeSave(state.world, state.history),
    togglePause() {
      update({ paused: !state.paused });

      return state.paused;
    },
    tick() {
      update({ world: stepWorld(state.world) });

      if (state.world.tick % 5 === 0) persist();
    },
    persist,
  };
}
