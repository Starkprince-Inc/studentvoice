UPDATE review_artifacts
SET status = 'mapped', mapped_subject_id = 'SV-SAM-U01', relation = 'before_context', observation = 'Multiple uniformed personnel and protesters occupy the same narrow dispersal corridor immediately before the selected frame.', updated_by = 'system.reviewed-seed', updated_at = CURRENT_TIMESTAMP
WHERE id = 'SV-SAM-P0038' AND status = 'unreviewed' AND mapped_subject_id IS NULL;

UPDATE review_artifacts
SET status = 'mapped', mapped_subject_id = 'SV-SAM-U01', relation = 'candidate_action', observation = 'A uniformed subject appears with a baton raised during the crowd movement.', updated_by = 'system.reviewed-seed', updated_at = CURRENT_TIMESTAMP
WHERE id = 'SV-SAM-P0039' AND status = 'unreviewed' AND mapped_subject_id IS NULL;

UPDATE review_artifacts
SET status = 'mapped', mapped_subject_id = 'SV-SAM-U01', relation = 'after_context', observation = 'Baton-bearing personnel continue moving through the same corridor half a second later.', updated_by = 'system.reviewed-seed', updated_at = CURRENT_TIMESTAMP
WHERE id = 'SV-SAM-P0040' AND status = 'unreviewed' AND mapped_subject_id IS NULL;

UPDATE review_artifacts
SET status = 'mapped', mapped_subject_id = 'SV-SAM-U04', relation = 'candidate_action', observation = 'A green-helmeted uniformed subject appears to hold a baton above shoulder height.', updated_by = 'system.reviewed-seed', updated_at = CURRENT_TIMESTAMP
WHERE id = 'SV-SAM-P0041' AND status = 'unreviewed' AND mapped_subject_id IS NULL;

UPDATE review_artifacts
SET status = 'mapped', mapped_subject_id = 'SV-SAM-U04', relation = 'after_context', observation = 'The green-helmeted subject remains visible in the adjacent dispersal scene.', updated_by = 'system.reviewed-seed', updated_at = CURRENT_TIMESTAMP
WHERE id = 'SV-SAM-P0042' AND status = 'unreviewed' AND mapped_subject_id IS NULL;

INSERT INTO review_audit (id, actor, action, target_id, payload)
SELECT 'seed-profile-links-2026-07-22', 'system.reviewed-seed', 'profile.links.seeded', 'SV-SAM-U01,SV-SAM-U04', '{"basis":"manual adjacent-frame review","biometric":false}'
WHERE EXISTS (SELECT 1 FROM review_artifacts WHERE mapped_subject_id IN ('SV-SAM-U01', 'SV-SAM-U04'))
  AND NOT EXISTS (SELECT 1 FROM review_audit WHERE id = 'seed-profile-links-2026-07-22');
