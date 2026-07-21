# Azure India deployment

This Terraform foundation keeps the primary database, storage, queues, applications, logs, and keys in Central India, with Azure-native geo-redundant backups paired inside the India geography. It creates private storage and PostgreSQL networking, customer-managed storage encryption, immutable originals/audit containers, Entra-only PostgreSQL authentication, managed workload identity, premium Service Bus queues, Container Apps, monitoring, and an India-only disaster-recovery resource group.

Before production, validate current Azure SKU availability, provider schemas, the Central India/South India pairing, and organizational policy. Enable a GPU VM scale set only after quota is approved in an India region; the default worker uses CPU Container Apps Jobs and scales to zero. Add Azure Front Door Premium and WAF only with a verified private-link origin configuration and an approved public domain—those resources are intentionally not created with placeholder DNS.

Use a remote Azure Storage backend with state locking and restricted access. Supply immutable image digests, not mutable tags. GitHub Actions should authenticate through Azure workload identity federation; no client secret belongs in repository settings.
