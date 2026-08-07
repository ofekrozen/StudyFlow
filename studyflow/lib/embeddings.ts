import { createHash } from 'crypto'
import { openai } from '@/lib/openai'
import { AI_MODELS, RAG_CHUNKING } from '@/lib/ai-config'

export interface TextChunk {
  index: number
  content: string
}

/**
 * Splits prose into overlapping chunks by packing whole paragraphs into
 * ~maxChars buffers. Each new chunk is seeded with the trailing overlapChars
 * of the previous one so context isn't lost across boundaries.
 *
 * Char-based (no tokenizer dependency); ~4 chars/token is a good enough
 * approximation for prose material.
 */
export function chunkText(
  text: string,
  opts?: { maxChars?: number; overlapChars?: number }
): TextChunk[] {
  const maxChars = opts?.maxChars ?? RAG_CHUNKING.MAX_CHARS
  const overlapChars = opts?.overlapChars ?? RAG_CHUNKING.OVERLAP_CHARS

  const trimmed = text.trim()
  if (!trimmed) return []

  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  const chunks: string[] = []
  let buffer = ''

  const pushBuffer = () => {
    if (buffer.trim()) chunks.push(buffer.trim())
  }

  for (const para of paragraphs) {
    // A single paragraph larger than maxChars is hard-split into slices.
    if (para.length > maxChars) {
      pushBuffer()
      buffer = ''
      for (let i = 0; i < para.length; i += maxChars) {
        chunks.push(para.slice(i, i + maxChars))
      }
      continue
    }

    if (buffer.length + para.length + 2 > maxChars && buffer) {
      pushBuffer()
      const overlap = overlapChars > 0 ? buffer.slice(-overlapChars) : ''
      buffer = overlap ? `${overlap}\n\n${para}` : para
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para
    }
  }
  pushBuffer()

  return chunks.map((content, index) => ({ index, content }))
}

/** sha256 hex digest — used to detect when a source's parsed_text has changed. */
export function hashContent(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

/**
 * Embeds an array of texts via OpenAI, preserving input order.
 * Batches requests to stay well under per-request input limits.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const BATCH_SIZE = 96
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const response = await openai.embeddings.create({
      model: AI_MODELS.EMBEDDING,
      input: batch,
    })
    // OpenAI returns data in input order, but sort by index defensively.
    const sorted = [...response.data].sort((a, b) => a.index - b.index)
    for (const item of sorted) embeddings.push(item.embedding as number[])
  }

  return embeddings
}

/** Formats an embedding as the text literal Postgres expects for a vector column. */
export function toPgVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
