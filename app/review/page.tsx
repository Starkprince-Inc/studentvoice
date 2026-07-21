import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { requireChatGPTUser } from "../chatgpt-auth";
import { reviewerAllowed } from "./store";
import { ReviewControl } from "./ReviewControl";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Evidence control",
  description: "Protected frame review, anonymous subject mapping, dismissal, and private documentary identity suggestions.",
};

export default async function ReviewPage() {
  const user = await requireChatGPTUser("/review");
  if (!reviewerAllowed(user.email)) {
    return <><SiteHeader /><main><header className="page-hero shell"><p className="eyebrow">Protected reviewer workspace</p><h1>Reviewer access required.</h1><p className="lede">You are signed in, but this account is not on the StudentVoice reviewer allowlist.</p><div className="case-header-meta"><span className="meta-chip">SIGNED IN: {user.email}</span><span className="meta-chip">ACCESS: DENIED</span></div></header><div className="shell form-shell"><div className="notice">Frame derivatives contain identifiable people and are restricted to authorized editorial reviewers. Independent contributors can still submit documentary evidence from each anonymous profile.</div><Link className="button button-primary" href="/events/jantar-mantar-july-20/documented-actors">Open public actor register</Link></div></main></>;
  }
  return <><SiteHeader /><main className="review-workspace"><header className="page-hero shell review-hero"><p className="eyebrow"><span className="live-dot" /> Protected reviewer workspace</p><h1>Evidence control.</h1><p className="lede">Start with an anonymous person profile and review every adjacent frame linked to that subject. Non-person and non-action frames remain preserved as scene context instead of appearing in an identity inbox.</p><div className="case-header-meta"><span className="meta-chip">SIGNED IN: {user.email}</span><span className="meta-chip">FRAME ACCESS: PRIVATE</span><span className="meta-chip">NO BIOMETRIC MATCHING</span></div></header><ReviewControl /></main></>;
}
