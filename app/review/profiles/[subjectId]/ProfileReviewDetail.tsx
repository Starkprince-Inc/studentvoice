"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentedActor } from "../../../data";

type Artifact = {
  id: string;
  timestamp: string;
  sha256: string;
  status: string;
  relation: string | null;
  observation: string | null;
  continuityLimit?: string;
};

type IdentitySuggestion = { id: string; basis: string; proposedName: string; sourceUrl: string; submitted_by: string; state: string };

export function ProfileReviewDetail({ actor, profileNumber }: { actor: DocumentedActor; profileNumber: number }) {
  const fallbackArtifacts = useMemo<Artifact[]>(() => (actor.evidenceFrames ?? []).map((frame) => ({
    id: frame.id,
    timestamp: frame.timestamp,
    sha256: frame.derivativeSha256,
    status: "mapped",
    relation: frame.relation,
    observation: frame.observation,
    continuityLimit: frame.continuityLimit,
  })), [actor.evidenceFrames]);
  const [artifacts, setArtifacts] = useState(fallbackArtifacts);
  const [suggestions, setSuggestions] = useState<IdentitySuggestion[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const representative = artifacts.find((artifact) => artifact.relation === "candidate_action") ?? artifacts[0];

  const load = useCallback(async () => {
    const response = await fetch(`/api/review/profiles/${actor.id}`, { cache: "no-store" });
    const payload = await response.json() as { artifacts?: Artifact[]; identitySuggestions?: IdentitySuggestion[]; error?: string };
    if (!response.ok) { setMessage(payload.error ?? "Unable to load this profile."); return; }
    setArtifacts(payload.artifacts ?? []);
    setSuggestions(payload.identitySuggestions ?? []);
  }, [actor.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/review/profiles/${actor.id}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => ({ response, payload: await response.json() as { artifacts?: Artifact[]; identitySuggestions?: IdentitySuggestion[]; error?: string } }))
      .then(({ response, payload }) => {
        if (!response.ok) { setMessage(payload.error ?? "Unable to load this profile."); return; }
        setArtifacts(payload.artifacts ?? []);
        setSuggestions(payload.identitySuggestions ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") setMessage("Unable to load this profile.");
      });
    return () => controller.abort();
  }, [actor.id]);

  async function removeArtifact(artifact: Artifact, dismiss: boolean) {
    setBusyId(artifact.id);
    const response = await fetch(`/api/review/artifacts/${artifact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dismiss ? { action: "dismiss" } : { action: "map", subjectId: null, relation: artifact.relation, observation: artifact.observation }),
    });
    const body = await response.json() as { error?: string };
    setMessage(response.ok ? `${artifact.id} ${dismiss ? "dismissed" : "returned to the unlinked inbox"}.` : body.error ?? "Could not update this frame.");
    setBusyId(null);
    if (response.ok) setArtifacts((current) => current.filter((item) => item.id !== artifact.id));
  }

  return <div className="shell review-profile-shell">
    <section className="review-profile-overview">
      <div className="review-profile-portrait">{representative ? <img src={`/api/review/artifacts/${representative.id}/image`} alt={`Representative private review frame for anonymous profile ${profileNumber}`} /> : null}<span>Profile #{String(profileNumber).padStart(2, "0")}</span></div>
      <div><p className="eyebrow">Identity not revealed</p><h2>{actor.observedRole}</h2><p className="review-profile-action">{actor.action}</p><div className="notice"><strong>Review limit:</strong> {actor.limits}</div><dl className="review-profile-facts"><div><dt>Attached frames</dt><dd>{artifacts.length}</dd></div><div><dt>Window</dt><dd>{actor.timestampStart}-{actor.timestampEnd}</dd></div><div><dt>Approvals</dt><dd>{actor.reviewApprovals} / 2</dd></div></dl></div>
    </section>

    <section className="review-profile-evidence" aria-labelledby="profile-evidence-heading">
      <div className="review-profile-section-head"><div><p className="eyebrow">Linked evidence</p><h2 id="profile-evidence-heading">Every reviewed instance attached to this person record.</h2><p>Cards are ordered by source time. Context frames and candidate-action frames remain distinct so the interface does not overstate what any still proves.</p></div><Link className="button button-primary" href="/review">Open all profiles</Link></div>
      {message ? <p className="review-message" role="status">{message}</p> : null}
      <div className="review-profile-evidence-grid">{artifacts.map((artifact, index) => <article className="profile-evidence-card" key={artifact.id}><div className="review-frame"><img src={`/api/review/artifacts/${artifact.id}/image`} alt={`Private evidence frame ${artifact.id} at ${artifact.timestamp}`} loading={index < 2 ? "eager" : "lazy"} /><span>{formatRelation(artifact.relation)}</span></div><div className="profile-evidence-body"><div className="review-artifact-title"><strong>{artifact.id}</strong><time>{artifact.timestamp}</time></div><h3>{artifact.relation === "candidate_action" ? "Conduct under review" : "Sequence context"}</h3><p>{artifact.observation ?? "No reviewer observation has been saved."}</p><p className="profile-evidence-limit"><strong>What this does not establish:</strong> {artifact.continuityLimit ?? actor.limits}</p><p className="review-hash">SHA-256 {artifact.sha256}</p><div className="review-card-actions"><button className="button button-outline" disabled={busyId === artifact.id} onClick={() => removeArtifact(artifact, false)}>Remove from profile</button><button className="button button-outline" disabled={busyId === artifact.id} onClick={() => removeArtifact(artifact, true)}>Dismiss artifact</button></div></div></article>)}</div>
      {!artifacts.length ? <div className="notice">No active frames are attached to this profile. The original derivatives remain preserved in the private scene archive.</div> : null}
    </section>

    <ProfileIdentityForm actorId={actor.id} suggestions={suggestions} onSaved={load} setMessage={setMessage} />
  </div>;
}

function formatRelation(value: string | null) {
  return (value ?? "context_only").replaceAll("_", " ");
}

function ProfileIdentityForm({ actorId, suggestions, onSaved, setMessage }: { actorId: string; suggestions: IdentitySuggestion[]; onSaved: () => Promise<void>; setMessage: (value: string) => void }) {
  const [proposedName, setProposedName] = useState("");
  const [basis, setBasis] = useState("official_record");
  const [sourceUrl, setSourceUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [independent, setIndependent] = useState(false);
  const [notResemblanceOnly, setNotResemblanceOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    const response = await fetch("/api/review/identity-suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subjectId: actorId, proposedName, basis, sourceUrl, explanation, independent, notResemblanceOnly }) });
    const body = await response.json() as { id?: string; error?: string };
    setMessage(response.ok ? `Private identity suggestion ${body.id} saved for ${actorId}. No public name was created.` : body.error ?? "Could not save identity evidence.");
    if (response.ok) { setProposedName(""); setSourceUrl(""); setExplanation(""); setIndependent(false); setNotResemblanceOnly(false); await onSaved(); }
    setSaving(false);
  }
  return <section className="review-profile-identity" aria-labelledby="profile-identity-heading"><div><p className="eyebrow">Documentary identity mapping</p><h2 id="profile-identity-heading">Attach a proposed name to this profile.</h2><p>The name remains encrypted and private until independent evidence, two reviewers, editor approval, and legal review are complete. A face or resemblance is never sufficient.</p>{suggestions.length ? <div className="review-suggestions"><h3>Private suggestions for this profile</h3>{suggestions.map((suggestion) => <article key={suggestion.id}><div><strong>{suggestion.proposedName}</strong><span>{suggestion.state}</span></div><p>{suggestion.basis.replaceAll("_", " ")} - submitted by {suggestion.submitted_by}</p><a href={suggestion.sourceUrl} target="_blank" rel="noreferrer">Open documentary source</a></article>)}</div> : null}</div><form className="review-identity-form" onSubmit={submit}><label>Proposed name<input required value={proposedName} onChange={(event) => setProposedName(event.target.value)} autoComplete="off" /></label><label>Documentary basis<select value={basis} onChange={(event) => setBasis(event.target.value)}><option value="badge_nameplate">Readable badge or nameplate</option><option value="official_record">Official deployment record</option><option value="court_record">Court record</option><option value="independent_recording">Independent original recording</option><option value="reliable_reporting">Reliable independent reporting</option></select></label><label>Supporting source URL<input type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} /></label><label>Documentary connection<textarea required minLength={40} value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="Explain exactly how this record connects the proposed name to this event and time window." /></label><label className="check-row"><input type="checkbox" required checked={independent} onChange={(event) => setIndependent(event.target.checked)} /><span>This source is independent of the Samdish footage.</span></label><label className="check-row"><input type="checkbox" required checked={notResemblanceOnly} onChange={(event) => setNotResemblanceOnly(event.target.checked)} /><span>This is not based on facial resemblance, biometric comparison, clothing, or crowd suggestion.</span></label><button className="button button-primary" disabled={saving}>{saving ? "Encrypting..." : "Save private identity suggestion"}</button></form></section>;
}
