import type { ClaimStatus } from "../data";

const marks: Record<ClaimStatus, string> = {
  corroborated: "✓", contested: "↔", under_review: "…", unreviewed: "?", refuted: "×", retracted: "↩",
};

export function EvidenceMark({ status }: { status: ClaimStatus }) {
  return <span className={`evidence-mark mark-${status}`} aria-hidden="true">{marks[status]}</span>;
}
