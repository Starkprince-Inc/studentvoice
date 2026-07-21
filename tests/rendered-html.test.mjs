import assert from "node:assert/strict";
import test from "node:test";

async function appRequest(path = "/", init = {}, envOverrides = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: handler } = await import(workerUrl.href);
  const fetch = typeof handler === "function" ? handler : handler.fetch.bind(handler);
  const runtimeEnv = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, REVIEWER_EMAILS: "reviewer@example.test", ...envOverrides };
  globalThis.__STUDENTVOICE_ENV__ = runtimeEnv;
  return fetch(new Request(`http://localhost${path}`, init), runtimeEnv, { waitUntil() {}, passThroughOnException() {} });
}

async function render(path = "/") {
  return appRequest(path, { headers: { accept: "text/html" } });
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
  assert.match(html, /Evidence control/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("protects Evidence Control and renders it for an allowlisted reviewer", async () => {
  const anonymous = await appRequest("/review", { headers: { accept: "text/html" }, redirect: "manual" });
  assert.equal(anonymous.status, 307);
  assert.match(anonymous.headers.get("location") ?? "", /signin-with-chatgpt/i);

  const reviewer = await appRequest("/review", { headers: { accept: "text/html", "oai-authenticated-user-email": "reviewer@example.test" } });
  assert.equal(reviewer.status, 200);
  const html = await reviewer.text();
  assert.match(html, /Evidence control/i);
  assert.match(html, /Anonymous person profiles/i);
  assert.match(html, /Every defensible person sequence/i);
  assert.match(html, /Profile #(?:<!-- -->)?07/i);
  assert.match(html, /Open person profile/i);
  assert.match(html, /Not every frame should become a person profile/i);
  assert.match(html, /Save private identity suggestion/i);
  assert.match(html, /NO BIOMETRIC MATCHING/i);
  assert.doesNotMatch(html, /Unlinked frame inbox/i);
});

test("protects and renders a profile-centric private evidence page", async () => {
  const anonymous = await appRequest("/review/profiles/SV-SAM-U01", { headers: { accept: "text/html" }, redirect: "manual" });
  assert.equal(anonymous.status, 307);
  assert.match(anonymous.headers.get("location") ?? "", /signin-with-chatgpt/i);

  const reviewer = await appRequest("/review/profiles/SV-SAM-U01", { headers: { accept: "text/html", "oai-authenticated-user-email": "reviewer@example.test" } });
  assert.equal(reviewer.status, 200);
  const html = await reviewer.text();
  assert.match(html, /Anonymous person profile #(?:<!-- -->)?01/i);
  assert.match(html, /IDENTITY: NOT VERIFIED/i);
  assert.match(html, /Every reviewed instance attached to this person record/i);
  assert.match(html, /P0038/i);
  assert.match(html, /P0039/i);
  assert.match(html, /P0040/i);
  assert.match(html, /Open all profiles/i);
  assert.match(html, /Attach a proposed name to this profile/i);
  assert.match(html, /not a biometric or real-world identification/i);
});

test("renders expanded anonymous profiles from manually reviewed adjacent sequences", async () => {
  const reviewerHeaders = { accept: "text/html", "oai-authenticated-user-email": "reviewer@example.test" };
  const [contactProfile, vehicleProfile] = await Promise.all([
    appRequest("/review/profiles/SV-SAM-U06", { headers: reviewerHeaders }),
    appRequest("/review/profiles/SV-SAM-U09", { headers: reviewerHeaders }),
  ]);
  assert.equal(contactProfile.status, 200);
  assert.equal(vehicleProfile.status, 200);
  const contactHtml = await contactProfile.text();
  const vehicleHtml = await vehicleProfile.text();
  assert.match(contactHtml, /yellow barricade/i);
  assert.match(contactHtml, /P0034/i);
  assert.match(contactHtml, /P0035/i);
  assert.match(contactHtml, /P0036/i);
  assert.match(vehicleHtml, /riot-control vehicle/i);
  assert.match(vehicleHtml, /Attached frames[\s\S]*?10/i);
  assert.match(vehicleHtml, /P0139/i);
  assert.match(vehicleHtml, /P0148/i);
  assert.match(vehicleHtml, /does not establish the equipment type/i);
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
  assert.match(html, /3(?:<!-- -->)? FRAME SEQUENCE/i);
  assert.match(html, /Adjacent frames, separate observations/i);
  assert.match(html, /P0038/i);
  assert.match(html, /P0039/i);
  assert.match(html, /P0040/i);
  assert.match(html, /Submit identity evidence/i);
  assert.match(html, /Right of reply/i);
  assert.match(html, /Open original at/i);
  assert.doesNotMatch(html, /verified identity/i);
});

test("renders a second anonymous candidate with a bounded frame sequence", async () => {
  const response = await render("/events/jantar-mantar-july-20/documented-actors/sv-sam-u04");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /SV-SAM-U04/i);
  assert.match(html, /green helmet/i);
  assert.match(html, /2(?:<!-- -->)? FRAME SEQUENCE/i);
  assert.match(html, /P0041/i);
  assert.match(html, /P0042/i);
  assert.doesNotMatch(html, /verified identity/i);
});

test("renders private documentary identity intake for an anonymous subject", async () => {
  const response = await render("/submit?mode=identity&subject=SV-SAM-U01");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Documentary identity evidence/i);
  assert.match(html, /SUGGESTED_PRIVATE/i);
  assert.match(html, /Proposed name for private verification/i);
  assert.match(html, /not based only on a face/i);
  assert.match(html, /does not persist the proposed name/i);
});

test("validates identity evidence without returning or persisting the proposed name", async () => {
  const form = new FormData();
  form.set("rights_confirmed", "on");
  form.set("safety_confirmed", "on");
  form.set("submission_mode", "identity_assertion");
  form.set("subject_id", "SV-SAM-U01");
  form.set("proposed_name", "Private Example");
  form.set("identity_basis", "official_record");
  form.set("context", "An official deployment record independently links this proposed identity to the cited time and place.");
  form.set("independence_confirmed", "on");
  form.set("not_resemblance_only", "on");
  const response = await appRequest("/api/submission-demo", { method: "POST", body: form });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.identity_state, "suggested_private");
  assert.equal(body.public_name_created, false);
  assert.equal(body.submitted.proposed_name_received, true);
  assert.doesNotMatch(JSON.stringify(body), /Private Example/);
});

test("rejects identity guesses without the non-resemblance confirmation", async () => {
  const form = new FormData();
  form.set("rights_confirmed", "on");
  form.set("safety_confirmed", "on");
  form.set("submission_mode", "identity_assertion");
  form.set("subject_id", "SV-SAM-U01");
  form.set("proposed_name", "Unsafe Guess");
  form.set("identity_basis", "official_record");
  form.set("context", "This explanation is deliberately long enough for server validation but lacks the required confirmation.");
  form.set("independence_confirmed", "on");
  const response = await appRequest("/api/submission-demo", { method: "POST", body: form });
  assert.equal(response.status, 400);
  assert.match(await response.text(), /non-resemblance confirmations are required/i);
});

test("renders methodology and protected intake information", async () => {
  const [methodology, submit] = await Promise.all([render("/methodology"), render("/submit")]);
  assert.equal(methodology.status, 200);
  assert.equal(submit.status, 200);
  assert.match(await methodology.text(), /No biometrics/i);
  assert.match(await submit.text(), /protected original/i);
});
