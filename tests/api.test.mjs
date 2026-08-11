import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import test, { after, before } from "node:test";

const tempDirectory = await mkdtemp(join(tmpdir(), "kairos-api-test-"));
const port = 8800 + (process.pid % 1000);
const server = spawn(process.execPath, ["--no-warnings=ExperimentalWarning", "server/api.mjs"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: String(port), KAIROS_DB: join(tempDirectory, "kairos.sqlite"), KAIROS_AI_URL: "file:///disabled" },
  stdio: "ignore",
});
const baseUrl = `http://127.0.0.1:${port}`;

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // The test server may need a few milliseconds to bind.
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("API test server did not start");
}

before(waitForHealth);
after(async () => {
  server.kill();
  await rm(tempDirectory, { recursive: true, force: true });
});

const validData = {
  version: 1,
  tasks: [{ id: 1, title: "Test", project: "Alpha", tags: ["Planning"], priority: "Medium", steps: [{ id: 2, label: "Do it", status: "todo", note: "", deadline: "2026-08-10" }] }],
  tagLibrary: { Planning: "#718096" },
  workspaces: { Alpha: { description: "Alpha work", color: "#02324F", active: true } },
};

test("state API persists valid data and rejects malformed shapes", async () => {
  const put = await fetch(`${baseUrl}/api/state`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: validData }) });
  assert.equal(put.status, 200);

  const get = await fetch(`${baseUrl}/api/state`);
  assert.equal(get.status, 200);
  assert.deepEqual((await get.json()).data, validData);

  const invalid = await fetch(`${baseUrl}/api/state`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: { ...validData, tagLibrary: null } }) });
  assert.equal(invalid.status, 400);
});

test("AI endpoint fails clearly when no local model URL is usable", async () => {
  const response = await fetch(`${baseUrl}/api/ai-summary`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: validData }) });
  assert.equal(response.status, 503);
});
