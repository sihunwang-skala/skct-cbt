import type { AttemptRecord, SessionRecord } from './coach'
import type { Question, SectionId } from './types'

export type ReviewFilter = 'all' | 'unseen' | 'wrong' | 'slow'

export interface QuestionSelection {
  seed: string
  subtypes?: string[]
  difficulties?: Array<1 | 2 | 3>
  review?: ReviewFilter
  history?: SessionRecord[]
}

const hashSeed = (value: string) => {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const random = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function shuffled<T>(items: T[], seed: string): T[] {
  const out = [...items]
  const rnd = random(hashSeed(seed))
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function latestAttempts(history: SessionRecord[] = []) {
  const byId = new Map<string, AttemptRecord>()
  for (const session of [...history].sort((a, b) => a.at - b.at)) {
    for (const attempt of session.attempts) byId.set(attempt.id, attempt)
  }
  return byId
}

export function eligibleQuestions(bank: Question[], section: SectionId, selection: QuestionSelection): Question[] {
  const latest = latestAttempts(selection.history)
  const subtypes = new Set(selection.subtypes ?? [])
  const difficulties = new Set(selection.difficulties ?? [1, 2, 3])
  const review = selection.review ?? 'all'

  return bank.filter((q) => {
    if (q.section !== section || q.verification === 'unverified') return false
    if (subtypes.size && !subtypes.has(q.subtype)) return false
    if (!difficulties.has(q.difficulty)) return false
    const attempt = latest.get(q.id)
    if (review === 'unseen') return !attempt
    if (review === 'wrong') return !!attempt && !attempt.correct
    if (review === 'slow') return !!attempt && attempt.ms > q.targetSec * 1000
    return true
  })
}

export function selectQuestions(
  bank: Question[],
  section: SectionId,
  count: number,
  selection: QuestionSelection,
): Question[] {
  return shuffled(eligibleQuestions(bank, section, selection), `${selection.seed}:${section}`).slice(0, count)
}

export function subtypesFor(bank: Question[], section: SectionId): string[] {
  return [...new Set(bank.filter((q) => q.section === section && q.verification !== 'unverified').map((q) => q.subtype))]
    .sort((a, b) => a.localeCompare(b, 'ko'))
}
