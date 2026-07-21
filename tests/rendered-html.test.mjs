import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: handler } = await import(workerUrl.href);
  const fetch = typeof handler === "function" ? handler : handler.fetch.bind(handler);
  return fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
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
  assert.match(html, /github\.com\/Starkprince-Inc\/studentvoice/i);
  assert.match(html, /GitHub/i);
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
  assert.match(html, /Open documented actors/i);
});

test("renders anonymous actor records without biometric identification", async () => {
  const response = await render("/events/jantar-mantar-july-20/documented-actors");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Documented actors/i);
  assert.match(html, /SV-SAM-U01/i);
  assert.match(html, /FRAME WITHHELD/i);
  assert.match(html, /PRIVATE BOX READY/i);
  assert.match(html, /0 \/ 2 REVIEW APPROVALS/i);
  assert.match(html, /face, resemblance, clothing, or crowd suggestion is never enough/i);
  assert.match(html, /Open evidence record/i);
  assert.doesNotMatch(html, /facial recognition enabled/i);
});

test("renders a separate evidence subpage for an anonymous actor", async () => {
  const response = await render("/events/jantar-mantar-july-20/documented-actors/sv-sam-u01");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /ANONYMOUS EVIDENCE RECORD/i);
  assert.match(html, /PRIVATE REVIEW FRAME READY/i);
  assert.match(html, /Anonymous subject-box status/i);
  assert.match(html, /14:28\.5/i);
  assert.match(html, /382, 105, 568, 536/i);
  assert.match(html, /Derivative SHA-256/i);
  assert.match(html, /Right of reply/i);
  assert.match(html, /Open original at/i);
  assert.doesNotMatch(html, /verified identity/i);
});

test("renders methodology and protected intake information", async () => {
  const [methodology, submit] = await Promise.all([render("/methodology"), render("/submit")]);
  assert.equal(methodology.status, 200);
  assert.equal(submit.status, 200);
  assert.match(await methodology.text(), /No biometrics/i);
  assert.match(await submit.text(), /protected original/i);
});
