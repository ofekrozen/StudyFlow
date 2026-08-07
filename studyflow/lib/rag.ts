import type { SupabaseClient } from '@supabase/supabase-js'
import { RAG_MATCH_COUNTS } from '@/lib/ai-config'
import { chunkText, embedTexts, hashContent, toPgVectorLiteral } from '@/lib/embeddings'

export type MaterialSourceType = 'user_course_material' | 'syllabus' | 'course_professor_exam'

export interface RagChunk {
  chunk_id: string
  source_type: MaterialSourceType
  source_label: string | null
  content: string
  similarity: number
}

// A parsed_text source to be (re)chunked and embedded.
interface MaterialSource {
  sourceType: MaterialSourceType
  sourceId: string
  sourceLabel: string
  enrollmentId: string | null // null = course-shared
  parsedText: string
}

/**
 * Gathers every parsed_text source for a course that is visible to this
 * enrollment: course-shared syllabus + past exams, plus this enrollment's own
 * private uploads (never another student's).
 */
async function gatherSources(
  supabase: SupabaseClient,
  courseId: string,
  enrollmentId: string
): Promise<MaterialSource[]> {
  const sources: MaterialSource[] = []

  // Syllabus (course-shared)
  const { data: syllabi } = await supabase
    .from('syllabus')
    .select('syllabus_id, parsed_text')
    .eq('course_id', courseId)
    .is('deleted_at', null)

  for (const s of syllabi ?? []) {
    if (s.parsed_text?.trim()) {
      sources.push({
        sourceType: 'syllabus',
        sourceId: s.syllabus_id,
        sourceLabel: 'Syllabus',
        enrollmentId: null,
        parsedText: s.parsed_text,
      })
    }
  }

  // Past professor exams (course-shared) — two-step lookup via course_professors.
  const { data: courseProfessors } = await supabase
    .from('course_professors')
    .select('course_professor_id')
    .eq('course_id', courseId)

  const cpIds = (courseProfessors ?? []).map((cp) => cp.course_professor_id)
  if (cpIds.length > 0) {
    const { data: exams } = await supabase
      .from('course_professor_exams')
      .select('course_professor_exam_id, exam_name, parsed_text')
      .in('course_professor_id', cpIds)

    for (const e of exams ?? []) {
      if (e.parsed_text?.trim()) {
        sources.push({
          sourceType: 'course_professor_exam',
          sourceId: e.course_professor_exam_id,
          sourceLabel: e.exam_name ?? 'Past Exam',
          enrollmentId: null,
          parsedText: e.parsed_text,
        })
      }
    }
  }

  // This enrollment's private uploads only.
  const { data: materials } = await supabase
    .from('user_course_materials')
    .select('user_course_material_id, parsed_text')
    .eq('enrollment_id', enrollmentId)
    .is('deleted_at', null)

  for (const m of materials ?? []) {
    if (m.parsed_text?.trim()) {
      sources.push({
        sourceType: 'user_course_material',
        sourceId: m.user_course_material_id,
        sourceLabel: 'Your Uploaded Material',
        enrollmentId,
        parsedText: m.parsed_text,
      })
    }
  }

  return sources
}

/**
 * Ensures all material_chunks for a course (as visible to this enrollment)
 * are embedded and up to date. Idempotent: a source whose content_hash matches
 * an existing chunk is skipped (no OpenAI call). Runs lazily before retrieval.
 *
 * Errors are swallowed so a flaky embedding call degrades to "no material"
 * rather than failing the Socratic request.
 */
export async function ensureCourseMaterialEmbedded(
  supabase: SupabaseClient,
  courseId: string,
  enrollmentId: string
): Promise<void> {
  try {
    const sources = await gatherSources(supabase, courseId, enrollmentId)

    for (const source of sources) {
      const contentHash = hashContent(source.parsedText)

      // Skip if already embedded with a matching hash.
      const { data: existing } = await supabase
        .from('material_chunks')
        .select('content_hash')
        .eq('source_type', source.sourceType)
        .eq('source_id', source.sourceId)
        .limit(1)
        .maybeSingle()

      if (existing && existing.content_hash === contentHash) continue

      // Stale or missing — clear any old chunks for this source and re-embed.
      await supabase
        .from('material_chunks')
        .delete()
        .eq('source_type', source.sourceType)
        .eq('source_id', source.sourceId)

      const chunks = chunkText(source.parsedText)
      if (chunks.length === 0) continue

      const embeddings = await embedTexts(chunks.map((c) => c.content))

      const rows = chunks.map((c, i) => ({
        course_id: courseId,
        enrollment_id: source.enrollmentId,
        source_type: source.sourceType,
        source_id: source.sourceId,
        source_label: source.sourceLabel,
        chunk_index: c.index,
        content: c.content,
        content_hash: contentHash,
        embedding: toPgVectorLiteral(embeddings[i]),
      }))

      await supabase.from('material_chunks').insert(rows)
    }
  } catch (err) {
    console.warn(
      `[RAG] Failed to embed material for course ${courseId}: ` +
        (err instanceof Error ? err.message : String(err))
    )
  }
}

/**
 * Retrieves the top course-material chunks most relevant to `query` for this
 * enrollment. Ensures material is embedded first, then runs a cosine-similarity
 * search via the match_material_chunks RPC.
 *
 * Returns [] on any failure so callers fall back to their "no materials"
 * prompt branch instead of erroring.
 */
export async function fetchRAGContext(
  supabase: SupabaseClient,
  courseId: string,
  enrollmentId: string,
  query: string,
  opts?: { matchCount?: number; excludeChunkIds?: string[] }
): Promise<RagChunk[]> {
  try {
    await ensureCourseMaterialEmbedded(supabase, courseId, enrollmentId)

    const cleanQuery = query.trim()
    if (!cleanQuery) return []

    const [queryEmbedding] = await embedTexts([cleanQuery])
    if (!queryEmbedding) return []

    const { data, error } = await supabase.rpc('match_material_chunks', {
      query_embedding: toPgVectorLiteral(queryEmbedding),
      p_course_id: courseId,
      p_enrollment_id: enrollmentId,
      match_count: opts?.matchCount ?? RAG_MATCH_COUNTS.START,
      p_exclude_ids: opts?.excludeChunkIds ?? [],
    })

    if (error || !data) return []

    return (data as RagChunk[]).map((r) => ({
      chunk_id: r.chunk_id,
      source_type: r.source_type,
      source_label: r.source_label,
      content: r.content,
      similarity: r.similarity,
    }))
  } catch (err) {
    console.warn(
      `[RAG] Retrieval failed for course ${courseId}: ` +
        (err instanceof Error ? err.message : String(err))
    )
    return []
  }
}

/** Renders retrieved chunks as labeled, source-attributed blocks for a prompt. */
export function formatRagChunksForPrompt(chunks: RagChunk[]): string {
  return chunks
    .map((c) => `[Source: ${c.source_label ?? 'Course Material'}]\n${c.content}`)
    .join('\n\n')
}
