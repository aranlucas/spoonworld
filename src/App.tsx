import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { describeWorld, weather, INGREDIENTS, type World } from "./simulation.ts";
import type { Game } from "./game.ts";
import type { Sound } from "./audio.ts";
import type { WorldCallbacks, WorldRenderer } from "./renderer.ts";
import { Icon } from "./Icon.tsx";
import { WorldView } from "./components/WorldView.tsx";
import { Pantry } from "./components/Pantry.tsx";
import { GuideDialog } from "./components/GuideDialog.tsx";
import { SeedDialog } from "./components/SeedDialog.tsx";
import { PatchDialog } from "./components/PatchDialog.tsx";

type OpenDialog = "guide" | "seed" | "patch" | null;

const PERIODS = ["morning", "afternoon", "evening", "night"];

const ARROWS = new Map<string, readonly [number, number]>([
  ["ArrowLeft", [-1, 0]],
  ["ArrowRight", [1, 0]],
  ["ArrowUp", [0, -1]],
  ["ArrowDown", [0, 1]],
] as const);

const targetDescription = (world: World, target: number) => {
  const c = world.cells[target];

  return `onto ${c.land ? "a meadow" : "a sea"} patch (${c.q}, ${c.r}) · or tap the bowl`;
};

interface AppProps {
  game: Game;
  sound: Sound;
}

