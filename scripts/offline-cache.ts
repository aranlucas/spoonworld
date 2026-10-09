import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

const WORKER = "sw.js";

// Deployment metadata in the client output that Workers never serves.
// index.html is served at "/" (Workers redirects /index.html there).
const UNSERVED = new Set([
  WORKER,
  "index.html",
  ".assetsignore",
  "wrangler.json",
  "_headers",
  "_redirects",
]);

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map((e) => {
      const full = path.join(directory, e.name);

      return e.isDirectory() ? files(full) : [full];
    }),
  );

  return nested.flat();
}

// Writes a service worker that precaches every shipped client asset under a
// content-versioned cache name. Only this app's own caches are cleaned up.
export function offlineCache(): Plugin {
  return {
    name: "spoonworld:offline-cache",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    async writeBundle(options) {
      const root = options.dir;

      if (!root) throw new Error("The client build needs an output directory.");
      const assets = (await files(root)).filter((f) => !UNSERVED.has(path.basename(f))).sort();
      const hash = createHash("sha256");

      for (const file of assets) hash.update(await readFile(file));
      const version = hash.digest("hex").slice(0, 12);
      const urls = assets.map((f) => "/" + path.relative(root, f).split(path.sep).join("/"));

      await writeFile(
        path.join(root, WORKER),
        `// Generated from all shipped assets. No third-party or user-data caching.
const CACHE='spoonworld-${version}';
const ASSETS=${JSON.stringify(["/", ...urls])};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('spoonworld-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return cache.match('/');throw error;}}));});
`,
      );
      this.info(`Offline cache: ${urls.length + 1} assets, version ${version}`);
    },
  };
}
