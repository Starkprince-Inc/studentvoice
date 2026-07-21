import { documentedActors } from "../../../../data";
import { appendReviewAudit, ensureReviewSchema, getReviewDb, requireReviewApiUser } from "../../../../review/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ artifactId: string }> }) {
  const user = await requireReviewApiUser();
  if (user instanceof Response) return user;
  const { artifactId } = await params;
  const db = getReviewDb();
  await ensureReviewSchema(db);
  const current = await db.prepare("SELECT id, status, mapped_subject_id FROM review_artifacts WHERE id = ?").bind(artifactId).first();
  if (!current) return Response.json({ error: "Artifact not found." }, { status: 404 });
  const payload = await request.json() as { action?: string; subjectId?: string | null; relation?: string | null; observation?: string | null };
  if (payload.action === "dismiss" || payload.action === "restore") {
    const nextStatus = payload.action === "dismiss" ? "dismissed" : current.mapped_subject_id ? "mapped" : "unreviewed";
    await db.prepare("UPDATE review_artifacts SET status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(nextStatus, user.email, artifactId).run();
    await appendReviewAudit(user.email, `artifact.${payload.action}`, artifactId);
    return Response.json({ id: artifactId, status: nextStatus });
  }
  if (payload.action !== "map") return Response.json({ error: "Unsupported review action." }, { status: 400 });
  const subjectId = payload.subjectId?.trim() || null;
  if (subjectId && !documentedActors.some((actor) => actor.id === subjectId)) return Response.json({ error: "Unknown anonymous subject." }, { status: 400 });
  const allowedRelations = new Set(["before_context", "candidate_action", "after_context", "context_only"]);
  const relation = payload.relation?.trim() || null;
  if (relation && !allowedRelations.has(relation)) return Response.json({ error: "Unsupported frame relationship." }, { status: 400 });
  const observation = payload.observation?.trim().slice(0, 2000) || null;
  const nextStatus = subjectId ? "mapped" : "unreviewed";
  await db.prepare("UPDATE review_artifacts SET mapped_subject_id = ?, relation = ?, observation = ?, status = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(subjectId, relation, observation, nextStatus, user.email, artifactId).run();
  await appendReviewAudit(user.email, "artifact.mapped", artifactId, { subjectId, relation });
  return Response.json({ id: artifactId, status: nextStatus, mapped_subject_id: subjectId, relation, observation });
}
