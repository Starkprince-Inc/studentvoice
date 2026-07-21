import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";

export type ReviewBindings = {
  DB?: D1Database;
  EVIDENCE?: R2Bucket;
  REVIEWER_EMAILS?: string;
  REVIEW_IMPORT_TOKEN?: string;
  IDENTITY_ENCRYPTION_KEY?: string;
};

declare global {
  // The Worker sets platform bindings before dispatching each request. Tests set
  // the same object explicitly, keeping this module portable outside Workers.
  var __STUDENTVOICE_ENV__: ReviewBindings | undefined;
}

export function bindings() {
  return globalThis.__STUDENTVOICE_ENV__ ?? {};
}

export function reviewerAllowed(email: string) {
  const allowlist = (bindings().REVIEWER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.trim().toLowerCase());
}

export async function requireReviewApiUser(): Promise<ChatGPTUser | Response> {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in with ChatGPT to continue." }, { status: 401 });
  if (!reviewerAllowed(user.email)) return Response.json({ error: "This account is not on the reviewer allowlist." }, { status: 403 });
  return user;
}

export function getReviewDb() {
  const db = bindings().DB;
  if (!db) throw new Error("Review database binding is unavailable.");
  return db;
}

export function getEvidenceBucket() {
  const bucket = bindings().EVIDENCE;
  if (!bucket) throw new Error("Evidence object storage binding is unavailable.");
  return bucket;
}

export async function ensureReviewSchema(db = getReviewDb()) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS review_artifacts (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      derivative_key TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      source_series TEXT,
      status TEXT NOT NULL DEFAULT 'unreviewed',
      mapped_subject_id TEXT,
      relation TEXT,
      observation TEXT,
      updated_by TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS review_artifacts_status_idx ON review_artifacts(status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS review_artifacts_subject_idx ON review_artifacts(mapped_subject_id)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS identity_suggestions (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      basis TEXT NOT NULL,
      encrypted_payload TEXT NOT NULL,
      iv TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'suggested_private',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS identity_suggestions_subject_idx ON identity_suggestions(subject_id)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS review_audit (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
  ]);
}

export async function appendReviewAudit(actor: string, action: string, targetId: string, payload?: unknown) {
  const db = getReviewDb();
  await db.prepare("INSERT INTO review_audit (id, actor, action, target_id, payload) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), actor, action, targetId, payload ? JSON.stringify(payload) : null)
    .run();
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey() {
  const encoded = bindings().IDENTITY_ENCRYPTION_KEY;
  if (!encoded) throw new Error("Identity encryption key is unavailable.");
  const raw = base64ToBytes(encoded);
  if (raw.byteLength !== 32) throw new Error("Identity encryption key must be 32 bytes.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptIdentityPayload(value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), plaintext);
  return { encryptedPayload: bytesToBase64(new Uint8Array(ciphertext)), iv: bytesToBase64(iv) };
}

export async function decryptIdentityPayload(encryptedPayload: string, iv: string) {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    await encryptionKey(),
    base64ToBytes(encryptedPayload),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as { proposedName: string; sourceUrl: string; explanation: string };
}

export async function tokenMatches(provided: string | null) {
  const expected = bindings().REVIEW_IMPORT_TOKEN ?? "";
  if (!expected || !provided) return false;
  const left = new TextEncoder().encode(expected);
  const right = new TextEncoder().encode(provided);
  const [leftHash, rightHash] = await Promise.all([crypto.subtle.digest("SHA-256", left), crypto.subtle.digest("SHA-256", right)]);
  return bytesToBase64(new Uint8Array(leftHash)) === bytesToBase64(new Uint8Array(rightHash));
}
