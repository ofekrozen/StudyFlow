-- Track which material_chunks have already been surfaced in a Socratic session,
-- so follow-up retrieval can request material the student has not yet discussed.
ALTER TABLE socratic_tutor_sessions
  ADD COLUMN covered_chunk_ids JSONB DEFAULT '[]';
