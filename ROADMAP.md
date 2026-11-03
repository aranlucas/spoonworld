# Feature roadmap

Proposed 2026-10-26 against `1900ba625db0`. This local ecology toy is a later portfolio priority; the items below are future work.

## Outcome

Help a player notice an interesting cause and effect, then try another small experiment.

## 1. Compare a chosen patch before and after a sprinkle

Build on the existing patch notebook with an explicit comparison for the most recent ingredient action. Explain the changed conditions using the simulation's actual values.

Acceptance:

- The comparison identifies the patch, ingredient and before/after values.
- Undo restores the corresponding world and keeps the explanation consistent.
- Time passing is distinguished from the direct effect of the sprinkle.
- Native controls and readable text communicate the same information as the bowl.

Observe a few voluntary sessions. Look for players being able to explain one discovery and choose their next experiment. Keep analytics and external services absent.

## 2. Keep a small experiment journal

Let players bookmark a bounded number of local observations and the compatible world reference behind them. Extend the existing export/import contract only with validated, versioned data.

Acceptance: imports preserve the current bowl on failure, storage limits are visible, and deleting a journal entry does not corrupt the world or undo history.

## 3. One additional ecological surprise

Add an authored discovery only when it offers a new interaction with existing ingredients. One candidate is a sequencing-dependent surprise: a rain-watered salty grove becoming a miniature mangrove coast. Give it a gentle clue and a deterministic regression.

## Further experiments

- Playtest the patch notebook and resident notes with VoiceOver, including live changes and focus restoration.
- Explore split bowls with a shared seed for side-by-side recipe comparisons.
- Try an optional two-minute illustrated recipe challenge while preserving open-ended play.

## Boundaries

Keep the fixed-size local simulation and fictional ecology. No online sharing backend, accounts, real pantry access or model-generated inhabitants are needed. Use existing simulation, storage and browser tests. The useful signal is curiosity and understandable experimentation; there is no educational efficacy or commercial-impact claim.
