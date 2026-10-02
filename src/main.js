import "./style.css";
import {
  createWorld,
  addIngredient,
  stepWorld,
  weather,
  describeWorld,
  INGREDIENTS,
  GUIDE,
  MAX_HISTORY,
} from "./simulation.js";
import { loadSave, saveWorld, parseSave, serializeSave } from "./storage.js";
import { icon } from "./icons.js";
import { mountWorld } from "./renderer.js";
import { createSound } from "./audio.js";

const $ = (selector) => document.querySelector(selector);
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
const saved = loadSave(storage);
let world = saved.world || createWorld(),
  history = saved.history || [],
  ingredient = "herbs",
  target = 30,
  paused = false,
  saving = true;
const sound = createSound();
document.querySelector("#app").innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="Spoonworld home"><span class="brand-mark">${icon("spoon")}</span>Spoonworld</a>
    <span class="edition">SMALL WORLDS / BIG POSSIBILITIES</span>
    <button class="text-button guide-button">${icon("book")} Field guide <span class="guide-count">0/5</span></button>
  </header>
  <main>
    <div class="intro"><div><p class="eyebrow">AN EXPERIMENTAL LITTLE ECOSYSTEM</p><h1>A world by the spoonful.</h1></div><p class="intro-note">A pinch. A splash. A happy accident.<br>See what grows when you follow your curiosity.</p></div>
    <div class="workspace">
      <section class="world-section" aria-label="Your tiny world">
        <div class="world-top"><span class="world-label"><i></i> YOUR LITTLE WORLD</span><span class="day-label">DAY <b id="day">01</b> <span id="day-period">· morning</span></span></div>
        <div id="world-view" tabindex="0" role="group" aria-label="Ingredient bowl. Use arrow keys to choose a patch, then Enter to add the selected ingredient."></div>
        <div class="canvas-prompt"><span class="pinch-dot"></span><span id="canvas-hint">Choose an ingredient, then tap the bowl.</span></div>
        <div class="world-toolbar">
          <div class="tool-cluster"><button id="undo" class="tool-button" title="Undo last pinch (Z)" disabled>${icon("undo")}<span>Undo</span></button><button id="pause" class="tool-button" title="Pause or resume (Space)" aria-pressed="false">${icon("pause")}<span>Pause</span></button><button id="reset" class="tool-button" title="Reset this seeded world">${icon("reset")}<span>Reset</span></button></div>
          <button id="sound" class="tool-button sound-button" aria-pressed="false" title="Enable gentle sound">${icon("sound")}<span>Sound off</span></button>
        </div>
        <div class="conditions"><div class="weather"><span id="weather-symbol">☀</span><div><strong id="weather-name">Soft & sunny</strong><p id="weather-note">A lovely day for little experiments.</p></div></div><div class="meters"><div class="meter"><span>WARMTH <b id="heat-value"></b></span><div><i id="heat-bar"></i></div></div><div class="meter"><span>MOISTURE <b id="humidity-value"></b></span><div><i id="humidity-bar"></i></div></div><div class="meter"><span>BRINE <b id="salt-value"></b></span><div><i id="salt-bar"></i></div></div></div></div>
      </section>
      <aside class="pantry" aria-label="Ingredient pantry">
        <div class="pantry-head"><span class="eyebrow">THE PANTRY</span><span class="pantry-number">01—07</span></div>
        <h2>Little things.<br> Lovely consequences.</h2><p class="pantry-instruction">Select something to sprinkle.</p>
        <div class="ingredients">${INGREDIENTS.map((i, index) => `<button class="ingredient" data-ingredient="${i.id}" aria-pressed="${i.id === ingredient}" style="--ingredient:${i.color}"><span class="ingredient-art">${icon(i.glyph)}</span><span><strong>${i.name}</strong><small>${i.note}</small></span><span class="ingredient-key">${index + 1}</span><span class="selected-check">${icon("check")}</span></button>`).join("")}</div>
        <div class="ingredient-detail"><p id="ingredient-effect"></p><button id="sprinkle" class="sprinkle-button">${icon("spoon")}<span>Add a pinch of herbs</span><span class="button-arrow">↗</span></button><span id="target-description">onto the center patch · or tap the bowl</span></div>
      </aside>
    </div>
    <section class="notebook-preview" aria-label="Latest observation"><div class="note-icon">${icon("book")}</div><div class="note-text"><span class="eyebrow">NOTES FROM THE BOWL</span><p id="observation">A small world wakes up. Every pinch changes something.</p></div><button class="text-button guide-button">Explore the field guide <span>↗</span></button></section>
    <footer><div class="seed-line">WORLD SEED <button id="seed-open"><span id="seed-name"></span> ${icon("leaf")}</button></div><div class="save-line"><span id="save-status">● Saved on this device</span><button id="save-retry" hidden>Retry save</button><span id="offline-status">Local & private</span><button id="export">Export</button><button id="import">Import</button><input id="import-file" type="file" accept=".json,application/json" hidden></div></footer>
    <p class="closing-note">No right recipe. No wrong turn. Just a little wonder.</p>
    <p id="world-summary" class="sr-only"></p><p id="announcement" class="sr-only" role="status" aria-live="polite"></p>
  </main>
  <dialog id="guide-dialog" aria-labelledby="guide-title"><div class="dialog-top"><span class="eyebrow">A NATURALIST’S KITCHEN NOTEBOOK</span><button class="icon-button dialog-close" aria-label="Close field guide">${icon("close")}</button></div><h2 id="guide-title">The unexpected field guide.</h2><p class="dialog-subtitle">Follow a clue. Try a combination. Let the bowl surprise you.</p><div id="guide-progress"></div><div id="guide-entries"></div><details class="how-to"><summary>A few gentle instructions</summary><p>Choose an ingredient, then tap a patch in the bowl. Nearby patches get a lighter dose. The large button uses your last chosen patch. Worlds evolve once a second. Pause holds the ecology still while you experiment.</p><p>On a keyboard: 1–7 select ingredients, Enter on the bowl sprinkles, arrow keys choose a patch, Space pauses, and Z undoes. Undo restores the full world before your last pinch, including its field notes. Reset starts this seed again; it can be undone. Change seeds to meet a different island.</p><p>Everything stays on this device. Export a world to keep it or move it to another browser. After the offline-ready badge appears, the installed app or this URL works without a connection. This is a whimsical ecology, not cooking or science advice.</p></details></dialog>
  <dialog id="seed-dialog" aria-labelledby="seed-title"><div class="dialog-top"><span class="eyebrow">ONE BOWL, MANY WORLDS</span><button class="icon-button dialog-close" aria-label="Close seed settings">${icon("close")}</button></div><h2 id="seed-title">A fresh little beginning.</h2><p class="dialog-subtitle">The same seed grows the same island. Your current world can be restored with Undo.</p><form id="seed-form"><label for="seed-input">Name your world seed</label><input id="seed-input" maxlength="40" required autocomplete="off"><div class="seed-presets"><button type="button" data-seed="lemon-garden">lemon-garden</button><button type="button" data-seed="sunday-soup">sunday-soup</button><button type="button" data-seed="wild-thyme">wild-thyme</button></div><button class="sprinkle-button" type="submit">Grow this world <span>↗</span></button></form></dialog>
  <div id="toast" role="status" aria-live="polite" hidden></div>`;

function pushHistory() {
  history.push(structuredClone(world));
  if (history.length > MAX_HISTORY) history.shift();
}
function persist() {
  saving = saveWorld(storage, world, history);
  $("#save-status").textContent = saving
    ? "● Saved on this device"
    : "○ Save unavailable · export to keep";
  $("#save-status").classList.toggle("save-failed", !saving);
  $("#save-retry").hidden = saving;
}
let toastTimer;
function notify(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 4500);
  $("#announcement").textContent = text;
}
function updateUI() {
  const w = weather(world);
  $("#day").textContent = String(Math.floor(world.tick / 40) + 1).padStart(
    2,
    "0",
  );
  $("#day-period").textContent =
    `· ${["morning", "afternoon", "evening", "night"][Math.floor((world.tick % 40) / 10)]}`;
  $("#weather-symbol").textContent = w.symbol;
  $("#weather-name").textContent = w.name;
  $("#weather-note").textContent = w.text;
  for (const [name, key] of [
    ["heat", "heat"],
    ["humidity", "humidity"],
    ["salt", "salinity"],
  ]) {
    $(`#${name}-value`).textContent = `${Math.round(world[key])}%`;
    $(`#${name}-bar`).style.width = `${world[key]}%`;
  }
  $("#observation").textContent =
    world.events[0]?.text || "The bowl is quietly growing.";
  $("#seed-name").textContent = world.seed;
  $(".guide-count").textContent = `${world.discovered.length}/5`;
  $("#undo").disabled = !history.length;
  $("#world-summary").textContent = describeWorld(world);
}
function selectIngredient(id) {
  ingredient = id;
  const item = INGREDIENTS.find((i) => i.id === id);
  document
    .querySelectorAll(".ingredient")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.ingredient === id)),
    );
  $("#ingredient-effect").textContent = item.effect;
  $("#sprinkle span").textContent =
    `Add ${id === "water" ? "a splash" : "a pinch"} of ${item.name.toLowerCase()}`;
  $("#canvas-hint").textContent =
    `Tap a patch to ${id === "water" ? "splash water" : `sprinkle ${item.name.toLowerCase()}`}.`;
}
function sprinkle(id = target) {
  pushHistory();
  const before = world.discovered.length;
  world = addIngredient(world, ingredient, id);
  target = id;
  const item = INGREDIENTS.find((i) => i.id === ingredient);
  renderer.sprinkle(id, item.color);
  sound.play(INGREDIENTS.indexOf(item));
  updateUI();
  persist();
  if (world.discovered.length > before)
    notify(
      `New field note: ${GUIDE.find((g) => g.id === world.discovered.at(-1)).title}.`,
    );
  else $("#announcement").textContent = world.events[0].text;
}
function setTarget(id) {
  target = id;
  const c = world.cells[id];
  $("#target-description").textContent =
    `onto ${c.land ? "a meadow" : "a sea"} patch (${c.q}, ${c.r}) · or tap the bowl`;
  renderer.setTarget(id);
}
const renderer = mountWorld("world-view", {
  getWorld: () => world,
  onSprinkle: sprinkle,
  onTarget: (id) => setTarget(id),
});
document
  .querySelectorAll(".ingredient")
  .forEach((button) =>
    button.addEventListener("click", () =>
      selectIngredient(button.dataset.ingredient),
    ),
  );
