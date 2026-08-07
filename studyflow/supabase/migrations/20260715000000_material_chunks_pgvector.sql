-- ============================================================
-- MATERIAL_CHUNKS (pgvector-backed RAG store for the Socratic tutor)
-- ============================================================
-- Holds embedded chunks of course material text drawn from three sources:
--   - syllabus              (course-shared)
--   - course_professor_exams (course-shared)
--   - user_course_materials  (private to a single enrollment)
--
-- enrollment_id is NULL for course-shared content and set for private
-- per-student uploads, so a student's private material is never retrieved
-- into another student's session even when they share a course.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE material_source_type_enum AS ENUM (
  'user_course_material', 'syllabus', 'course_professor_exam'
);

CREATE TABLE material_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  enrollment_id UUID REFERENCES course_enrollment(enrollment_id), -- NULL = shared course-level content
  source_type material_source_type_enum NOT NULL,
  source_id UUID NOT NULL,          -- syllabus_id | user_course_material_id | course_professor_exam_id
  source_label TEXT,                -- "Syllabus" | exam_name | material label — for material_ref attribution
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,       -- sha256 of parent parsed_text; drives idempotent re-embedding
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, source_id, chunk_index)
);

CREATE INDEX idx_material_chunks_course ON material_chunks(course_id);
CREATE INDEX idx_material_chunks_source ON material_chunks(source_type, source_id);
-- No ANN index (ivfflat/hnsw) yet — exact cosine scan is fast at current data
-- scale. Add an hnsw index (pgvector >= 0.5.0) once material volume grows.

ALTER TABLE material_chunks ENABLE ROW LEVEL SECURITY;

-- Readable if the caller is enrolled in the course AND the chunk is either
-- course-shared (enrollment_id IS NULL) or their own private upload.
CREATE POLICY "material_chunks: course-enrolled, private stays private" ON material_chunks
  USING (
    course_id IN (
      SELECT course_id FROM course_enrollment WHERE user_id = auth.uid()
    )
    AND (
      enrollment_id IS NULL
      OR enrollment_id IN (
        SELECT enrollment_id FROM course_enrollment WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- match_material_chunks: cosine-similarity retrieval RPC
-- ============================================================
-- SECURITY INVOKER (default) so material_chunks RLS still applies to the
-- calling user inside the function — defense in depth on top of the
-- p_enrollment_id filter.
CREATE OR REPLACE FUNCTION match_material_chunks(
  query_embedding VECTOR(1536),
  p_course_id UUID,
  p_enrollment_id UUID,
  match_count INT DEFAULT 6,
  p_exclude_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
  chunk_id UUID,
  source_type material_source_type_enum,
  source_label TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT chunk_id, source_type, source_label, content,
         1 - (embedding <=> query_embedding) AS similarity
  FROM material_chunks
  WHERE course_id = p_course_id
    AND (enrollment_id IS NULL OR enrollment_id = p_enrollment_id)
    AND chunk_id <> ALL(p_exclude_ids)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
