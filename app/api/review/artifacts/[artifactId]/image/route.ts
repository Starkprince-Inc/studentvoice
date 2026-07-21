import { getEvidenceBucket, getReviewDb, requireReviewApiUser } from "../../../../../review/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ artifactId: string }> }) {
  const user = await requireReviewApiUser();
  if (user instanceof Response) return user;
  const { artifactId } = await params;
  const row = await getReviewDb().prepare("SELECT derivative_key FROM review_artifacts WHERE id = ?").bind(artifactId).first<{ derivative_key: string }>();
  if (!row) return new Response("Not found", { status: 404 });
  const object = await getEvidenceBucket().get(row.derivative_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "image/webp",
      "Content-Length": String(object.size),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
