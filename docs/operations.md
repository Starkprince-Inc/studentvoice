# Operations

Use workload-identity federation for GitHub Actions and managed identities between Azure services. Store no Azure credential in GitHub. Production Terraform state belongs in a protected Azure Storage backend with locking and restricted break-glass access.

Service Bus consumers use peek-lock, deterministic message IDs, duplicate detection, explicit completion, bounded retries, and dead-letter review. Run fixity verification on a schedule and seal the audit-chain head daily to WORM storage.

Target database RPO is 15 minutes and RTO is four hours. Test restore and India-region disaster recovery quarterly. Alert on failed malware scans, DLQ growth, audit-chain breaks, unusual original access, failed redaction review, key-vault denial spikes, and backup/fixity failures.

Front Door/WAF and DNS are intentionally organization-specific deployment steps. Configure them before public launch, together with rate limits, origin locking, TLS, cache rules for immutable public snapshots, and upload bypass rules limited to signed endpoints.
