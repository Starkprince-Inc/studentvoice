import Link from "next/link";
import { EvidenceMark } from "../../components/EvidenceMark";
import { SiteHeader } from "../../components/SiteHeader";
import { event, getSource, sources } from "../../data";

export const metadata = {
  title: "Jantar Mantar evidence timeline",
  description: "Reviewed sources, claims, counterclaims, and a timestamped chronology of the July 20, 2026 protest.",
};

export default function EventPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <header className="page-hero shell">
          <p className="eyebrow"><span className="live-dot" /> CASE SV–DEL–0720 · ACTIVE REVIEW</p>
          <h1>{event.title}</h1>
          <p className="lede">A versioned public record built from primary footage, independent reporting, an official police statement, and civil-rights documentation. Claims remain attributed and correctable.</p>
          <div className="case-header-meta"><span className="meta-chip">{event.date}</span><span className="meta-chip">{event.location}</span><span className="meta-chip">Last reviewed {event.lastReviewed}</span></div>
        </header>

        <div className="shell case-layout">
          <nav className="case-index" aria-label="Case file sections">
            <a href="#timeline">Timeline</a><a href="#actors">Documented actors</a><a href="#claims">Claims</a><a href="#sources">Source register</a><a href="#identity">Identity policy</a><a href="#corrections">Corrections</a>
          </nav>
          <div>
            <section className="case-section" id="timeline">
              <p className="eyebrow">Reconstructed chronology</p><h2>What happened, in sequence</h2>
              <div className="notice"><strong>Reading note:</strong> Times are approximate reporting anchors, not a single synchronized evidentiary clock. Each entry keeps its own citations.</div>
              <div className="timeline">
                {event.timeline.map((item) => (
                  <article className="timeline-item" key={`${item.time}-${item.title}`}>
                    <time className="timeline-time">{item.time} IST</time><span className="timeline-node" aria-hidden="true" />
                    <div className="timeline-content"><h3>{item.title}</h3><p>{item.body}</p>{item.citations.map((id) => { const source = getSource(id); return source ? <a className="citation-link" href={source.url} target="_blank" rel="noreferrer" key={id}>Source: {source.publisher} ↗</a> : null; })}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="case-section" id="actors">
              <p className="eyebrow">Actor and conduct review</p><h2>Anonymous profiles from the Samdish report</h2>
              <div className="notice">Five timestamped review records now document uniformed personnel, riot-control activity, and an allegation involving people in civilian clothing. No face matching or identity inference is used.</div>
              <Link className="button button-primary" href="/events/jantar-mantar-july-20/documented-actors">Open documented actors →</Link>
            </section>

            <section className="case-section" id="claims">
              <p className="eyebrow">Claim ledger</p><h2>Supported, contested, and still unresolved</h2>
              <div className="claim-list">
                {event.claims.map((claim) => (
                  <article className="claim-row" key={claim.id}>
                    <EvidenceMark status={claim.status} />
                    <div><h3>{claim.title}</h3><p>{claim.summary}</p><p>{claim.citations.map((id) => getSource(id)?.publisher).filter(Boolean).join(" · ") || "No reviewed citation yet"}</p></div>
                    <span className={`status-label status-${claim.status}`}>{claim.status.replace("_", " ")}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="case-section" id="sources">
              <p className="eyebrow">Source register</p><h2>Every source keeps its role and limitations</h2>
              <div className="evidence-grid">
                {sources.map((source) => (
                  <article className="evidence-card" key={source.id}>
                    <div className="evidence-card-head"><span className="source-type">{source.type}</span><span className="meta-chip">LINK ONLY</span></div>
                    <h3>{source.title}</h3><p><strong>{source.publisher}</strong></p><p>{source.note}</p><a className="source-card-link" href={source.url} target="_blank" rel="noreferrer">Open original source ↗</a>
                  </article>
                ))}
              </div>
            </section>

            <section className="case-section" id="identity">
              <p className="eyebrow">Identity safeguard</p><h2>No name from a face</h2>
              <div className="notice">StudentVoice does not use facial recognition or public identity guessing. A name requires an official record or readable badge/nameplate, a second independent source, two reviewer approvals, and editor/legal sign-off. No person is currently named in this pilot case file.</div>
            </section>

            <section className="case-section" id="corrections">
              <p className="eyebrow">Version history</p><h2>Corrections remain visible</h2>
              <div className="evidence-card"><span className="source-type">VERSION 0.1</span><h3>Seed record created</h3><p>Initial balanced source register and claim ledger prepared from seven cited sources. This is a demonstration dataset and not a completed investigation.</p><Link className="source-card-link" href="/methodology">Read the publication standard →</Link></div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
