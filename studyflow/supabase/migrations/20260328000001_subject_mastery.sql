CREATE TABLE subject_mastery (
  mastery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES course_enrollment(enrollment_id),
  subject_id UUID REFERENCES course_subjects(subject_id),
  mastery_score INTEGER DEFAULT 0
    CHECK (mastery_score BETWEEN 0 AND 100),
  decay_rate FLOAT DEFAULT 0.230,
  last_practiced_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, subject_id)
);

ALTER TABLE subject_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subject_mastery: own" ON subject_mastery
  USING (
    enrollment_id IN (
      SELECT enrollment_id FROM course_enrollment WHERE user_id = auth.uid()
    )
  );
