import { documentedActors } from "../../../data";
import { decryptIdentityPayload, ensureReviewSchema, getReviewDb, requireReviewApiUser } from "../../../review/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireReviewApiUser();
  if (user instanceof Response) return user;
  const db = getReviewDb();
  await ensureReviewSchema(db);
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "active";
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(72, Math.max(12, Number.parseInt(url.searchParams.get("limit") ?? "36", 10) || 36));
  const where = status === "all" ? "" : status === "active" ? "WHERE status != 'dismissed'" : "WHERE status = ?";
  const query = db.prepare(`SELECT id, timestamp, sha256, source_series, status, mapped_subject_id, relation, observation, updated_at FROM review_artifacts ${where} ORDER BY timestamp, id LIMIT ? OFFSET ?`);
  const rows = status === "all" || status === "active"
    ? await query.bind(limit, offset).all()
    : await query.bind(status, limit, offset).all();
  const summary = await db.prepare(`SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'mapped' THEN 1 ELSE 0 END) AS mapped,
      SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) AS dismissed,
      SUM(CASE WHEN status = 'unreviewed' THEN 1 ELSE 0 END) AS unreviewed
    FROM review_artifacts`).first<Record<string, number>>();
  const suggestions = await db.prepare("SELECT id, subject_id, basis, encrypted_payload, iv, submitted_by, state, created_at FROM identity_suggestions ORDER BY created_at DESC LIMIT 50").all();
  const profileCounts = await db.prepare(`SELECT mapped_subject_id, COUNT(*) AS evidence_count,
      SUM(CASE WHEN relation = 'candidate_action' THEN 1 ELSE 0 END) AS action_count
    FROM review_artifacts
    WHERE status = 'mapped' AND mapped_subject_id IS NOT NULL
    GROUP BY mapped_subject_id`).all();
  const countsBySubject = new Map(profileCounts.results.map((row) => [String(row.mapped_subject_id), {
    evidenceCount: Number(row.evidence_count ?? 0),
    actionCount: Number(row.action_count ?? 0),
  }]));
  const profileActors = documentedActors.filter((actor) => actor.identityEvidenceOpen && actor.evidenceFrames?.length);
  const profiles = profileActors.map((actor, index) => ({
    profileNumber: index + 1,
    subjectId: actor.id,
    observedRole: actor.observedRole,
    identityState: actor.identityState,
    reviewStatus: actor.reviewStatus,
    action: actor.action,
    limits: actor.limits,
    timestampStart: actor.timestampStart,
    timestampEnd: actor.timestampEnd,
    representativeArtifactId: actor.evidenceFrames?.find((frame) => frame.relation === "candidate_action")?.id ?? actor.evidenceFrames?.[0]?.id ?? null,
    expectedEvidenceCount: actor.evidenceFrames?.length ?? 0,
    evidenceCount: countsBySubject.get(actor.id)?.evidenceCount ?? 0,
    actionCount: countsBySubject.get(actor.id)?.actionCount ?? 0,
  }));
  const identitySuggestions = await Promise.all(suggestions.results.map(async (row) => {
    const payload = await decryptIdentityPayload(String(row.encrypted_payload), String(row.iv));
    return { id: row.id, subject_id: row.subject_id, basis: row.basis, submitted_by: row.submitted_by, state: row.state, created_at: row.created_at, ...payload };
  }));
  return Response.json({
    artifacts: rows.results,
    summary: summary ?? { total: 0, mapped: 0, dismissed: 0, unreviewed: 0 },
    subjects: documentedActors.map(({ id, observedRole, identityEvidenceOpen }) => ({ id, observedRole, identityEvidenceOpen: Boolean(identityEvidenceOpen) })),
    profiles,
    identitySuggestions,
    reviewer: { displayName: user.displayName, email: user.email },
    paging: { offset, limit },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