$("#sprinkle").addEventListener("click", () => sprinkle());
function undo() {
  if (!history.length) return;
  world = history.pop();
  updateUI();
  persist();
  notify("One little step back. Your previous world is restored.");
}
$("#undo").addEventListener("click", undo);
function togglePause() {
  paused = !paused;
  $("#pause").setAttribute("aria-pressed", String(paused));
  $("#pause").innerHTML =
    `${icon(paused ? "play" : "pause")}<span>${paused ? "Resume" : "Pause"}</span>`;
  notify(
    paused
      ? "Ecology paused. You can still sprinkle and explore."
      : "Your world is growing again.",
  );
}
$("#pause").addEventListener("click", togglePause);
$("#reset").addEventListener("click", () => {
  pushHistory();
  world = createWorld(world.seed);
  setTarget(30);
  updateUI();
  persist();
  notify("A fresh bowl, with the same seed. Undo brings the old one back.");
});
$("#sound").addEventListener("click", async () => {
  try {
    const enabled = await sound.toggle();
    $("#sound").setAttribute("aria-pressed", String(enabled));
    $("#sound span").textContent = `Sound ${enabled ? "on" : "off"}`;
    if (enabled) sound.play(0);
  } catch {
    notify("Sound is unavailable in this browser. The bowl is still playable.");
  }
});
function openGuide() {
  $("#guide-progress").innerHTML =
    `<span>${world.discovered.length} of 5 wonders found</span><span class="progress-dots">${GUIDE.map((g) => `<i class="${world.discovered.includes(g.id) ? "found" : ""}"></i>`).join("")}</span>`;
  $("#guide-entries").innerHTML = GUIDE.map((g, index) => {
    const found = world.discovered.includes(g.id);
    return `<article class="guide-entry ${found ? "discovered" : ""}"><span class="field-art">${icon(g.glyph)}</span><div><span class="eyebrow">FIELD NOTE ${String(index + 1).padStart(2, "0")} · ${found ? "DISCOVERED" : "A CLUE"}</span><h3>${found ? g.title : ["A place to put down roots", "A well-seasoned sea", "Weather from the pantry", "A meadow with its own lights", "Something lighter than air"][index]}</h3><p>${found ? g.text : g.hint}</p>${found ? `<span class="recipe">${g.recipe}</span>` : ""}</div>${found ? icon("check", "entry-check") : ""}</article>`;
  }).join("");
  $("#guide-dialog").showModal();
}
document
  .querySelectorAll(".guide-button")
  .forEach((b) => b.addEventListener("click", openGuide));
