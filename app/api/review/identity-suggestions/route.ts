import { getDocumentedActor } from "../../../data";
import { appendReviewAudit, encryptIdentityPayload, ensureReviewSchema, getReviewDb, requireReviewApiUser } from "../../../review/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireReviewApiUser();
  if (user instanceof Response) return user;
  const payload = await request.json() as { subjectId?: string; proposedName?: string; basis?: string; sourceUrl?: string; explanation?: string; independent?: boolean; notResemblanceOnly?: boolean };
  const actor = payload.subjectId ? getDocumentedActor(payload.subjectId) : undefined;
  if (!actor?.identityEvidenceOpen) return Response.json({ error: "This record is not accepting private identity evidence." }, { status: 400 });
  const proposedName = payload.proposedName?.trim().slice(0, 200) ?? "";
  const basis = payload.basis?.trim() ?? "";
  const allowedBases = new Set(["badge_nameplate", "official_record", "court_record", "independent_recording", "reliable_reporting"]);
  if (!proposedName || !allowedBases.has(basis)) return Response.json({ error: "A proposed name and supported documentary basis are required." }, { status: 400 });
  const sourceUrl = payload.sourceUrl?.trim().slice(0, 2048) ?? "";
  try { const parsed = new URL(sourceUrl); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); } catch { return Response.json({ error: "A public http(s) documentary source is required." }, { status: 400 }); }
  const explanation = payload.explanation?.trim().slice(0, 4000) ?? "";
  if (explanation.length < 40 || !payload.independent || !payload.notResemblanceOnly) return Response.json({ error: "Explain the independent documentary connection and confirm it is not resemblance-based." }, { status: 400 });
  const db = getReviewDb();
  await ensureReviewSchema(db);
  const id = `SV-ID-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const encrypted = await encryptIdentityPayload({ proposedName, sourceUrl, explanation });
  await db.prepare("INSERT INTO identity_suggestions (id, subject_id, basis, encrypted_payload, iv, submitted_by) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, actor.id, basis, encrypted.encryptedPayload, encrypted.iv, user.email).run();
  await appendReviewAudit(user.email, "identity_suggestion.created", id, { subjectId: actor.id, basis });
  return Response.json({ id, state: "suggested_private", public_name_created: false }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