export function App(props: AppProps) {
  const { game, sound } = props;
  const state = useSyncExternalStore(game.subscribe, game.getState);
  const { world, history, target, paused, saving } = state;
  const ingredient = INGREDIENTS.find((i) => i.id === state.ingredient) ?? INGREDIENTS[0];
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [toast, setToast] = useState<{ text: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const [offline, setOffline] = useState("Local & private");
  const renderer = useRef<WorldRenderer | null>(null);
  const importFile = useRef<HTMLInputElement>(null);
  const dialogOpen = useRef(false);

  dialogOpen.current = dialog !== null;

  const notify = useCallback((text: string) => {
    // A fresh object restarts the timer even when the text repeats.
    setToast({ text });
    setAnnouncement(text);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);

    return () => clearTimeout(timer);
  }, [toast]);

  const sprinkle = useCallback(
    (cellId?: number) => {
      const found = game.sprinkle(cellId);
      const { world: next, target: patch, ingredient: id } = game.getState();
      const index = INGREDIENTS.findIndex((i) => i.id === id);

      renderer.current?.sprinkle(patch, INGREDIENTS[index].color);
      sound.play(index);

      if (found) notify(`New field note: ${found.title}.`);
      else setAnnouncement(next.events[0].text);
    },
    [game, sound, notify],
  );

  const undo = useCallback(() => {
    if (game.undo()) notify("One little step back. Your previous world is restored.");
  }, [game, notify]);

  const togglePause = useCallback(() => {
    notify(
      game.togglePause()
        ? "Ecology paused. You can still sprinkle and explore."
        : "Your world is growing again.",
    );
  }, [game, notify]);

  const openPatch = (cellId = target) => {
    game.setTarget(cellId);
    setDialog("patch");
  };

  const closeDialog = (name: OpenDialog) => () =>
    setDialog((current) => (current === name ? null : current));

  // Stable callbacks so the Phaser game mounts once.
  const worldCallbacks = useMemo<WorldCallbacks>(
    () => ({ getWorld: () => game.getState().world, onTap: (cellId) => sprinkle(cellId) }),
    [game, sprinkle],
  );

  const onRendererReady = useCallback((handle: WorldRenderer | null) => {
    renderer.current = handle;
  }, []);

  useEffect(() => renderer.current?.setTarget(target), [target]);

  // Fixed one-second ecology clock. Hidden tabs and open dialogs hold the world.
  useEffect(() => {
    let last = performance.now(),
      accumulator = 0,
      frame = requestAnimationFrame(function clock(now) {
        const elapsed = Math.min(250, now - last);

        last = now;

        if (!game.getState().paused && !document.hidden && !dialogOpen.current)
          accumulator += elapsed;

        if (accumulator >= 1000) {
          accumulator -= 1000;
          game.tick();
        }

        frame = requestAnimationFrame(clock);
      });

    const onVisibility = () => {
      last = performance.now();
      accumulator = 0;
      renderer.current?.pause(document.hidden);

      if (document.hidden) game.persist();
    };

    const onPageHide = () => game.persist();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [game]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const element = e.target instanceof HTMLElement ? e.target : null;

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        dialogOpen.current ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;

      if (/^[1-7]$/.test(e.key)) game.selectIngredient(INGREDIENTS[Number(e.key) - 1].id);

      if (e.code === "Space" && !["BUTTON", "SUMMARY"].includes(element?.tagName ?? "")) {
        e.preventDefault();
        togglePause();
      }

      if (e.key.toLowerCase() === "z") undo();

      if (element?.id !== "world-view") return;

      if (e.key === "Enter") {
        e.preventDefault();
        sprinkle();
      }

      const direction = ARROWS.get(e.key);

      if (direction) {
        e.preventDefault();
        const { world: w, target: t } = game.getState();
        const c = w.cells[t];
        const next = w.cells.find((n) => n.q === c.q + direction[0] && n.r === c.r + direction[1]);

        if (next) {
          game.setTarget(next.id);
          setAnnouncement(targetDescription(w, next.id));
        }
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [game, sprinkle, togglePause, undo]);

  useEffect(() => {
    game.persist();

    if (game.loadStatus === "invalid")
      notify(
        "The previous save could not be read. A fresh bowl is ready; you can import a backup.",
      );

    if (import.meta.env.PROD && "serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then(() => setOffline("Offline ready"))
        .catch(() => setOffline("Offline cache unavailable"));
  }, [game, notify]);

  // Read-only diagnostics for tests and resource inspection. No external calls.
  useEffect(() => {
    window.spoonworld = Object.freeze({
      snapshot: () => structuredClone(game.getState().world),
      debug: () => {
        const s = game.getState();

        return {
          ...(renderer.current?.debug() ?? { particles: 0, canvas: 0, fps: 30, frames: 0 }),
          history: s.history.length,
          cells: s.world.cells.length,
          residents: s.world.residents.length,
          paused: s.paused,
          saving: s.saving,
        };
      },
      selected: () => ({ ingredient: game.getState().ingredient, target: game.getState().target }),
    });
  }, [game]);

  const toggleSound = async () => {
    try {
      const enabled = await sound.toggle();

      setSoundOn(enabled);

      if (enabled) sound.play(0);
    } catch {
      notify("Sound is unavailable in this browser. The bowl is still playable.");
    }
  };

  const exportWorld = () => {
    const url = URL.createObjectURL(new Blob([game.exportSave()], { type: "application/json" }));
    const a = document.createElement("a");

    a.href = url;
    a.download = `spoonworld-${world.seed.replace(/[^a-z0-9-]/gi, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("World exported, field notes and undo history included.");
  };

  const importWorld = async (input: HTMLInputElement) => {
    const file = input.files?.[0];

    if (!file) return;

    try {
      game.importSave(await file.text());
      notify("World imported. Undo returns to the previous bowl.");
    } catch {
      notify("That file is not a valid Spoonworld save. Your bowl is safe.");
    } finally {
      input.value = "";
    }
  };

  const conditions = weather(world);

  const levels = [
    ["heat", "WARMTH", world.heat],
    ["humidity", "MOISTURE", world.humidity],
    ["salt", "BRINE", world.salinity],
  ] as const;

  const openGuide = () => setDialog("guide");

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Spoonworld home">
          <span className="brand-mark">
            <Icon name="spoon" />
          </span>
          Spoonworld
        </a>
        <span className="edition">SMALL WORLDS / BIG POSSIBILITIES</span>
        <button className="text-button guide-button" onClick={openGuide}>
          <Icon name="book" /> Field guide{" "}
          <span className="guide-count">{world.discovered.length}/5</span>
        </button>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">AN EXPERIMENTAL LITTLE ECOSYSTEM</p>
            <h1>A world by the spoonful.</h1>
          </div>
          <p className="intro-note">
            A pinch. A splash. A happy accident.
            <br />
            See what grows when you follow your curiosity.
          </p>
        </div>
        <div className="workspace">
          <section className="world-section" aria-label="Your tiny world">
            <div className="world-top">
              <span className="world-label">
                <i /> YOUR LITTLE WORLD
              </span>
              <span className="day-label">
                DAY <b id="day">{String(Math.floor(world.tick / 40) + 1).padStart(2, "0")}</b>{" "}
                <span id="day-period">· {PERIODS[Math.floor((world.tick % 40) / 10)]}</span>
              </span>
            </div>
            <WorldView callbacks={worldCallbacks} onReady={onRendererReady} />
            <div className="canvas-prompt">
              <span className="pinch-dot" />
              <span id="canvas-hint">
                Tap a patch to{" "}
                {ingredient.id === "water"
                  ? "splash water"
                  : `sprinkle ${ingredient.name.toLowerCase()}`}
                .
              </span>
              <button id="inspect" className="patch-link" onClick={() => openPatch()}>
                Read this patch <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className="world-toolbar">
              <div className="tool-cluster">
                <button
                  id="undo"
                  className="tool-button"
                  title="Undo last pinch (Z)"
                  disabled={!history.length}
                  onClick={undo}
                >
                  <Icon name="undo" />
                  <span>Undo</span>
                </button>
                <button
                  id="pause"
                  className="tool-button"
                  title="Pause or resume (Space)"
                  aria-pressed={paused}
                  onClick={togglePause}
                >
                  <Icon name={paused ? "play" : "pause"} />
                  <span>{paused ? "Resume" : "Pause"}</span>
                </button>
                <button
                  id="reset"
                  className="tool-button"
                  title="Reset this seeded world"
                  onClick={() => {
                    game.reset();
                    notify("A fresh bowl, with the same seed. Undo brings the old one back.");
                  }}
                >
                  <Icon name="reset" />
                  <span>Reset</span>
                </button>
              </div>
              <button
                id="sound"
                className="tool-button sound-button"
                aria-pressed={soundOn}
                title="Enable gentle sound"
                onClick={toggleSound}
              >
                <Icon name="sound" />
                <span>Sound {soundOn ? "on" : "off"}</span>
              </button>
            </div>
            <div className="conditions">
              <div className="weather">
                <span id="weather-symbol">{conditions.symbol}</span>
                <div>
                  <strong id="weather-name">{conditions.name}</strong>
                  <p id="weather-note">{conditions.text}</p>
                </div>
              </div>
              <div className="meters">
                {levels.map(([id, label, value]) => (
                  <div key={id} className="meter">
                    <span>
                      {label} <b id={`${id}-value`}>{Math.round(value)}%</b>
                    </span>
                    <div>
                      <i id={`${id}-bar`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <Pantry
            selected={ingredient}
            targetDescription={targetDescription(world, target)}
            onSelect={game.selectIngredient}
            onSprinkle={() => sprinkle()}
          />
        </div>
        <section className="notebook-preview" aria-label="Latest observation">
          <div className="note-icon">
            <Icon name="book" />
          </div>
          <div className="note-text">
            <span className="eyebrow">NOTES FROM THE BOWL</span>
            <p id="observation">{world.events[0]?.text || "The bowl is quietly growing."}</p>
          </div>
          <button className="text-button guide-button" onClick={openGuide}>
            Explore the field guide <span>↗</span>
          </button>
        </section>
        <footer>
          <div className="seed-line">
            WORLD SEED{" "}
            <button id="seed-open" onClick={() => setDialog("seed")}>
              <span id="seed-name">{world.seed}</span> <Icon name="leaf" />
            </button>
          </div>
          <div className="save-line">
            <span id="save-status" className={saving ? "" : "save-failed"}>
              {saving ? "● Saved on this device" : "○ Save unavailable · export to keep"}
            </span>
            <button
              id="save-retry"
              hidden={saving}
              onClick={() =>
                notify(
                  game.persist()
                    ? "Your world is saved on this device."
                    : "Saving is still unavailable. Export keeps a portable copy.",
                )
              }
            >
              Retry save
            </button>
            <span id="offline-status">{offline}</span>
            <button id="export" onClick={exportWorld}>
              Export
            </button>
            <button id="import" onClick={() => importFile.current?.click()}>
              Import
            </button>
            <input
              ref={importFile}
              id="import-file"
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(event) => importWorld(event.currentTarget)}
            />
          </div>
        </footer>
        <p className="closing-note">No right recipe. No wrong turn. Just a little wonder.</p>
        <p id="world-summary" className="sr-only">
          {describeWorld(world)}
        </p>
        <p id="announcement" className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
      </main>
      <GuideDialog
        open={dialog === "guide"}
        world={world}
        onClose={closeDialog("guide")}
        onVisitPatch={(cellId) => openPatch(cellId)}
      />
      <SeedDialog
        open={dialog === "seed"}
        seed={world.seed}
        onClose={closeDialog("seed")}
        onSubmit={(seed) => {
          game.changeSeed(seed);
          setDialog(null);
          notify(`Hello, ${game.getState().world.seed}. A new little island is ready.`);
        }}
      />
      <PatchDialog
        open={dialog === "patch"}
        world={world}
        target={target}
        ingredient={ingredient}
        canUndo={history.length > 0}
        onClose={closeDialog("patch")}
        onTarget={game.setTarget}
        onIngredient={game.selectIngredient}
        onSprinkle={() => sprinkle()}
        onUndo={undo}
      />
      <div id="toast" role="status" aria-live="polite" hidden={!toast}>
        {toast?.text}
      </div>
    </>
  );
}
