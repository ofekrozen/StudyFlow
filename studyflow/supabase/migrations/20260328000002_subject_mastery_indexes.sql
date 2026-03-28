CREATE INDEX idx_subject_mastery_enrollment
  ON subject_mastery(enrollment_id);

CREATE INDEX idx_subject_mastery_review
  ON subject_mastery(next_review_at)
  WHERE next_review_at IS NOT NULL;