document
  .querySelectorAll(".dialog-close")
  .forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()),
  );
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
$("#seed-open").addEventListener("click", () => {
  $("#seed-input").value = world.seed;
  $("#seed-dialog").showModal();
});
document.querySelectorAll("[data-seed]").forEach((b) =>
  b.addEventListener("click", () => {
    $("#seed-input").value = b.dataset.seed;
  }),
);
$("#seed-form").addEventListener("submit", (e) => {
  e.preventDefault();
  pushHistory();
  world = createWorld($("#seed-input").value);
  setTarget(30);
  updateUI();
  persist();
  $("#seed-dialog").close();
  notify(`Hello, ${world.seed}. A new little island is ready.`);
});
$("#save-retry").addEventListener("click", () => {
  persist();
  notify(
    saving
      ? "Your world is saved on this device."
      : "Saving is still unavailable. Export keeps a portable copy.",
  );
});
$("#export").addEventListener("click", () => {
  const blob = new Blob([serializeSave(world, history)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `spoonworld-${world.seed.replace(/[^a-z0-9-]/gi, "-")}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("World exported, field notes and undo history included.");
});
$("#import").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 400000) throw new Error("This world file is too large.");
    const imported = parseSave(await file.text());
    const previous = structuredClone(world);
    history = [...imported.history, previous].slice(-MAX_HISTORY);
    world = imported.world;
    setTarget(30);
    updateUI();
    persist();
    notify("World imported. Undo returns to the previous bowl.");
  } catch {
    notify("That file is not a valid Spoonworld save. Your bowl is safe.");
  } finally {
    e.target.value = "";
  }
});
window.addEventListener("keydown", (e) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    $("dialog[open]") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  if (/^[1-7]$/.test(e.key))
    selectIngredient(INGREDIENTS[Number(e.key) - 1].id);
  if (e.code === "Space" && !["BUTTON", "SUMMARY"].includes(e.target.tagName)) {
    e.preventDefault();
    togglePause();
  }
  if (e.key.toLowerCase() === "z") undo();
  if (e.target.id === "world-view") {
    if (e.key === "Enter") {
      e.preventDefault();
      sprinkle();
    }
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const c = world.cells[target],
        direction = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        }[e.key];
      const next = world.cells.find(
        (n) => n.q === c.q + direction[0] && n.r === c.r + direction[1],
      );
      if (next) {
        setTarget(next.id);
        $("#announcement").textContent = $("#target-description").textContent;
      }
    }
  }
});
let last = performance.now(),
  accumulator = 0;
function clock(now) {
  const elapsed = Math.min(250, now - last);
  last = now;
  if (!paused && !document.hidden && !$("dialog[open]")) accumulator += elapsed;
  if (accumulator >= 1000) {
    accumulator -= 1000;
    world = stepWorld(world);
    updateUI();
    if (world.tick % 5 === 0) persist();
  }
  requestAnimationFrame(clock);
}
document.addEventListener("visibilitychange", () => {
  last = performance.now();
  accumulator = 0;
  renderer.pause(document.hidden);
  if (document.hidden) persist();
});
window.addEventListener("pagehide", persist);
selectIngredient(ingredient);
updateUI();
persist();
requestAnimationFrame(clock);
if (saved.status === "invalid")
  notify(
    "The previous save could not be read. A fresh bowl is ready; you can import a backup.",
  );
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(async () => {
      await navigator.serviceWorker.ready;
      $("#offline-status").textContent = "Offline ready";
    })
    .catch(() => {
      $("#offline-status").textContent = "Offline cache unavailable";
    });
}
// Read-only diagnostics for tests and resource inspection. No external calls.
window.spoonworld = Object.freeze({
  snapshot: () => structuredClone(world),
  debug: () => ({
    ...renderer.debug(),
    history: history.length,
    cells: world.cells.length,
    residents: world.residents.length,
    paused,
    saving,
  }),
  selected: () => ({ ingredient, target }),
});
