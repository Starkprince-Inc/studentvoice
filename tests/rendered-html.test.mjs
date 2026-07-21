import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: handler } = await import(workerUrl.href);
  return handler(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the public evidence homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /StudentVoice/i);
  assert.match(html, /Evidence,/i);
  assert.match(html, /not outrage/i);
  assert.match(html, /Jantar Mantar/i);
  assert.match(html, /No biometric identification/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("renders the case file with explicit uncertainty", async () => {
  const response = await render("/events/jantar-mantar-july-20");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Claim ledger/i);
  assert.match(html, /corroborated/i);
  assert.match(html, /contested/i);
  assert.match(html, /No name from a face/i);
});

test("renders methodology and protected intake information", async () => {
  const [methodology, submit] = await Promise.all([render("/methodology"), render("/submit")]);
  assert.equal(methodology.status, 200);
  assert.equal(submit.status, 200);
  assert.match(await methodology.text(), /No biometrics/i);
  assert.match(await submit.text(), /protected original/i);
});
