ALTER TABLE socratic_tutor_sessions
  ALTER COLUMN ai_questions TYPE JSONB USING ai_questions::JSONB,
  ALTER COLUMN user_answers TYPE JSONB USING user_answers::JSONB,
  ALTER COLUMN ai_feedback TYPE JSONB USING ai_feedback::JSONB,
  ADD COLUMN weak_points JSONB DEFAULT '[]',
  ADD COLUMN hints_given INTEGER DEFAULT 0,
  ADD COLUMN questions_count INTEGER DEFAULT 5;
