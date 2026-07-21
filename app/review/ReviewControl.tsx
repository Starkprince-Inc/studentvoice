"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { documentedActors } from "../data";

type Subject = { id: string; observedRole: string; identityEvidenceOpen: boolean };
type Profile = {
  profileNumber: number;
  subjectId: string;
  observedRole: string;
  identityState: string;
  reviewStatus: string;
  action: string;
  limits: string;
  timestampStart: string;
  timestampEnd: string;
  representativeArtifactId: string | null;
  expectedEvidenceCount: number;
  evidenceCount: number;
  actionCount: number;
};
type IdentitySuggestion = { id: string; subject_id: string; basis: string; proposedName: string; sourceUrl: string; explanation: string; submitted_by: string; state: string; created_at: string };
type ReviewPayload = {
  summary: { total: number; mapped: number; dismissed: number; unreviewed: number };
  subjects: Subject[];
  profiles: Profile[];
  identitySuggestions: IdentitySuggestion[];
  reviewer: { displayName: string; email: string };
};

const emptySummary = { total: 0, mapped: 0, dismissed: 0, unreviewed: 0 };
const fallbackProfiles: Profile[] = documentedActors
  .filter((actor) => actor.identityEvidenceOpen && actor.evidenceFrames?.length)
  .map((actor, index) => ({
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
    evidenceCount: actor.evidenceFrames?.length ?? 0,
    actionCount: actor.evidenceFrames?.filter((frame) => frame.relation === "candidate_action").length ?? 0,
  }));

