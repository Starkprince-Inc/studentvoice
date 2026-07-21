# Threat model

Protected assets are originals, source identities, reviewer notes, signing keys, approval state, and audit history. Primary adversaries include malicious uploaders, coordinated brigades, insiders, account thieves, scrapers, and parties seeking witness identification.

| Threat | Principal controls |
|---|---|
| False accusation or crowd naming | No public naming submissions; corroboration and legal gates |
| Witness or minor exposure | Default redaction, frame-by-frame approval, separated contact data |
| Malicious/polyglot upload | Quarantine, malware scan, size/type validation, isolated workers |
| Poisoned metadata/model output | Preserve originals, proposals-only ML, human confirmation |
| Replay or duplicate jobs | Deterministic IDs, idempotent workers, duplicate detection, DLQ |
| Insider leakage | Least privilege, separate storage permissions, audited access/export |
| Stolen reviewer account | MFA, reauthentication, two-person approval, short sessions |
| Audit tampering | Hash-linked append-only events and daily WORM seals |
| Doxxing/scraping | No sensitive public fields, rate limiting, WAF, takedown process |

This model must be revisited before each expansion, especially mobile capture, federation, or public accounts.
