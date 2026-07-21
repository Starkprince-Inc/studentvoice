import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../../components/SiteHeader";
import { documentedActors, getDocumentedActor } from "../../../../data";

const sourceUrl = "https://www.youtube.com/watch?v=6MTXCAaOy3o";

export function generateStaticParams() {
  return documentedActors.map((actor) => ({ actorId: actor.id.toLowerCase() }));
}

export const metadata = {
  title: "Anonymous actor evidence record",
  description: "A timestamped, non-biometric conduct review record from the Jantar Mantar case file.",
};

export default async function DocumentedActorPage({ params }: { params: Promise<{ actorId: string }> }) {
  const { actorId } = await params;
  const actor = getDocumentedActor(actorId);
  if (!actor) notFound();

  const embedUrl = `https://www.youtube-nocookie.com/embed/6MTXCAaOy3o?start=${actor.startSeconds}`;
  const publicSourceUrl = `${sourceUrl}&t=${actor.startSeconds}s`;

  return (
    <>
      <SiteHeader />
      <main>
        <header className="page-hero shell actor-profile-hero">
          <Link className="back-link" href="/events/jantar-mantar-july-20/documented-actors">← All documented actors</Link>
          <p className="eyebrow"><span className="live-dot" /> ANONYMOUS EVIDENCE RECORD · {actor.id}</p>
          <h1>{actor.observedRole}</h1>
          <p className="lede">This page documents a source window and conduct allegation. It does not establish the person’s identity, employment, guilt, or connection to any other recording.</p>
          <div className="case-header-meta">
            <span className={`meta-chip status-${actor.reviewStatus}`}>{actor.reviewStatus.replace("_", " ")}</span>
            <span className="meta-chip">IDENTITY: {actor.identityState.replace("_", " ")}</span>
            <span className="meta-chip">{actor.reviewApprovals} / 2 REVIEWERS</span>
          </div>
        </header>

        <div className="shell actor-profile-layout">
          <section className="actor-profile-media" aria-labelledby="source-window-title">
            <div className="profile-frame-status">
              <div className={`actor-visual ${actor.privateReviewFrame ? "actor-visual-ready" : ""}`} aria-label={actor.privateReviewFrame ? "Private anonymous subject box prepared; public image withheld" : "Public face crop withheld pending rights review"}>
                <span className="actor-code">{actor.id.replace("SV-SAM-", "")}</span>
                <span className="frame-withheld">{actor.privateReviewFrame ? <>PRIVATE REVIEW FRAME READY<br />PUBLIC IMAGE WITHHELD</> : <>PUBLIC FACE CROP WITHHELD<br />AUTHORIZED ORIGINAL REQUIRED</>}</span>
              </div>
              <div>
                <p className="eyebrow">Anonymous subject-box status</p>
                <h2>{actor.privateReviewFrame ? "Private review frame created" : "Not yet created"}</h2>
                {actor.privateReviewFrame ? (
                  <>
                    <p><strong>Reviewed timestamp:</strong> {actor.privateReviewFrame.timestamp}<br /><strong>Box coordinates:</strong> {actor.privateReviewFrame.subjectBox.join(", ")} on the 1024 × 576 working frame.</p>
                    <p>{actor.privateReviewFrame.note}</p>
                    <p className="hash-receipt"><strong>Derivative SHA-256:</strong> <code>{actor.privateReviewFrame.derivativeSha256}</code></p>
                  </>
                ) : <p>A private reviewer may draw a subject box only on an authorized working copy. It is an anonymous within-video aid for redaction and review—not facial recognition or identity evidence.</p>}
              </div>
            </div>

            <div className="profile-source-window">
              <div>
                <p className="eyebrow">Linked source window</p>
                <h2 id="source-window-title">{actor.timestampStart}–{actor.timestampEnd}</h2>
                <p>The privacy-enhanced player starts at the cited window. Review the surrounding footage before drawing any conclusion.</p>
              </div>
              <div className="video-frame">
                <iframe
                  src={embedUrl}
                  title={`Source footage for anonymous record ${actor.id}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <a className="button button-outline" href={publicSourceUrl} target="_blank" rel="noreferrer">Open original at {actor.timestampStart} ↗</a>
            </div>
          </section>

          <aside className="actor-profile-rail" aria-label="Record status">
            <div className="profile-rail-card profile-rail-dark">
              <span className="source-type">CONDUCT UNDER REVIEW</span>
              <h2>{actor.action}</h2>
              <p><strong>Evidentiary limit:</strong> {actor.limits}</p>
            </div>
            <div className="profile-rail-card">
              <span className="source-type">PUBLICATION GATES</span>
              <ol className="gate-list">
                <li><span className="gate-state gate-pending">Pending</span> Rights-cleared original or creator authorization</li>
                <li><span className={`gate-state ${actor.privateReviewFrame ? "gate-prepared" : "gate-pending"}`}>{actor.privateReviewFrame ? "Prepared" : "Pending"}</span> Frame-level reviewer observation</li>
                <li><span className="gate-state gate-pending">0 / 2</span> Independent reviewer approvals</li>
                <li><span className="gate-state gate-pending">Pending</span> Editor and legal review</li>
              </ol>
            </div>
            <div className="profile-rail-card">
              <span className="source-type">IDENTITY EVIDENCE</span>
              <h3>No public name</h3>
              <p>A private identity suggestion may cite a readable badge or nameplate, official deployment record, court filing, or reliable independent reporting. A face match, resemblance, clothing, or crowd guess is rejected.</p>
            </div>
          </aside>

          <section className="profile-accountability" aria-labelledby="accountability-title">
            <div>
              <p className="eyebrow">Accountability and correction</p>
              <h2 id="accountability-title">Evidence can be challenged, corrected, or strengthened.</h2>
            </div>
            <div className="method-grid">
              <article className="method-card"><h3>Submit documentary evidence</h3><p>Provide an original recording, creator authorization, readable badge/nameplate, deployment record, court document, or another independent source. Do not submit identity guesses based on appearance.</p><Link className="source-card-link" href="/submit">Start a protected submission →</Link></article>
              <article className="method-card"><h3>Right of reply</h3><p>A person or authorized representative may contest the description, provide context, request correction, or ask that a verified response appear with the record.</p><Link className="source-card-link" href="/submit">Send a response or correction →</Link></article>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
