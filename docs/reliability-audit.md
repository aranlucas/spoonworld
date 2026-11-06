# Correctness and reliability audit — 2026-11-06

Baseline: remote default `origin/main`, `f2f110bfe7a4f46a05dba80ad630dfab56f6fae4` (merged untangle pass). The isolated worktree was clean. All execution-based validation runs in GitHub Actions; no local tests, builds, or benchmarks are authorized.

## Inventory and boundaries

- `src/simulation.ts`: public deterministic seed generation, ingredient actions, ticking, discoveries, weather, and resident modes. Actions clone their input; ingredient and step guards reject invalid actions. Numeric values are bounded. Zod validates imported worlds against seeded terrain, stable IDs, resident land references, and bounded fields.
- `src/storage.ts`: versioned local-storage save format, JSON import/export, twelve undo snapshots, size limit, and recoverable storage failures. `src/game.ts` owns state transitions and persistence. Import parses fully before replacing state; invalid imports preserve the current bowl. Import history includes the previous bowl as the next undo.
- `src/app.tsx`: ingredient/keyboard/notebook play, discoveries, reset/seed/undo, save status/retry, import/export, modal and visibility pauses, animation clock, and service-worker readiness. Timers/listeners have cleanup. Hidden tabs clear accumulated time; there is no catch-up promise.
- `src/renderer.ts` / `components/world-view.tsx`: Phaser lifecycle, bounded particles, pointer gesture filtering and display-only movement. React destroys each mounted renderer.
- `src/audio.ts`: optional browser audio activation and short-lived oscillator/gain resources.
- PWA/config: same-origin static assets with CSP, no backend, account, authentication, tenant, payment, or production-data API. Imported files and browser persistence are the primary untrusted inputs. Multiple tabs use browser last-write-wins storage; no cross-tab synchronization contract is documented.
- Existing CI runs lint/format, TypeScript, Vitest, production build, and meaningful Playwright journeys: all five discoveries, exact undo, import/export, reload persistence, corrupt saves, quota/retry, offline play, keyboard/touch, notebook/guide navigation, accessibility, and clock/resource bounds. These checks remain intact.

## Findings recorded before runtime changes

### R1 — Failed audio activation leaves the internal toggle enabled

Priority: P2 (optional feature recovery). Confidence: high from control-flow inspection. Location: `src/audio.ts`, `createSound().toggle()`; consumer: `src/app.tsx`, `toggleSound()`.

Trigger: `AudioContext` construction or `resume()` rejects (for example browser/device audio activation failure). Expected: sound stays off and the next click retries activation. Actual: `enabled` is set to true before either operation, the caller catches the error and still displays sound off, and the next click flips the internal flag to false without retrying. Subsequent ingredient actions can also call `play()` while the failed activation is internally enabled. Rapid clicks during an asynchronous activation can overlap.

Fix direction: commit enabled state only after successful activation and prevent overlapping UI toggle requests. Regression assertions must prove that a failed activation followed by one retry invokes resume again and returns true, and that sound playback stays inactive after failure. Cover the user-visible retry journey with deterministic browser fault injection.

## Reconciled and rejected hypotheses

- Malformed imports replacing the current bowl: rejected; `parseSave` finishes before `replaceWorld`, and existing unit/browser tests establish preservation.
- Terrain/resident reference tampering: rejected; Zod refinement compares every cell to the seeded template and every resident to an existing land cell.
- Ingredient/undo snapshot aliasing: rejected; simulation actions clone input, and history stores previous immutable world values.
- Background simulation catch-up: rejected; visibility handler resets the accumulator and hidden frames do not add time.
- Unbounded particles/history: rejected; explicit caps and existing regression coverage.
- Stale saved resident moods: rejected; renderer and naturalist derive current modes from shared rules, including immediately after ingredients.
- Missing authentication/tenant checks: inapplicable to this local-only static toy, which has no accounts or backend.

## Requested e2e framework

Published registry inspection verified `e2e@0.23.0` (repository `tester-army/e2e`) and `@e2e-dev/web@0.15.5` (peer `e2e >=0.22.1 <1`, Playwright core `1.64.1`). Both require Node `^22.22.3 || >=24.8.0`; the repository pins Node `24.22.1`. Read the current quickstart, CI, GitHub Actions documentation and upstream Vite config on 2026-11-06. The published installed guide and type declarations guided implementation. This browser app is a supported target; deterministic locator/action/assertion journeys need no model, login, paid provider, or CI secrets. Dependency install and lockfile updates suppress lifecycle scripts locally.

## Validation and independent review

Independent review challenged the full repository and the implementation. Both findings were confirmed; no further concrete runtime findings remained. No tests or builds ran locally.

### R2 — A canceled mouse press can turn a later right click into a pinch

Priority: P3 (unintended world mutation). Confidence: high from independent review and event-path inspection. Location: `src/renderer.ts`, canvas pointer handlers.

Trigger: press the left mouse button on the bowl, leave the canvas and release outside, return near the original press, then right-click. Expected: releasing outside cancels the pinch, and right-click never adds an ingredient. Actual: `pointerleave` clears only hover, the off-canvas release never reaches the handler, and the later right-button `pointerup` consumes the stale primary-left start because it checks only pointer ID and end distance.

Fix direction: cancel the pending gesture when leaving and require a primary left-button release. A deterministic browser regression will perform that physical event sequence, verify no dose is added, and verify the next ordinary click still adds exactly one dose. The independent reviewer also noted out-and-back drag excursion; no broader gesture redesign is required for this canceled-press defect.

## Implementation and CI evidence

- R1 now enables sound only after successful `resume()`. The UI disables the sound button while activation is pending and resets its visible state on failure. Vitest regressions cover failed resume silence/retry and construction retry.
- R2 cancels pending gestures on canvas leave and accepts only primary-left releases. The e2e journey drives a real canceled left press, secondary click, ordinary left click, and Undo.
- Three credential-free e2e journeys cover R1, R2, and discovery → save → reload → Undo. The original Playwright suite is preserved. Both engines pin Playwright `1.64.1`; CI installs Chromium through `e2e-web`.
- Static lint, formatting, and TypeScript checks passed locally. Tests and builds have not run locally. [PR CI](https://github.com/aranlucas/spoonworld/actions/runs/42303491488) passed on `6ccf0a2`: 26 Vitest tests, 18 existing Playwright tests, all 3 new e2e journeys, lint/format/typecheck, and production build.
- Independent review confirmed both findings and rejected the speculative save/history/lifecycle issues above. Implementation review caught a non-constructible arrow in the constructor-failure mock; it was corrected to a normal function before CI.

[Pre-fix CI reproduction](https://github.com/aranlucas/spoonworld/actions/runs/42303548205) restored the three changed runtime files from `f2f110b`, rebuilt, and ran the identical browser journeys. R1 failed at the second-click `aria-pressed="true"` assertion (observed `false`). R2 failed at the unchanged-dose assertion (expected 0, observed 1). The discovery/persistence/Undo control passed. The report checker returned true and [failure artifacts were uploaded](https://github.com/aranlucas/spoonworld/actions/runs/42303548205/artifacts/13546545646). The run was marked canceled near its ten-minute deadline after evidence upload and job cleanup; it is not reported as a passing overall run. The workflow budget is now fifteen minutes to accommodate slow browser provisioning plus this optional second build/run. A fresh run is required before merge.
