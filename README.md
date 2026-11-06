# Spoonworld

A tiny ingredient ecology toy, served in a ceramic bowl. Sprinkle a pantry ingredient onto a patch and follow five field-guide clues to discover what grows. The ecology is deliberately fictional. No account, backend, AI provider, or API key is needed.

## Run

Use the Node.js version in `.node-version` and the pnpm version pinned in `package.json` (`corepack enable` provides pnpm).

```sh
pnpm install
pnpm build
pnpm preview
```

`pnpm preview` serves the production build through workerd, Cloudflare’s runtime, including the rules in `public/_headers`. Once **Offline ready** appears, reload and play without network access. Service workers require localhost or HTTPS.

For development, run `pnpm dev`. [Portless](https://github.com/vercel-labs/portless) provides the named localhost URL; follow the URL it prints. Its HTTPS setup may ask for administrator access to bind port 443 and trust a local certificate. The dev server does not install the offline cache.

## Play and keep a world

Pick an ingredient, then tap a patch. **Field guide** offers clues and resident observations; **Read this patch** provides native controls and text readings for precise experiments. Focus the bowl to select a patch with arrow keys and sprinkle with **Enter**. Keys **1–7** select ingredients, **Space** pauses, and **Z** undoes.

**Undo** keeps twelve snapshots from ingredient additions, seed changes, resets, and imports. **Reset** recreates the current seeded island. Ecology pauses while a dialog is open or the tab is hidden; there is no background time catch-up. Decorative movement continues during an explicit pause.

Worlds stay in this browser’s local storage. Use **Export** for a portable backup; **Import** includes the exported field notes and undo history, with the previous bowl first to undo. Invalid imports leave the current world intact. If saving fails, export before leaving and use **Retry save** when storage is available. An unreadable saved world starts a fresh bowl; import a backup to recover it.

## Verify

```sh
pnpm check                         # lint, format, typecheck, unit tests, build
pnpm exec playwright install chromium
pnpm test:browser                  # needs a prior pnpm build
pnpm test:e2e                      # deterministic reliability journeys; same production build
```

The browser suite starts its own production preview on port 4188; leave that port free. For installed Chrome, use `PLAYWRIGHT_CHANNEL=chrome pnpm test:browser`. Screenshots, accessibility results, and the short runtime sample are written to gitignored `test-results/`.

The `e2e` runner (`tester-army/e2e`) adds deterministic sound-recovery, canceled-pointer, and discovery/persistence/undo journeys with `@e2e-dev/web`. No model or credentials are needed. CI uploads browser reports and failure traces. Its optional `reproduce-baseline` dispatch input runs the same journeys against the audited pre-fix runtime and verifies both defect assertions fail while the persistence journey passes.

Browser coverage is configured for Chromium, including emulated touch. The desktop boot check rejects requests outside the app origin; this is not an audit of every network channel or flow. Automated accessibility scans and a short runtime sample do not establish screen-reader usability, physical-device compatibility, storage-eviction recovery, or long-session performance. The [roadmap](ROADMAP.md) includes a human VoiceOver playtest.

## Hosting

Spoonworld uses a static-assets-only Cloudflare Worker. `cloudflare.config.ts` names the Worker; the Vite plugin writes Build Output to `.cloudflare/output/`. Authenticate with `pnpm exec cf auth login`, then `pnpm run deploy` builds and uploads with the [`cf` CLI](https://github.com/cloudflare/cf). The content security policy and asset caching rules live in `public/_headers`.

See [design decisions](DECISIONS.md) for rationale and [the roadmap](ROADMAP.md) for proposed work.
