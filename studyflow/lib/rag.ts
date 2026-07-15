import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetches course material text for a given enrollment.
 * Materials are ordered by most recently uploaded first.
 *
 * When pgvector embeddings are added, replace this function's body with
 * a semantic similarity search — all callers remain unchanged.
 */
export async function fetchRAGContext(
  supabase: SupabaseClient,
  enrollmentId: string,
  maxChars: number = 48000
): Promise<string> {
  const { data: materials } = await supabase
    .from('user_course_materials')
    .select('parsed_text')
    .eq('enrollment_id', enrollmentId)
    .not('parsed_text', 'is', null)
    .neq('parsed_text', '')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (!materials || materials.length === 0) return ''

  const combined = materials
    .map((m: { parsed_text: string }, i: number) => `[Material ${i + 1}]\n${m.parsed_text}`)
    .join('\n\n')

  if (combined.length > maxChars) {
    console.warn(
      `[RAG] Content for enrollment ${enrollmentId} exceeds ${maxChars} chars ` +
        `(${combined.length} chars). Truncating. Consider adding pgvector.`
    )
    return combined.slice(0, maxChars)
  }

  return combined
}
