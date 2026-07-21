import Link from "next/link";
import { GitHubRepoBadge } from "./GitHubRepoBadge";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="StudentVoice home"><span className="brand-mark" aria-hidden="true" />STUDENTVOICE</Link>
        <nav className="main-nav" aria-label="Primary">
          <Link href="/events/jantar-mantar-july-20">Evidence</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/methodology#safety">Source safety</Link>
        </nav>
        <div className="header-actions"><span className="language-toggle" aria-label="Languages supported">EN · हिन्दी</span><GitHubRepoBadge /><Link className="submit-mini" href="/submit">Submit evidence</Link></div>
      </div>
    </header>
  );
}
