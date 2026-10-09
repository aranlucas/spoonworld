import "./style.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { createGame } from "./game.ts";
import { createSound } from "./audio.ts";

function localStorageOrNull(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const root = document.querySelector("#app");

if (!root) throw new Error("Missing #app root element.");

createRoot(root).render(
  <StrictMode>
    <App game={createGame(localStorageOrNull())} sound={createSound()} />
  </StrictMode>,
);
