export const AI_MODELS = {
  QUESTION_GENERATION: 'gpt-4o',
  ANSWER_ANALYSIS: 'gpt-4o',
  HINT_GENERATION: 'gpt-4o',
  FEEDBACK_GENERATION: 'gpt-4o',
  EMBEDDING: 'text-embedding-3-small',
} as const

export const AI_TEMPERATURES = {
  QUESTION_GENERATION: 0.7,
  ANSWER_ANALYSIS: 0.3,
  HINT_GENERATION: 0.7,
  FEEDBACK_GENERATION: 0.3,
} as const

// Number of material chunks to retrieve per Socratic route.
export const RAG_MATCH_COUNTS = {
  START: 8,
  ANSWER: 6,
  HINT: 5,
} as const

// Chunking parameters for embedding course material.
// Char-based (~4 chars/token heuristic) since there is no tokenizer dependency.
export const RAG_CHUNKING = {
  MAX_CHARS: 2800,
  OVERLAP_CHARS: 400,
} as const
