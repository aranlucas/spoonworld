import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist"),
  host = process.env.HOST || "127.0.0.1",
  port = Number(process.env.PORT || 4188);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".png": "image/png",
};

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );

    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );

    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();

      return;
    }

    if (!(await stat(file)).isFile()) {
      res.writeHead(404);
      res.end();

      return;
    }

    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": pathname === "/sw.js" ? "no-cache" : "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found. Run npm run build first.");
  }
}).listen(port, host, () =>
  console.log(`Spoonworld at http://${host}:${port}`),
);
