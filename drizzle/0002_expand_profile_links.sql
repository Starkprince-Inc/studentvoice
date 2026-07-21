UPDATE review_artifacts
SET status = 'mapped',
    mapped_subject_id = CASE id
      WHEN 'SV-SAM-P0018' THEN 'SV-SAM-U05' WHEN 'SV-SAM-P0019' THEN 'SV-SAM-U05' WHEN 'SV-SAM-P0020' THEN 'SV-SAM-U05'
      WHEN 'SV-SAM-P0034' THEN 'SV-SAM-U06' WHEN 'SV-SAM-P0035' THEN 'SV-SAM-U06' WHEN 'SV-SAM-P0036' THEN 'SV-SAM-U06'
      WHEN 'SV-SAM-P0082' THEN 'SV-SAM-U07' WHEN 'SV-SAM-P0083' THEN 'SV-SAM-U07' WHEN 'SV-SAM-P0084' THEN 'SV-SAM-U07'
      WHEN 'SV-SAM-P0088' THEN 'SV-SAM-U08' WHEN 'SV-SAM-P0089' THEN 'SV-SAM-U08' WHEN 'SV-SAM-P0090' THEN 'SV-SAM-U08' WHEN 'SV-SAM-P0091' THEN 'SV-SAM-U08' WHEN 'SV-SAM-P0092' THEN 'SV-SAM-U08'
      WHEN 'SV-SAM-P0139' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0140' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0141' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0142' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0143' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0144' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0145' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0146' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0147' THEN 'SV-SAM-U09' WHEN 'SV-SAM-P0148' THEN 'SV-SAM-U09'
    END,
    relation = CASE id
      WHEN 'SV-SAM-P0018' THEN 'candidate_action' WHEN 'SV-SAM-P0019' THEN 'after_context' WHEN 'SV-SAM-P0020' THEN 'after_context'
      WHEN 'SV-SAM-P0034' THEN 'before_context' WHEN 'SV-SAM-P0035' THEN 'candidate_action' WHEN 'SV-SAM-P0036' THEN 'after_context'
      WHEN 'SV-SAM-P0082' THEN 'candidate_action' WHEN 'SV-SAM-P0083' THEN 'after_context' WHEN 'SV-SAM-P0084' THEN 'after_context'
      WHEN 'SV-SAM-P0088' THEN 'before_context' WHEN 'SV-SAM-P0089' THEN 'before_context' WHEN 'SV-SAM-P0090' THEN 'candidate_action' WHEN 'SV-SAM-P0091' THEN 'after_context' WHEN 'SV-SAM-P0092' THEN 'after_context'
      WHEN 'SV-SAM-P0139' THEN 'before_context' WHEN 'SV-SAM-P0140' THEN 'candidate_action' WHEN 'SV-SAM-P0141' THEN 'after_context' WHEN 'SV-SAM-P0142' THEN 'after_context' WHEN 'SV-SAM-P0143' THEN 'after_context' WHEN 'SV-SAM-P0144' THEN 'after_context' WHEN 'SV-SAM-P0145' THEN 'after_context' WHEN 'SV-SAM-P0146' THEN 'after_context' WHEN 'SV-SAM-P0147' THEN 'after_context' WHEN 'SV-SAM-P0148' THEN 'after_context'
    END,
    observation = CASE id
      WHEN 'SV-SAM-P0018' THEN 'At the upper-right edge, a khaki-uniformed subject appears with both arms raised around a baton-like object.'
      WHEN 'SV-SAM-P0019' THEN 'The same scene position remains visible half a second later as the crowd moves in front of the camera.'
      WHEN 'SV-SAM-P0020' THEN 'A second derivative at the same source time preserves the surrounding crowd and police-line context.'
      WHEN 'SV-SAM-P0034' THEN 'The khaki-capped subject is visible at the right edge of the compressed corridor before the clearest contact frame.'
      WHEN 'SV-SAM-P0035' THEN 'The subject appears to extend both arms toward a person in the crowd beside the barricade.'
      WHEN 'SV-SAM-P0036' THEN 'The police line and crowd continue moving through the same narrow corridor.'
      WHEN 'SV-SAM-P0082' THEN 'The subject arm appears around or against the upper body of a red-shirted person during crowd movement.'
      WHEN 'SV-SAM-P0083' THEN 'The subject turns within the same immediate station-gate scene as the line reorganizes.'
      WHEN 'SV-SAM-P0084' THEN 'The subject remains in the same local position as the red-shirted person and surrounding personnel move away.'
      WHEN 'SV-SAM-P0088' THEN 'A shield line forms directly in front of the crowd at the station gate.'
      WHEN 'SV-SAM-P0089' THEN 'The helmeted subject remains partly visible behind a transparent shield as the crowd shifts.'
      WHEN 'SV-SAM-P0090' THEN 'A baton-like object appears held above the helmeted subject head behind the shield line.'
      WHEN 'SV-SAM-P0091' THEN 'The shield-line subject remains in approximately the same position as a bystander crosses the view.'
      WHEN 'SV-SAM-P0092' THEN 'A second derivative at the same source time preserves the wider shield-line context.'
      WHEN 'SV-SAM-P0139' THEN 'The camera approaches a riot-control vehicle through a line of personnel.'
      WHEN 'SV-SAM-P0140' THEN 'An operator is visible at mounted equipment on the vehicle roof during the dispersal scene.'
      WHEN 'SV-SAM-P0141' THEN 'The operator remains positioned at the roof equipment as the vehicle stays in view.'
      WHEN 'SV-SAM-P0142' THEN 'The roof position and surrounding security line remain visible in the continuous shot.'
      WHEN 'SV-SAM-P0143' THEN 'The vehicle and roof operator remain framed behind the security personnel.'
      WHEN 'SV-SAM-P0144' THEN 'The same uninterrupted vehicle scene continues as haze becomes visible near the right side.'
      WHEN 'SV-SAM-P0145' THEN 'The operator remains visible above the vehicle while haze crosses the scene.'
      WHEN 'SV-SAM-P0146' THEN 'The vehicle, mounted position, and surrounding personnel remain in the continuous shot.'
      WHEN 'SV-SAM-P0147' THEN 'The camera continues to hold the vehicle and operator as the security line shifts.'
      WHEN 'SV-SAM-P0148' THEN 'The operator remains visible at the end of the reviewed vehicle sequence.'
    END,
    updated_by = 'system.manual-sequence-review',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  'SV-SAM-P0018','SV-SAM-P0019','SV-SAM-P0020','SV-SAM-P0034','SV-SAM-P0035','SV-SAM-P0036',
  'SV-SAM-P0082','SV-SAM-P0083','SV-SAM-P0084','SV-SAM-P0088','SV-SAM-P0089','SV-SAM-P0090','SV-SAM-P0091','SV-SAM-P0092',
  'SV-SAM-P0139','SV-SAM-P0140','SV-SAM-P0141','SV-SAM-P0142','SV-SAM-P0143','SV-SAM-P0144','SV-SAM-P0145','SV-SAM-P0146','SV-SAM-P0147','SV-SAM-P0148'
)
AND status = 'unreviewed'
AND mapped_subject_id IS NULL;

INSERT INTO review_audit (id, actor, action, target_id, payload)
SELECT 'seed-expanded-profile-links-2026-07-22', 'system.manual-sequence-review', 'profile.links.seeded', 'SV-SAM-U05,SV-SAM-U06,SV-SAM-U07,SV-SAM-U08,SV-SAM-U09', '{"basis":"manual adjacent-frame review","biometric":false,"profiles":5,"artifacts":24}'
WHERE EXISTS (SELECT 1 FROM review_artifacts WHERE mapped_subject_id IN ('SV-SAM-U05','SV-SAM-U06','SV-SAM-U07','SV-SAM-U08','SV-SAM-U09'))
  AND NOT EXISTS (SELECT 1 FROM review_audit WHERE id = 'seed-expanded-profile-links-2026-07-22');
