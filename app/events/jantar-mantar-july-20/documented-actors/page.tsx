import Link from "next/link";
import { SiteHeader } from "../../../components/SiteHeader";
import { documentedActors, event } from "../../../data";

export const metadata = {
  title: "Documented actors · Jantar Mantar case file",
  description: "Anonymous, timestamped actor records from the Samdish source, with review status and strict identity safeguards.",
};

const sourceUrl = "https://www.youtube.com/watch?v=6MTXCAaOy3o";

export default function DocumentedActorsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <header className="page-hero shell actor-page-hero">
          <p className="eyebrow"><span className="live-dot" /> CASE SV–DEL–0720 · EVIDENCE REVIEW</p>
          <h1>Documented actors<br /><em>without identity guessing.</em></h1>
          <p className="lede">
            Anonymous, within-source records for people or groups visible or described in the Samdish report. These are review leads—not findings of guilt, employment, or identity.
          </p>
          <div className="case-header-meta">
            <span className="meta-chip">{documentedActors.length} REVIEW RECORDS</span>
            <span className="meta-chip">0 PUBLIC NAMES</span>
            <span className="meta-chip">0 / 2 REVIEW APPROVALS</span>
          </div>
        </header>

        <div className="shell actor-layout">
          <section className="actor-source" aria-labelledby="source-video-title">
            <div>
              <p className="eyebrow">Primary linked source</p>
              <h2 id="source-video-title">Review the published footage in context</h2>
              <p>Timestamp links below open the original upload. StudentVoice has not downloaded or frame-processed this third-party video. Still images remain withheld until the creator supplies authorization or a rights-cleared original.</p>
            </div>
            <div className="video-frame">
              <iframe
                src="https://www.youtube-nocookie.com/embed/6MTXCAaOy3o"
                title="Unfiltered by Samdish report from the Jantar Mantar protest"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </section>

          <section className="actor-register" aria-labelledby="actor-register-title">
            <div className="actor-register-heading">
              <div><p className="eyebrow">Anonymous subject register</p><h2 id="actor-register-title">Observed actions and evidentiary limits</h2></div>
              <div className="notice"><strong>Identity rule:</strong> a face, resemblance, clothing, or crowd suggestion is never enough. A public name requires documentary evidence, a second independent source, two reviewers, and editor/legal approval.</div>
            </div>

            <div className="actor-grid">
              {documentedActors.map((actor) => (
                <article className="actor-card" id={actor.id} key={actor.id}>
                  <div className="actor-visual" aria-label="No public frame is available">
                    <span className="actor-code">{actor.id.replace("SV-SAM-", "")}</span>
                    <span className="frame-withheld">FRAME WITHHELD<br />RIGHTS REVIEW</span>
                  </div>
                  <div className="actor-card-body">
                    <div className="actor-card-topline">
                      <span className="source-type">{actor.id}</span>
                      <span className={`status-label status-${actor.reviewStatus}`}>{actor.reviewStatus.replace("_", " ")}</span>
                    </div>
                    <h3>{actor.observedRole}</h3>
                    <p className="actor-action">{actor.action}</p>
                    <p className="actor-limit"><strong>Limit:</strong> {actor.limits}</p>
                    <dl className="actor-facts">
                      <div><dt>Source window</dt><dd>{actor.timestampStart}–{actor.timestampEnd}</dd></div>
                      <div><dt>Identity</dt><dd>{actor.identityState.replace("_", " ")}</dd></div>
                      <div><dt>Reviewers</dt><dd>{actor.reviewApprovals} of 2 approved</dd></div>
                    </dl>
                    <div className="actor-card-actions">
                      <Link className="button button-primary" href={`/events/jantar-mantar-july-20/documented-actors/${actor.id.toLowerCase()}`}>Open evidence record →</Link>
                      <a className="button button-outline" href={`${sourceUrl}&t=${actor.startSeconds}s`} target="_blank" rel="noreferrer">Review at {actor.timestampStart} ↗</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="case-section actor-next-step">
            <p className="eyebrow">Evidence needed</p>
            <h2>Help move a record beyond “under review”</h2>
            <p>Submit an original file, creator authorization, a readable badge/nameplate frame, deployment roster, court record, or another independently sourced recording. Do not submit guesses based on appearance.</p>
            <div className="hero-actions"><Link className="button button-primary" href="/submit">Submit protected evidence</Link><Link className="button button-quiet" href={`/events/${event.slug}`}>Return to case file</Link></div>
          </section>
        </div>
      </main>
    </>
  );
}
