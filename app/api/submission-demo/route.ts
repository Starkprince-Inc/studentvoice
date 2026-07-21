import { NextResponse } from "next/server";

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
  const receipt = `SV-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return NextResponse.json({ receipt, status: "manifest_received", note: "Demo only: no file or contact information was persisted.", submitted: { kind: safeText(form.get("kind"), 20), source_url: sourceUrl || null, context_length: safeText(form.get("context")).length } }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
