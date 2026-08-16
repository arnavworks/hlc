import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT ?? 3000);
const publicDir = join(process.cwd(), "public");

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

createServer(async (request, response) => {
  try {
    const requestPath = new URL(request.url ?? "/", `http://${request.headers.host}`).pathname;
    const safePath = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
    let filePath = join(publicDir, safePath === "/" ? "index.html" : safePath);

    if (!filePath.startsWith(publicDir)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    try {
      if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    } catch {
      filePath = join(publicDir, "index.html");
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-store, max-age=0",
    });
    response.end(body);
  } catch {
    response.writeHead(500).end("Something went wrong");
  }
}).listen(port, () => {
  console.log(`preview running at http://localhost:${port}`);
});
