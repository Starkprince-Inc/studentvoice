import { getDocumentedActor, documentedActors } from "../../../../data";
import { decryptIdentityPayload, ensureReviewSchema, getReviewDb, requireReviewApiUser } from "../../../../review/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ subjectId: string }> }) {
  const user = await requireReviewApiUser();
  if (user instanceof Response) return user;
  const { subjectId } = await params;
  const actor = getDocumentedActor(subjectId);
  if (!actor?.identityEvidenceOpen || !actor.evidenceFrames?.length) {
    return Response.json({ error: "Anonymous person profile not found." }, { status: 404 });
  }
  const db = getReviewDb();
  await ensureReviewSchema(db);
  const artifacts = await db.prepare(`SELECT id, timestamp, sha256, source_series, status, mapped_subject_id, relation, observation, updated_at
    FROM review_artifacts
    WHERE mapped_subject_id = ? AND status != 'dismissed'
    ORDER BY timestamp, id`).bind(actor.id).all();
  const suggestions = await db.prepare(`SELECT id, subject_id, basis, encrypted_payload, iv, submitted_by, state, created_at
    FROM identity_suggestions WHERE subject_id = ? ORDER BY created_at DESC`).bind(actor.id).all();
  const identitySuggestions = await Promise.all(suggestions.results.map(async (row) => {
    const payload = await decryptIdentityPayload(String(row.encrypted_payload), String(row.iv));
    return { id: row.id, subject_id: row.subject_id, basis: row.basis, submitted_by: row.submitted_by, state: row.state, created_at: row.created_at, ...payload };
  }));
  const profileActors = documentedActors.filter((candidate) => candidate.identityEvidenceOpen && candidate.evidenceFrames?.length);
  const knownFrames = new Map(actor.evidenceFrames.map((frame) => [frame.id, frame]));
  return Response.json({
    profileNumber: profileActors.findIndex((candidate) => candidate.id === actor.id) + 1,
    actor,
    artifacts: artifacts.results.map((artifact) => ({ ...artifact, continuityLimit: knownFrames.get(String(artifact.id))?.continuityLimit ?? actor.limits })),
    identitySuggestions,
    reviewer: { displayName: user.displayName, email: user.email },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
