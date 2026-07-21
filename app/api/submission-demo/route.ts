import { NextResponse } from "next/server";
import { getDocumentedActor } from "../../data";

function safeText(value: FormDataEntryValue | null, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const form = await request.formData();
  if (!form.get("rights_confirmed") || !form.get("safety_confirmed")) {
    return NextResponse.json({ error: "Both confirmations are required." }, { status: 400 });
  }
  const sourceUrl = safeText(form.get("source_url"), 2048);
  if (sourceUrl) {
    try { const parsed = new URL(sourceUrl); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); }
    catch { return NextResponse.json({ error: "Only public http(s) source links are accepted." }, { status: 400 }); }
  }
  const submissionMode = safeText(form.get("submission_mode"), 40) || "evidence";
  const context = safeText(form.get("context"));
  if (submissionMode === "identity_assertion") {
    const subjectId = safeText(form.get("subject_id"), 80);
    const actor = getDocumentedActor(subjectId);
    const proposedName = safeText(form.get("proposed_name"), 200);
    const identityBasis = safeText(form.get("identity_basis"), 40);
    const allowedBases = new Set(["badge_nameplate", "official_record", "court_record", "independent_recording", "reliable_reporting"]);
    if (!actor?.identityEvidenceOpen) return NextResponse.json({ error: "This anonymous subject record is not accepting identity evidence." }, { status: 400 });
    if (!proposedName) return NextResponse.json({ error: "A proposed name is required for private verification." }, { status: 400 });
    if (!allowedBases.has(identityBasis)) return NextResponse.json({ error: "A supported documentary identity basis is required." }, { status: 400 });
    if (context.length < 40) return NextResponse.json({ error: "Explain the documentary connection and source independence in at least 40 characters." }, { status: 400 });
    if (!form.get("independence_confirmed") || !form.get("not_resemblance_only")) {
      return NextResponse.json({ error: "Independence and non-resemblance confirmations are required." }, { status: 400 });
    }
    const receipt = `SV-ID-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    return NextResponse.json({
      receipt,
      status: "identity_manifest_validated",
      identity_state: "suggested_private",
      public_name_created: false,
      note: "Demo only: the proposed name, contact information, and evidence were validated but not persisted.",
      submitted: {
        subject_id: actor.id,
        identity_basis: identityBasis,
        proposed_name_received: true,
        source_url: sourceUrl || null,
        context_length: context.length,
      },
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }
  const receipt = `SV-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return NextResponse.json({ receipt, status: "manifest_received", note: "Demo only: no file or contact information was persisted.", submitted: { kind: safeText(form.get("kind"), 20), source_url: sourceUrl || null, context_length: context.length } }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
