# Untangle decision log — 2026-11-06

## Scope and baseline

Read the requested caldoai untangle-codebase skill and root AGENTS.md. Both Comments and Tests are selected. Initial worktree was clean at f17ae59; existing design decisions and prior test pruning remain authoritative. Reviewed simulation, storage, game actions, React dialogs/app, audio, Phaser renderer, CSS/assets, unit/browser tests, and tool/CI configuration. No local tests, builds, or benchmarks run: validation is CI-only. Existing CI runs lint/format, typecheck, Vitest, production build, and Playwright. No owned local validation process was started.

## Inventory before edits and design

- Colocate each field guide clue with its entry, and derive progress totals from GUIDE.
  - Hidden link: positional CLUE_TITLES in guide-dialog must track GUIDE order in simulation.
  - Hidden link: both header and guide hard-code five entries.
- Give shared ecology conditions domain names in simulation and consume them from observations/rendering.
  - Hidden link: kitchen-rain thresholds appear in discovery, stepping, weather, and artwork.
  - Hidden link: bubble-flight threshold appears in discovery, weather, residents, artwork, and patch chemistry.
  - Keep distinct discovery vs growth thresholds: finding a field note is a different requirement from sustaining flowers.
- Share renderer patch hit testing between hover and tap.
  - Hidden link: projection, distance weighting, and hit radius are copied across pointer handlers.
- Keep save parsing and its size limit at the storage boundary.
  - Surplus: game.importSave repeats parseSave's raw length check and error branch.
- Remove comments that merely narrate implementation. Retain compatibility, browser/library integration, lint exceptions, and accessibility constraints.
- Audit tests last. Existing simulation invariants, persistence, undo, import, offline, accessibility, and keyboard/touch tests protect real behavior and remain. Remove no tests solely because their behavior overlaps across integration boundaries.

## Special cases retained

Seed normalization and legacy UTF-16 hashing preserve saved worlds. Zod verifies fixed seeded terrain, ranges, history caps, and untrusted imports. Storage exceptions become visible recoverable save status. Audio/service-worker failures degrade optional features. Dialog close guards handle transitions between native modals. Reduced motion, hidden-tab suspension, touch drag rejection, and bounded particle/history budgets are intentional interaction/resource contracts. Toast expiry and delayed object-URL revocation serve browser UI lifecycles. CI browser retries are infrastructure tolerance, not substitutes for assertions. The simulation’s ingredient-specific effects, sailor selection, seeded terrain edge and resident movement cadence are game rules, not generic special cases to erase.

## Review and validation

Pending independent static review after implementation. Tests run only in PR CI; no baseline test pass is claimed.

Implementation follows the inventory. The hover boundary now matches the tap boundary (strictly inside 47 display units); this removes a one-point inconsistency. Added independent weather boundary fixtures: 42/58 rains, either value below the threshold does not. These protect discovery, weather, and moisture direction against threshold/comparison drift. No existing meaningful tests were removed. React checklist: no new hooks, state, asynchronous work, or focus changes.

Independent review round 1 found two additional worthwhile links before their edits: briny-sea threshold copies across simulation/notes/artwork (gradient used >30 while boats use >=30), and a browser runtime test treating a scheduled three-second delay as exact elapsed time. Unify brine at the documented inclusive 30% boundary; sample browser timestamps, poll for clock/frame liveness, and scale upper bounds to actual elapsed duration. Preserve the bounded-resource assertions.

Independent review round 2 found exact root-stress boundary disagreements: renderer moisture <25 vs growth/notebook <=25, and grass salt >65 vs growth/notebook >=65. Add shared dry/salty cell predicates used by those three consumers. Discovery/flowering keep their separate conditions. Existing naturalist tests already exercise moisture 25 and salt 65 against growth direction; retain them.

Independent review round 3 found nothing worthwhile remaining; meaningful tests and intended simulation behavior are preserved. CI on 1b69d36 passed typecheck, Vitest, and production build, but lint identified a missing blank line between local declarations in the extracted hit test. Fixed that formatting rule without running local validation. Final-head CI remains the merge gate (including Playwright). The worktree initially had no edits to preserve; DECISIONS.md and prior test pruning were retained. No deployment requested or performed by this thread.
