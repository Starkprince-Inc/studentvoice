import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { getDocumentedActor, documentedActors } from "../../../data";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { reviewerAllowed } from "../../store";
import { ProfileReviewDetail } from "./ProfileReviewDetail";

export const dynamic = "force-dynamic";

export default async function ReviewProfilePage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const actor = getDocumentedActor(subjectId);
  if (!actor?.identityEvidenceOpen || !actor.evidenceFrames?.length) notFound();
  const user = await requireChatGPTUser(`/review/profiles/${actor.id}`);
  if (!reviewerAllowed(user.email)) {
    return <><SiteHeader /><main><header className="page-hero shell"><p className="eyebrow">Protected reviewer workspace</p><h1>Reviewer access required.</h1><p className="lede">This anonymous person profile contains private frame derivatives.</p></header><div className="shell form-shell"><Link className="button button-primary" href="/events/jantar-mantar-july-20/documented-actors">Open public actor register</Link></div></main></>;
  }
  const profileActors = documentedActors.filter((candidate) => candidate.identityEvidenceOpen && candidate.evidenceFrames?.length);
  const profileNumber = profileActors.findIndex((candidate) => candidate.id === actor.id) + 1;
  return <><SiteHeader /><main className="review-workspace"><header className="page-hero shell review-profile-hero"><Link className="back-link" href="/review">Back to Evidence Control</Link><p className="eyebrow"><span className="live-dot" /> Anonymous person profile #{String(profileNumber).padStart(2, "0")}</p><h1>{actor.id}</h1><p className="lede">A within-video editorial record linking reviewed frames to one anonymous subject. It is not a biometric or real-world identification.</p><div className="case-header-meta"><span className="meta-chip">IDENTITY: NOT VERIFIED</span><span className="meta-chip">EVIDENCE: PRIVATE</span><span className="meta-chip">CONTINUITY: MANUAL REVIEW</span></div></header><ProfileReviewDetail actor={actor} profileNumber={profileNumber} /></main></>;
}
