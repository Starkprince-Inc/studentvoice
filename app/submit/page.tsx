import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { getDocumentedActor } from "../data";

export const metadata = {
  title: "Submit evidence",
  description: "Submit a public link, original-file manifest, or documentary identity evidence for protected review.",
};

type SubmitSearchParams = Promise<{ mode?: string; subject?: string }>;

export default async function SubmitPage({ searchParams }: { searchParams: SubmitSearchParams }) {
  const query = await searchParams;
  const actor = query.subject ? getDocumentedActor(query.subject) : undefined;
  const isIdentityAssertion = query.mode === "identity" && Boolean(actor?.identityEvidenceOpen);

  return <><SiteHeader /><main>
    <header className="page-hero shell">
      <p className="eyebrow">Protected intake · सुरक्षित जमा</p>
      <h1>{isIdentityAssertion ? `Documentary identity evidence for ${actor?.id}.` : "Share what you documented."}</h1>
      <p className="lede">{isIdentityAssertion
        ? "Propose a name privately only when it is supported by a readable badge or nameplate, official record, court document, reliable reporting, or a genuinely independent recording. The name will not be published automatically."
        : "This public demo prepares a submission manifest. Production uploads are completed directly to quarantined, access-controlled storage using short-lived resumable URLs."}</p>
      {isIdentityAssertion ? <div className="case-header-meta"><span className="meta-chip">SUBJECT: {actor?.id}</span><span className="meta-chip">DESTINATION: SUGGESTED_PRIVATE</span><span className="meta-chip">NO PUBLIC NAME CREATED</span></div> : null}
    </header>
    <div className="shell form-shell">
      <div className="notice"><strong>Before you submit:</strong> {isIdentityAssertion
        ? "A resemblance, face match, clothing similarity, social-media comment, or crowd guess is not identity evidence. Deliberately false accusations may endanger people and compromise an investigation."
        : "Keep the original file unchanged. Do not rename, trim, transcode, screenshot, or remove metadata. Do not upload media you do not have the right to provide."}</div>
      <form className="form-card" action="/api/submission-demo" method="post">
        <input type="hidden" name="submission_mode" value={isIdentityAssertion ? "identity_assertion" : "evidence"} />
        {isIdentityAssertion ? <input type="hidden" name="subject_id" value={actor?.id} /> : null}
        <div className="field-grid">
          <div className="field"><label htmlFor="alias">Protected alias</label><input id="alias" name="alias" placeholder="Optional pseudonym" autoComplete="off" /><span className="hint">Leave blank for a one-time anonymous receipt.</span></div>
          <div className="field"><label htmlFor="kind">Evidence type</label><select id="kind" name="kind" defaultValue="link"><option value="link">Public link</option><option value="original">Original file manifest</option></select></div>
        </div>

        {isIdentityAssertion ? <>
          <div className="field"><label htmlFor="proposed-name">Proposed name for private verification</label><input id="proposed-name" name="proposed_name" autoComplete="off" required maxLength={200} /><span className="hint">This value is sensitive and must remain private until every publication gate is satisfied.</span></div>
          <div className="field"><label htmlFor="identity-basis">Documentary basis</label><select id="identity-basis" name="identity_basis" required defaultValue=""><option value="" disabled>Select the strongest basis</option><option value="badge_nameplate">Readable badge or nameplate</option><option value="official_record">Official deployment or employment record</option><option value="court_record">Court filing or verified legal record</option><option value="independent_recording">Independent original recording</option><option value="reliable_reporting">Reliable independent reporting</option></select></div>
        </> : null}

        <div className="field"><label htmlFor="source-url">{isIdentityAssertion ? "Supporting source URL" : "Public source URL"}</label><input id="source-url" name="source_url" type="url" placeholder="https://…" /></div>
        <div className="field"><label htmlFor="context">{isIdentityAssertion ? "Explain exactly how the document supports the proposed name" : "What does this show?"}</label><textarea id="context" name="context" required={isIdentityAssertion} minLength={isIdentityAssertion ? 40 : undefined} placeholder={isIdentityAssertion ? "Quote or describe the badge, roster entry, filing, byline, timestamp, or other documentary connection. Explain how this source is independent." : "Describe when, where, and how the recording was made. Separate what you saw from what someone told you."} /></div>
        <div className="field"><label htmlFor="contact">Safe follow-up channel</label><input id="contact" name="contact" placeholder="Optional email or secure handle" autoComplete="off" /><span className="hint">In production this field is encrypted separately and never included in a public record.</span></div>

        {isIdentityAssertion ? <>
          <label className="check-row"><input type="checkbox" name="independence_confirmed" required /><span>I can explain this source&apos;s provenance and why it is independent of the existing Samdish footage.</span></label>
          <label className="check-row"><input type="checkbox" name="not_resemblance_only" required /><span>This proposed name is not based only on a face, biometric comparison, resemblance, clothing, or a crowd suggestion.</span></label>
        </> : null}
        <label className="check-row"><input type="checkbox" name="rights_confirmed" required /><span>I created this evidence or have permission to provide it for preservation and review.</span></label>
        <label className="check-row"><input type="checkbox" name="safety_confirmed" required /><span>I understand that approved public evidence will use a reviewed, redacted derivative rather than the protected original.</span></label>
        <button className="button button-primary" type="submit">{isIdentityAssertion ? "Create private identity-evidence receipt" : "Create protected receipt"}</button>
        {isIdentityAssertion ? <p className="hint identity-demo-note">Public demo behavior: the response confirms validation and returns a non-sensitive receipt, but does not persist the proposed name. The protected API and encrypted source-contact store are required before operational intake.</p> : null}
      </form>
      {isIdentityAssertion ? <p><Link className="back-link" href={`/events/jantar-mantar-july-20/documented-actors/${actor?.id.toLowerCase()}`}>← Return to {actor?.id}</Link></p> : null}
    </div>
  </main></>;
}
