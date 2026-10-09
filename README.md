# Spoonworld

A tiny ingredient ecology toy, served in a ceramic bowl. Sprinkle a pantry ingredient onto a patch and watch the roots, weather, seas, and twelve little sproutlings respond. Follow five field-guide clues to find herb woods, shell sailors, kitchen rain, glowbug meadows, and bubble ferries.

Source is maintained in the private repository [aranlucas/spoonworld](https://github.com/aranlucas/spoonworld). Clone with `git clone https://github.com/aranlucas/spoonworld.git`.

## Run

Requires Node.js 22.12+ or 24+ and pnpm (the version is pinned in `package.json`; `corepack enable` provides it). No account, backend, AI provider, or API key.

```sh
pnpm install
pnpm build
pnpm preview
```

`pnpm preview` serves the production build from workerd, Cloudflare's runtime, with the same `_headers` rules as production. The production build precaches all its own assets. Once **Offline ready** appears, reload and play without network access. Service workers require localhost or HTTPS. Development uses `pnpm dev` at **https://spoonworld.localhost**, served through [Portless](https://github.com/vercel-labs/portless) (a dev dependency); its first run may ask for `sudo` to bind port 443 and trust a local certificate. The dev server does not install the offline cache.

## Play

- Pick an ingredient, then tap a patch. Nearby patches receive a lighter dose. **Add a pinch** uses the last chosen patch.
- **Field guide** gives five gentle clues, then records discoveries and explains their causes.
- **Read this patch** opens a text notebook for all 61 patches. Pick a patch, read its moisture and salt conditions, sprinkle with native controls, and undo to compare. Ecology pauses while it is open.
- **Meet your twelve neighbours** in the field guide gives each sproutling a name and a short observation based on its current habitat or travel mode. Visit its home patch straight from the note.
- **Undo** restores the exact world before the last ingredient addition, seed change, reset, or import. Keeps twelve snapshots.
- **Pause** holds the ecology still while you experiment. Decorative movement continues. Opening a notebook or seed dialog also holds the ecology.
- **Reset** recreates the current seeded island and can be undone. Click the seed name for a different island.
- **Export/Import** moves a world and its field notes between browsers. Import also retains the exported undo history and puts the previous bowl first in the undo sequence.
- Keys **1–7** select pantry items. Focus the bowl, use **arrow keys** to choose a patch, and **Enter** to sprinkle. **Space** pauses; **Z** undoes.
- Sound starts off. The sound button enables short, locally synthesized notes after a user gesture.

All data stays in this browser’s local storage. Ingredients are synthetic; there is no private data access or external service call. This is a whimsical toy, with deliberately simplified fictional ecology.

## Verify

```sh
pnpm check                         # lint, format, typecheck, unit tests, build
pnpm exec playwright install chromium
pnpm test:browser                  # needs a prior pnpm build
```

Unit tests run in Vitest. Browser tests use Playwright with a single worker and temporary browser contexts. For an installed Chrome, use `PLAYWRIGHT_CHANNEL=chrome pnpm test:browser`. The suite starts and stops only its own `vite preview` server on port 4188.

Tests cover seeded reproducibility, batch-equivalent fixed ticks, five discoveries, salt stress and water recovery, 3,000 randomized actions, save validation, import/export, corrupt-save recovery, quota failure/retry, exact undo/reset/persistence, offline reload, genuine emulated touch, keyboard/reduced motion, responsive layouts, frame budgets, and axe WCAG A/AA checks. See [QA.md](QA.md) for measured results and limits. Each run saves screenshots and reports to the gitignored `test-results/`.

## Structure and resource bounds

- `src/simulation.ts`: pure deterministic state transitions; 61 fixed patches and 12 inhabitants. Zod schemas define the saved world shape and its bounds.
- `src/storage.ts`: parses saved and imported JSON with Zod; recoverable storage operations.
- `src/game.ts`: the world, its twelve-step undo history, selection, pause, and persistence behind a small subscribable store. No DOM.
- `src/renderer.ts`: original procedural artwork in one Phaser Canvas scene; native pointer input, a 960×640 canvas, 30 FPS target, at most 48 sprinkle particles.
- `src/App.tsx` and `src/components/`: React UI, native `<dialog>` notebooks, keyboard mapping, and the fixed one-second ecology clock. Hidden tabs suspend the world; there is no offline time catch-up.
- `src/naturalist.ts`: named residents and readable patch observations derived from current simulation rules. No additional saved state or text generation service.
- `vite.config.ts`: an installable PWA via `vite-plugin-pwa`. The web manifest and a Workbox service worker that precaches every shipped asset are generated at build time.
- `public/_headers`: content security policy and immutable caching for hashed assets on Cloudflare.

Art, ingredient icons, sproutlings, bowl decoration, and sound were made for this project in code. No downloaded art or generated provider assets. Phaser 3.90.0 is pinned as an established 2D runtime, React renders the controls, and Zod validates saves. Vite, vite-plugin-pwa (Workbox), the Cloudflare Vite plugin (beta), the `cf` CLI, TypeScript, Vitest, Playwright, axe, oxlint, and oxfmt are development tools. The lockfile pins all resolved registry packages.

## Hosting configuration

Spoonworld deploys as a static-assets-only Cloudflare Worker with the [`cf` CLI](https://github.com/cloudflare/cf). `cloudflare.config.ts` names the Worker; the Cloudflare Vite plugin writes Cloudflare's Build Output to `.cloudflare/output/`. `pnpm run deploy` runs `cf deploy`, which builds and uploads it; log in first with `pnpm exec cf auth login`.

No infrastructure has been provisioned and no public release has been performed. Deployment requires a deliberate later action. See [DECISIONS.md](DECISIONS.md) for the research brief and next experiments.
