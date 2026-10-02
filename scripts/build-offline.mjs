import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = path.resolve("dist");
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? files(path.join(directory, e.name))
          : path.join(directory, e.name),
      ),
    )
  ).flat();
}
const assets = (await files(root)).filter((f) => !f.endsWith("sw.js"));
const hash = createHash("sha256");
for (const file of assets) hash.update(await readFile(file));
const version = hash.digest("hex").slice(0, 12);
const urls = assets.map(
  (f) => "/" + path.relative(root, f).split(path.sep).join("/"),
);
await writeFile(
  path.join(root, "sw.js"),
  `// Generated from all shipped assets. No third-party or user-data caching.
const CACHE='spoonworld-${version}';
const ASSETS=${JSON.stringify(["/", ...urls])};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('spoonworld-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return cache.match('/index.html');throw error;}}));});
`,
);
console.log(`Offline cache: ${urls.length + 1} assets, version ${version}`);
