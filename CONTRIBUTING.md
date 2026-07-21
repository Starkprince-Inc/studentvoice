# Contributing

1. Read the safety boundary in the README and `docs/adr/0001-no-biometric-identification.md`.
2. Open an issue for material schema, editorial, retention, moderation, or security changes.
3. Never use real witness data, evidence, credentials, reviewer notes, or production exports in tests or examples.
4. Add tests for behavior changes and run web, API, and worker checks.
5. Sign every commit with the Developer Certificate of Origin: `git commit -s`.

Pull requests adding biometric identification, public identity guessing, hidden publication paths, unreviewed machine claims, destructive evidence mutation, or third-party video downloading will be rejected.

Keep changes reviewable. Document externally visible data-model and policy decisions in an ADR. Security findings should follow `SECURITY.md`, not a public issue.
