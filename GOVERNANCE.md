# Governance

StudentVoice uses maintainer review with explicit policy ownership.

- **Code maintainers** approve implementation and releases.
- **Evidence-policy maintainers** approve schema and workflow changes affecting claims, identity, redaction, retention, or source safety.
- **Security maintainers** handle vulnerabilities and incident response.
- **Editorial/legal advisors** must review changes that alter publication or identity gates.

No single maintainer may weaken the two-reviewer, editor, legal, rights, redaction, audit, or non-biometric safeguards. Such changes require two maintainers, one evidence-policy maintainer, a public ADR, and a security review. Releases use immutable tags, generated SBOMs, signed artifacts, and a visible changelog.
