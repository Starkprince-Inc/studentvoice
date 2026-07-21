# ADR 0001: No biometric identification

Status: accepted.

StudentVoice will not generate face embeddings, recognize faces or gait, search people across recordings, infer identity from resemblance, or produce individual risk scores. Face detection is allowed solely to propose privacy-redaction masks with anonymous within-file track IDs.

This boundary reduces irreversible harm from false matches, doxxing, and function creep. Identity publication is a documentary editorial process: readable badge/nameplate evidence or an official record, a second independent source, two reviewers, editor approval, and legal review. The API policy and worker capability allowlist enforce this decision.
