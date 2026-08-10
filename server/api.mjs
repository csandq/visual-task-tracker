import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.KAIROS_DB ?? "/data/kairos.sqlite";
const port = Number(process.env.PORT ?? 8787);
mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA synchronous=NORMAL");
db.exec(`CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const readState = db.prepare("SELECT value, updated_at FROM app_state WHERE key = ?");
const writeState = db.prepare(`INSERT INTO app_state (key, value, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`);

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/health") return json(response, 200, { ok: true });
  if (url.pathname !== "/api/state") return json(response, 404, { error: "Not found" });

  if (request.method === "GET") {
    const row = readState.get("primary");
    return json(response, 200, { data: row ? JSON.parse(row.value) : null, updatedAt: row?.updated_at ?? null });
  }

  if (request.method === "PUT") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) request.destroy();
    });
    request.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const data = payload?.data;
        if (data?.version !== 1 || !Array.isArray(data.tasks) || typeof data.tagLibrary !== "object" || typeof data.workspaces !== "object") {
          return json(response, 400, { error: "Invalid Kairos data" });
        }
        writeState.run("primary", JSON.stringify(data));
        return json(response, 200, { ok: true });
      } catch {
        return json(response, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  return json(response, 405, { error: "Method not allowed" });
}).listen(port, "0.0.0.0", () => {
  console.log(`Kairos data service listening on ${port}`);
});
