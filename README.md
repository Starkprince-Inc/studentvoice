# StudentVoice

StudentVoice is open-source civic evidence infrastructure for protected intake, chain-of-custody preservation, bilingual investigation, human-reviewed claims, corrections, and responsible public-interest publishing.

The first synthetic/seed case reconstructs the July 20, 2026 Jantar Mantar “Chalo Sansad” protest from a balanced source register. It is a demonstration record, not a completed investigation or a list of accused people.

## Non-negotiable safety boundary

StudentVoice does **not** implement face recognition, face embeddings, gait recognition, cross-video biometric re-identification, crowd-sourced public naming, personal risk scores, addresses, or family profiles. Automated media analysis creates private reviewer proposals only. A public identity requires an official record or readable badge/nameplate, a second independent source, two reviewer approvals, editor approval, and recorded legal review.

## Repository map

- `app/` — bilingual public evidence site, case timeline, methodology, and submission manifest.
- `services/api/` — FastAPI evidence domain, intake receipts, audit chain, review gates, corrections, and public JSON-LD export.
- `services/worker/` — deterministic hashing, proxy/keyframe generation, redaction proposals, and a hard prohibition on biometric capabilities.
- `infra/terraform/` — Central India production foundation with India-region DR, immutable storage, managed identities, PostgreSQL, Service Bus, and Container Apps.
- `docs/` — architecture, editorial rules, privacy, evidence exports, threat model, and operational guidance.

## Local development

### Web

Requirements: Node.js 22.13 or later.

```powershell
npm install
npm run dev
```

Open the local URL printed by the development server. The public pages use a reviewed synthetic seed dataset and do not need the API to render.

### API

Requirements: Python 3.11 or later.

```powershell
cd services/api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

OpenAPI is available at `/docs`. Local editorial calls require `X-Demo-Actor` and `X-Demo-Role`; production rejects demo headers and consumes Azure App Service/Container Apps authentication principals.

### Worker

```powershell
cd services/worker
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
studentvoice-worker integrity C:\path\to\rights-cleared-original.mp4
```

The worker accepts local original files only. It does not download YouTube or other third-party media. `prepare` requires `ffmpeg` and `ffprobe`.

## Verification

```powershell
npm test
cd services/api; pytest
cd ..\worker; pytest
```

The tests prove the public case renders uncertainty, intake is idempotent, hashes detect byte changes, audit links remain intact, claims cannot publish without two reviewers plus an editor, and identity publication cannot use a biometric basis.

## Production posture

The Terraform code is a reviewable foundation, not a one-command substitute for organizational setup. Before launch, configure a remote protected state backend, workload-identity federation, approved DNS and Front Door/WAF, Entra groups, alert routing, GPU quota if needed, legal retention policy, incident response, and Indian media/privacy counsel review.

## License and contributions

Code is licensed under GNU AGPL-3.0-only. Evidence, source identities, internal notes, and production datasets are not licensed with the code and must never be committed. Contributions require Developer Certificate of Origin sign-off (`git commit -s`). See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [GOVERNANCE.md](GOVERNANCE.md).
