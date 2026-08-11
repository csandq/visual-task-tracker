import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Kairos application", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Kairos — Visual Task Journeys<\/title>/i);
  assert.match(html, /Loading Kairos…/);
  assert.doesNotMatch(html, /Launch the autumn campaign/);
  assert.doesNotMatch(html, /codex-preview/);
});

test("includes portable storage and Pi deployment support", async () => {
  const [page, api, compose, guide] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../server/api.mjs", import.meta.url), "utf8"),
    readFile(new URL("../docker-compose.yml", import.meta.url), "utf8"),
    readFile(new URL("../PI_SETUP.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Download backup/);
  assert.match(page, /Import backup/);
  assert.match(page, /fetch\("\/api\/state"/);
  assert.match(api, /CREATE TABLE IF NOT EXISTS app_state/);
  assert.match(api, /PRAGMA journal_mode=WAL/);
  assert.match(compose, /\.\/data:\/data/);
  assert.match(guide, /Raspberry Pi 5/);
});
