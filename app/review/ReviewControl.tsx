"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";

type Artifact = {
  id: string;
  timestamp: string;
  sha256: string;
  source_series: string | null;
  status: "unreviewed" | "mapped" | "dismissed";
  mapped_subject_id: string | null;
  relation: string | null;
  observation: string | null;
  updated_at: string;
};

type Subject = { id: string; observedRole: string; identityEvidenceOpen: boolean };
type IdentitySuggestion = { id: string; subject_id: string; basis: string; proposedName: string; sourceUrl: string; explanation: string; submitted_by: string; state: string; created_at: string };
type ReviewPayload = {
  artifacts: Artifact[];
  summary: { total: number; mapped: number; dismissed: number; unreviewed: number };
  subjects: Subject[];
  identitySuggestions: IdentitySuggestion[];
  reviewer: { displayName: string; email: string };
  paging: { offset: number; limit: number };
};

const emptySummary = { total: 0, mapped: 0, dismissed: 0, unreviewed: 0 };

export function ReviewControl() {
  const [data, setData] = useState<ReviewPayload | null>(null);
  const [status, setStatus] = useState("active");
  const [offset, setOffset] = useState(0);
  const [message, setMessage] = useState("Loading protected frame index…");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/review/artifacts?status=${encodeURIComponent(status)}&offset=${offset}&limit=36`, { cache: "no-store" });
    const payload = await response.json() as ReviewPayload & { error?: string };
    if (!response.ok) { setMessage(payload.error ?? "Unable to open the review index."); return; }
    setData(payload);
    setMessage(payload.artifacts.length ? "" : "No artifacts match this filter.");
  }, [offset, status]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/review/artifacts?status=${encodeURIComponent(status)}&offset=${offset}&limit=36`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ response, payload: await response.json() as ReviewPayload & { error?: string } }))
      .then(({ response, payload }) => {
        if (!response.ok) { setMessage(payload.error ?? "Unable to open the review index."); return; }
        setData(payload);
        setMessage(payload.artifacts.length ? "" : "No artifacts match this filter.");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") setMessage("Unable to open the review index.");
      });
    return () => controller.abort();
  }, [offset, status]);
  const summary = data?.summary ?? emptySummary;

  async function updateArtifact(artifact: Artifact, payload: Record<string, unknown>) {
    setBusyId(artifact.id);
    const response = await fetch(`/api/review/artifacts/${artifact.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json() as { error?: string };
    setMessage(response.ok ? `Saved ${artifact.id}.` : body.error ?? `Could not update ${artifact.id}.`);
    setBusyId(null);
    if (response.ok) await load();
  }

  return <div className="shell review-shell">
    <section className="review-summary" aria-label="Review totals">
      <article><strong>{summary.total}</strong><span>private derivatives</span></article>
      <article><strong>{summary.unreviewed}</strong><span>awaiting review</span></article>
      <article><strong>{summary.mapped}</strong><span>mapped to subjects</span></article>
      <article><strong>{summary.dismissed}</strong><span>dismissed leads</span></article>
    </section>

    <div className="review-toolbar">
      <div><p className="eyebrow">Frame queue</p><h2>Attach frames to anonymous profiles</h2></div>
      <label className="review-filter">Show<select value={status} onChange={(event) => { setMessage("Loading protected frame index…"); setStatus(event.target.value); setOffset(0); }}><option value="active">Active</option><option value="unreviewed">Unreviewed</option><option value="mapped">Mapped</option><option value="dismissed">Dismissed</option><option value="all">All</option></select></label>
    </div>

    {message ? <p className="review-message" role="status">{message}</p> : null}
    <section className="review-artifact-grid" aria-label="Private frame artifacts">
      {data?.artifacts.map((artifact) => <ArtifactCard key={artifact.id} artifact={artifact} subjects={data.subjects} busy={busyId === artifact.id} onUpdate={updateArtifact} />)}
    </section>
    <div className="review-pagination"><button className="button button-outline" disabled={offset === 0} onClick={() => { setMessage("Loading protected frame index…"); setOffset(Math.max(0, offset - 36)); }}>← Previous</button><span>{offset + 1}–{Math.min(offset + (data?.artifacts.length ?? 0), summary.total)} of {summary.total}</span><button className="button button-outline" disabled={!data || data.artifacts.length < 36} onClick={() => { setMessage("Loading protected frame index…"); setOffset(offset + 36); }}>Next →</button></div>

    <IdentityPanel subjects={data?.subjects ?? []} suggestions={data?.identitySuggestions ?? []} onSaved={load} setMessage={setMessage} />
  </div>;
}

function ArtifactCard({ artifact, subjects, busy, onUpdate }: { artifact: Artifact; subjects: Subject[]; busy: boolean; onUpdate: (artifact: Artifact, payload: Record<string, unknown>) => Promise<void> }) {
  const [subjectId, setSubjectId] = useState(artifact.mapped_subject_id ?? "");
  const [relation, setRelation] = useState(artifact.relation ?? "context_only");
  const [observation, setObservation] = useState(artifact.observation ?? "");
  return <article className={`review-artifact-card status-card-${artifact.status}`}>
    <div className="review-frame"><img src={`/api/review/artifacts/${artifact.id}/image`} alt={`Private review derivative ${artifact.id} at ${artifact.timestamp}`} loading="lazy" /><span>{artifact.status}</span></div>
    <div className="review-artifact-body">
      <div className="review-artifact-title"><strong>{artifact.id}</strong><time>{artifact.timestamp}</time></div>
      <p className="review-hash">SHA-256 {artifact.sha256}</p>
      <label>Anonymous subject<select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Not mapped</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.id} — {subject.observedRole}</option>)}</select></label>
      <label>Frame relationship<select value={relation} onChange={(event) => setRelation(event.target.value)}><option value="context_only">Context only</option><option value="before_context">Before context</option><option value="candidate_action">Candidate action</option><option value="after_context">After context</option></select></label>
      <label>Reviewer observation<textarea value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Describe only what this frame visibly supports." /></label>
      <div className="review-card-actions"><button className="button button-primary" disabled={busy || artifact.status === "dismissed"} onClick={() => onUpdate(artifact, { action: "map", subjectId: subjectId || null, relation, observation })}>{busy ? "Saving…" : "Save mapping"}</button><button className="button button-outline" disabled={busy} onClick={() => onUpdate(artifact, { action: artifact.status === "dismissed" ? "restore" : "dismiss" })}>{artifact.status === "dismissed" ? "Restore" : "Dismiss"}</button></div>
    </div>
  </article>;
}

function IdentityPanel({ subjects, suggestions, onSaved, setMessage }: { subjects: Subject[]; suggestions: IdentitySuggestion[]; onSaved: () => Promise<void>; setMessage: (value: string) => void }) {
  const identitySubjects = useMemo(() => subjects.filter((subject) => subject.identityEvidenceOpen), [subjects]);
  const [subjectId, setSubjectId] = useState("");
  const [proposedName, setProposedName] = useState("");
  const [basis, setBasis] = useState("official_record");
  const [sourceUrl, setSourceUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [independent, setIndependent] = useState(false);
  const [notResemblanceOnly, setNotResemblanceOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    const response = await fetch("/api/review/identity-suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId, proposedName, basis, sourceUrl, explanation, independent, notResemblanceOnly }) });
    const body = await response.json() as { id?: string; error?: string };
    setMessage(response.ok ? `Private identity suggestion ${body.id} created. No public name was created.` : body.error ?? "Could not save identity evidence.");
    if (response.ok) { setProposedName(""); setSourceUrl(""); setExplanation(""); setIndependent(false); setNotResemblanceOnly(false); await onSaved(); }
    setSaving(false);
  }

  return <section className="review-identity-section" aria-labelledby="identity-control-title">
    <div><p className="eyebrow">Private identity mapping</p><h2 id="identity-control-title">Attach a proposed name—with documentary evidence.</h2><p>Names are encrypted and remain private. Resemblance, face comparison, clothing, or crowd guessing cannot be used as the identity basis.</p></div>
    <form className="review-identity-form" onSubmit={submit}>
      <label>Anonymous subject<select required value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Select a person-level record</option>{identitySubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.id} — {subject.observedRole}</option>)}</select></label>
      <label>Proposed name<input required value={proposedName} onChange={(event) => setProposedName(event.target.value)} autoComplete="off" /></label>
      <label>Documentary basis<select value={basis} onChange={(event) => setBasis(event.target.value)}><option value="badge_nameplate">Readable badge or nameplate</option><option value="official_record">Official deployment record</option><option value="court_record">Court record</option><option value="independent_recording">Independent original recording</option><option value="reliable_reporting">Reliable independent reporting</option></select></label>
      <label>Supporting source URL<input type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label>
      <label>Documentary connection<textarea required minLength={40} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Quote or describe the nameplate, roster entry, court filing, reporting, or independent recording." /></label>
      <label className="check-row"><input type="checkbox" required checked={independent} onChange={(event) => setIndependent(event.target.checked)} /><span>This source is genuinely independent of the existing Samdish footage.</span></label>
      <label className="check-row"><input type="checkbox" required checked={notResemblanceOnly} onChange={(event) => setNotResemblanceOnly(event.target.checked)} /><span>This name is not based on facial resemblance, biometric comparison, clothing, or crowd suggestion.</span></label>
      <button className="button button-primary" disabled={saving}>{saving ? "Encrypting…" : "Save private identity suggestion"}</button>
    </form>
    <div className="review-suggestions"><h3>Private identity queue</h3>{suggestions.length ? suggestions.map((suggestion) => <article key={suggestion.id}><div><strong>{suggestion.subject_id} → {suggestion.proposedName}</strong><span>{suggestion.state}</span></div><p>{suggestion.basis.replaceAll("_", " ")} · submitted by {suggestion.submitted_by}</p><a href={suggestion.sourceUrl} target="_blank" rel="noreferrer">Open documentary source ↗</a></article>) : <p>No private identity suggestions have been recorded.</p>}</div>
  </section>;
}
