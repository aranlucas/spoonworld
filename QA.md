# Verified outcome

Spoonworld is an implemented, playable prototype. The production build, deterministic simulation, local saves, pantry controls, five field-guide discoveries, undo/reset/seed changes, import/export, keyboard/touch input, sound toggle, and offline cache are complete.

## Test results

| Check                                            | Result                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `npm test`                                       | **9 / 9 passed**                                                                     |
| `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` | **14 / 14 passed**, one worker, 22.9 seconds                                         |
| `npm run build`                                  | **Passed**, all six app routes/assets precached                                      |
| `npm run format:check`                           | **Passed**                                                                           |
| Desktop, guide, mobile axe WCAG A/AA             | **0 violations** in each tested surface                                              |
| Production offline reload                        | **Passed** with browser networking disabled; continued play and persistence verified |
| Responsive layouts                               | **Passed** at widths 320, 390, 768, 1024, 1440                                       |
| Touch                                            | **Passed** using Chrome’s emulated touch input; one tap produces exactly one dose    |
| Recovery                                         | Corrupt storage, bad import, quota failure, and successful save retry passed         |

The simulation stress test performed **3,000 seeded random ingredient actions and 9,000 ecology ticks**, validating the entire state after each action. Patch and resident counts remain fixed at 61 and 12; event history is capped at six, undo history at twelve, values at 0–100, and visual sprinkle particles at 48. The serialized current world stayed below 18 kB in the stress test.

The short runtime sample used **Chrome 154.0.8037.95** on this Mac: 3 ticks and 90 rendered frames in 3,007 ms, with approximately **6.8 MB of used JavaScript heap** at the sampled point. Rendering targets 30 FPS on one 960×640 Canvas. This is a three-second sample, not a multi-hour memory or CPU soak; see `evidence/runtime-budget.json` for exact metrics.

## Evidence

- `evidence/desktop-initial.png`: original first playable view.
- `evidence/desktop-bubble-ferry.png`: all five discoveries and flying inhabitants.
- `evidence/field-guide.png`: illustrated discovered entries and explanations.
- `evidence/mobile.png`: mobile world, touch placement, pantry, and controls.
- `evidence/offline.png`: functional offline session after a disconnected reload.
- `evidence/browser-results.json`: machine-readable final browser test results.
- `evidence/accessibility-results.json`: tested surfaces and empty violation arrays.
- `evidence/runtime-budget.json`: browser version, fixed budgets, frame/tick counts, heap metrics.

## Bugs found and fixed

Real touch emulation exposed a duplicate synthetic mouse dose after a touch. One native Pointer Events path now handles touch and mouse, discarding scroll gestures. Screen-reader controls use DOM elements, and the visual canvas is hidden from the accessibility tree in favour of a described keyboard-enabled group and textual world summary.

The initial supporting-text palette failed contrast checks. Secondary text and the primary button were darkened; the final accessibility checks return no violations. Mobile toolbar, dialog-close, seed-preset, and import/export controls have at least 44 px touch height. The mobile bowl is enlarged, and its native input coordinates account for the CSS transform.

A sibling project occupied the initial generic server port during final verification. Spoonworld moved to **4188**. No unrelated process was stopped.

## Publication status and limits

The repository [aranlucas/spoonworld](https://github.com/aranlucas/spoonworld) is **private**, verified through the GitHub connector. The playable implementation is published on `feature/ingredient-ecology` in [draft PR #1](https://github.com/aranlucas/spoonworld/pull/1); the default branch contains a short repository overview. Final PR and source-push status are recorded in `evidence/publication-status.json`.

The existing GitHub CLI authentication works through the supported host-permission route. Credentials and browser security settings were neither copied nor configured. No public deployment has been performed. Source and a built portable app are packaged as ZIPs, with deployment-ready Railway and Cloudflare static configuration.

The PR workflow checks its exact head commit with Node 24 on Ubuntu 24.04, one browser worker, and an eight-minute job limit. Its steps install the locked dependencies, check formatting, run unit tests, build the offline bundle, and run the complete browser and accessibility suite using Chromium. Official actions are pinned to immutable commits. Final hosted results are reported with the draft PR.

Browser verification covers Chrome and Chrome touch emulation. Safari, Firefox, VoiceOver, physical mobile hardware, installation on iOS, storage eviction, prolonged idle sessions, and real deployed hosting have not been tested. Automated accessibility scans complement the implemented keyboard/labels/contrast controls; they do not establish complete screen-reader usability. Offline play needs one successful initial load on localhost or HTTPS. No background time catch-up is performed.

The Vite build reports a large-engine-chunk warning: JavaScript is approximately 1.23 MB uncompressed and 333 kB gzipped. It is fully local and precached; it is a documented size tradeoff rather than a failed build.
