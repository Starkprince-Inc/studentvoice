import { documentedActors } from "../../../data";
import { ensureReviewSchema, getEvidenceBucket, getReviewDb, tokenMatches } from "../../../review/store";

export const dynamic = "force-dynamic";

type ManifestItem = {
  record_id?: string;
  timestamp?: string;
  derivative_file?: string;
  sha256?: string;
  source_series?: string;
};

const reviewedProfileLinks: Record<string, { subjectId: string; relation: string; observation: string }> = Object.fromEntries(
  documentedActors.flatMap((actor) => (actor.evidenceFrames ?? []).map((frame) => [frame.id, {
    subjectId: actor.id,
    relation: frame.relation,
    observation: frame.observation,
  }])),
);

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const suppliedToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!(await tokenMatches(suppliedToken))) return Response.json({ error: "Import authorization failed." }, { status: 401 });
  const form = await request.formData();
  const manifestPart = form.get("manifest");
  if (!(manifestPart instanceof File)) return Response.json({ error: "Manifest file is required." }, { status: 400 });
  let manifest: { items?: ManifestItem[] };
  try { manifest = JSON.parse(await manifestPart.text()); } catch { return Response.json({ error: "Manifest is not valid JSON." }, { status: 400 }); }
  const files = new Map<string, File>();
  for (const entry of form.getAll("files")) if (entry instanceof File) files.set(entry.name, entry);
  const items = (manifest.items ?? []).filter((item): item is Required<Pick<ManifestItem, "record_id" | "timestamp" | "derivative_file" | "sha256">> & ManifestItem => Boolean(item.record_id && item.timestamp && item.derivative_file && item.sha256));
  if (!items.length) return Response.json({ error: "Manifest contains no importable artifacts." }, { status: 400 });
  const db = getReviewDb();
  const bucket = getEvidenceBucket();
  await ensureReviewSchema(db);
  const statements: D1PreparedStatement[] = [];
  let imported = 0;
  const missing: string[] = [];
  for (const item of items) {
    const file = files.get(item.derivative_file);
    if (!file) { missing.push(item.derivative_file); continue; }
    const namespace = (item.source_series ?? "review")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "review";
    const key = `${namespace}/${item.derivative_file}`;
    await bucket.put(key, file.stream(), { httpMetadata: { contentType: "image/webp" }, customMetadata: { sha256: item.sha256, timestamp: item.timestamp, recordId: item.record_id } });
    const reviewedLink = reviewedProfileLinks[item.record_id];
    statements.push(db.prepare(`INSERT INTO review_artifacts (id, timestamp, derivative_key, sha256, source_series, status, mapped_subject_id, relation, observation, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET timestamp = excluded.timestamp, derivative_key = excluded.derivative_key, sha256 = excluded.sha256, source_series = excluded.source_series`)
      .bind(item.record_id, item.timestamp, key, item.sha256, item.source_series ?? null, reviewedLink ? "mapped" : "unreviewed", reviewedLink?.subjectId ?? null, reviewedLink?.relation ?? null, reviewedLink?.observation ?? null, reviewedLink ? "system.reviewed-seed" : null));
    imported += 1;
  }
  for (let index = 0; index < statements.length; index += 50) await db.batch(statements.slice(index, index + 50));
  return Response.json({ imported, missing, total_manifest_items: items.length }, { status: imported ? 201 : 400 });
}