export function ReviewControl() {
  const [data, setData] = useState<ReviewPayload | null>(null);
  const [message, setMessage] = useState("Loading protected profile index...");

  const load = useCallback(async () => {
    const response = await fetch("/api/review/artifacts?status=all&offset=0&limit=12", { cache: "no-store" });
    const payload = await response.json() as ReviewPayload & { error?: string };
    if (!response.ok) { setMessage(payload.error ?? "Unable to open the profile index."); return; }
    setData(payload);
    setMessage("");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/review/artifacts?status=all&offset=0&limit=12", { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ response, payload: await response.json() as ReviewPayload & { error?: string } }))
      .then(({ response, payload }) => {
        if (!response.ok) { setMessage(payload.error ?? "Unable to open the profile index."); return; }
        setData(payload);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") setMessage("Unable to open the profile index.");
      });
    return () => controller.abort();
  }, []);

  const summary = data?.summary ?? emptySummary;
  const profiles = data?.profiles ?? fallbackProfiles;
  const fallbackMappedCount = fallbackProfiles.reduce((count, profile) => count + profile.expectedEvidenceCount, 0);

  return <div className="shell review-shell">
    <section className="review-summary" aria-label="Review totals">
      <article><strong>{summary.total}</strong><span>private derivatives</span></article>
      <article><strong>{profiles.length}</strong><span>anonymous profiles</span></article>
      <article><strong>{summary.mapped || fallbackMappedCount}</strong><span>profiled evidence frames</span></article>
      <article><strong>{summary.dismissed}</strong><span>dismissed leads</span></article>
    </section>

    <section className="review-profile-gallery" aria-labelledby="profile-gallery-heading">
      <div className="review-profile-section-head"><div><p className="eyebrow">Anonymous person profiles</p><h2 id="profile-gallery-heading">Every defensible person sequence, organized as a profile.</h2><p>Each card comes from manual adjacent-frame review. Open it to see the representative image, every linked instance, continuity limits, and private documentary identity controls.</p></div><span className="meta-chip">NO FACE RECOGNITION</span></div>
      <div className="review-profile-grid">{profiles.map((profile) => <article className="review-profile-card" key={profile.subjectId}><Link className="review-profile-card-image" href={`/review/profiles/${profile.subjectId}`}>{profile.representativeArtifactId ? <img src={`/api/review/artifacts/${profile.representativeArtifactId}/image`} alt={`Representative private frame for anonymous profile ${profile.profileNumber}`} loading="lazy" /> : null}<span>Profile #{String(profile.profileNumber).padStart(2, "0")}</span></Link><div className="review-profile-card-body"><div className="review-artifact-title"><strong>{profile.subjectId}</strong><span>{profile.identityState.replaceAll("_", " ")}</span></div><h3>{profile.observedRole}</h3><p>{profile.action}</p><dl><div><dt>Linked frames</dt><dd>{profile.evidenceCount || profile.expectedEvidenceCount}</dd></div><div><dt>Candidate actions</dt><dd>{profile.actionCount || 1}</dd></div><div><dt>Window</dt><dd>{profile.timestampStart}-{profile.timestampEnd}</dd></div></dl><Link className="button button-primary" href={`/review/profiles/${profile.subjectId}`}>Open person profile</Link></div></article>)}</div>
    </section>

    {message ? <p className="review-message" role="status">{message}</p> : null}
    <section className="review-context-archive" aria-labelledby="context-archive-heading"><div><p className="eyebrow">Preserved scene context</p><h2 id="context-archive-heading">Not every frame should become a person profile.</h2></div><p><strong>{summary.unreviewed}</strong> remaining derivatives are retained privately as crowd, location, transition, or duplicate context. They are no longer presented as an identity inbox. A new profile is created only when a reviewer can follow one relevant subject through an adjacent sequence without biometric inference.</p></section>

    <IdentityPanel subjects={data?.subjects ?? []} suggestions={data?.identitySuggestions ?? []} onSaved={load} setMessage={setMessage} />
  </div>;
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
    <div><p className="eyebrow">Private identity mapping</p><h2 id="identity-control-title">Attach a proposed name with documentary evidence.</h2><p>Names are encrypted and remain private. Resemblance, face comparison, clothing, or crowd guessing cannot be used as the identity basis.</p></div>
    <form className="review-identity-form" onSubmit={submit}>
      <label>Anonymous subject<select required value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Select a person-level record</option>{identitySubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.id} - {subject.observedRole}</option>)}</select></label>
      <label>Proposed name<input required value={proposedName} onChange={(event) => setProposedName(event.target.value)} autoComplete="off" /></label>
      <label>Documentary basis<select value={basis} onChange={(event) => setBasis(event.target.value)}><option value="badge_nameplate">Readable badge or nameplate</option><option value="official_record">Official deployment record</option><option value="court_record">Court record</option><option value="independent_recording">Independent original recording</option><option value="reliable_reporting">Reliable independent reporting</option></select></label>
      <label>Supporting source URL<input type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label>
      <label>Documentary connection<textarea required minLength={40} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Quote or describe the nameplate, roster entry, court filing, reporting, or independent recording." /></label>
      <label className="check-row"><input type="checkbox" required checked={independent} onChange={(event) => setIndependent(event.target.checked)} /><span>This source is genuinely independent of the existing Samdish footage.</span></label>
      <label className="check-row"><input type="checkbox" required checked={notResemblanceOnly} onChange={(event) => setNotResemblanceOnly(event.target.checked)} /><span>This name is not based on facial resemblance, biometric comparison, clothing, or crowd suggestion.</span></label>
      <button className="button button-primary" disabled={saving}>{saving ? "Encrypting..." : "Save private identity suggestion"}</button>
    </form>
    <div className="review-suggestions"><h3>Private identity queue</h3>{suggestions.length ? suggestions.map((suggestion) => <article key={suggestion.id}><div><strong>{suggestion.subject_id} - {suggestion.proposedName}</strong><span>{suggestion.state}</span></div><p>{suggestion.basis.replaceAll("_", " ")} - submitted by {suggestion.submitted_by}</p><a href={suggestion.sourceUrl} target="_blank" rel="noreferrer">Open documentary source</a></article>) : <p>No private identity suggestions have been recorded.</p>}</div>
  </section>;
}
