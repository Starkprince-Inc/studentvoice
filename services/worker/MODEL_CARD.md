# StudentVoice media-analysis model card

This worker creates **private review proposals**, never public findings.

Allowed capabilities include scene detection, keyframes, Hindi/English speech recognition, non-identifying speaker segmentation, OCR, redaction-mask proposals, object proposals, and duplicate detection. Model name, version, confidence, timestamps, and coordinates must accompany every proposal.

The project prohibits face recognition, face embeddings, gait recognition, cross-video person re-identification, biometric search, personal risk scoring, and automatic publication. Face detection may be installed only for proposing privacy masks. Humans must inspect the complete public derivative before release.

The default package intentionally ships without large inference models. The `analysis` extra supplies adapters, but deployments must pin model artifacts, document datasets and licenses, and evaluate Hindi/English accuracy and redaction performance on a rights-cleared validation corpus before enabling them.
