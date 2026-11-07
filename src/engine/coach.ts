import type { Question, Session } from './types'

// skct-ai-coach의 약점 태깅·시간 분석 아이디어를 통합. 자동 추정 태그는 "추정"이며 확정 오답 원인이 아님.
export type Tag = '시간 초과' | '오답' | '답 번복' | '미응답' | '목표시간 내 정답'

export function tagsFor(q: Question, answer: number | null | undefined, ms: number, changes = 0): Tag[] {
  const t: Tag[] = []
  const ok = answer === q.answer
  if (answer == null) t.push('미응답')
  else if (!ok) t.push('오답')
  if (ms > q.targetSec * 1000 * 1.25) t.push('시간 초과')
  if (changes > 0 && !ok && answer != null) t.push('답 번복')
  if (ok && ms <= q.targetSec * 1000) t.push('목표시간 내 정답')
  return t
}

export interface AttemptRecord { id: string; section: string; subtype: string; correct: boolean; blank: boolean; ms: number; targetSec: number; tags: Tag[] }
export interface SessionRecord { sid: string; at: number; mode: string; attempts: AttemptRecord[] }

const KEY = 'skct-cbt:history'
export const loadHistory = (): SessionRecord[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function recordSession(s: Session, bank: Record<string, Question>): SessionRecord {
  const attempts = s.sectionQuestions.flat().map((id) => {
    const q = bank[id], a = s.answers[id], ms = s.timeSpent[id] ?? 0
    return { id, section: q.section, subtype: q.subtype, correct: a === q.answer, blank: a == null, ms, targetSec: q.targetSec, tags: tagsFor(q, a, ms, s.changes[id]) }
  })
  return { sid: s.id, at: s.finishedAt ?? Date.now(), mode: s.profileId, attempts }
}

export function saveSession(rec: SessionRecord) {
  try {
    const h = loadHistory()
    if (h.some((x) => x.sid === rec.sid)) return
    localStorage.setItem(KEY, JSON.stringify([...h, rec].slice(-50)))
  } catch { /* ignore */ }
}

export function summarize(h: SessionRecord[]) {
  const all = h.flatMap((x) => x.attempts)
  const by = (f: (a: AttemptRecord) => string) => {
    const m = new Map<string, { n: number; ok: number; ms: number }>()
    for (const a of all) { const k = f(a), v = m.get(k) ?? { n: 0, ok: 0, ms: 0 }; v.n++; v.ok += a.correct ? 1 : 0; v.ms += a.ms; m.set(k, v) }
    return [...m].map(([k, v]) => ({ key: k, n: v.n, acc: Math.round((v.ok / v.n) * 100), avgSec: Math.round(v.ms / v.n / 100) / 10 })).sort((a, b) => a.acc - b.acc)
  }
  const tagCount: Record<string, number> = {}
  all.forEach((a) => a.tags.forEach((t) => { tagCount[t] = (tagCount[t] ?? 0) + 1 }))
  return {
    sessions: h.length,
    total: all.length,
    accuracy: all.length ? Math.round((all.filter((a) => a.correct).length / all.length) * 100) : 0,
    inTimeRate: all.length ? Math.round((all.filter((a) => a.correct && a.ms <= a.targetSec * 1000).length / all.length) * 100) : 0,
    bySubtype: by((a) => a.subtype),
    tagCount,
    trend: h.slice(-10).map((x) => Math.round((x.attempts.filter((a) => a.correct).length / Math.max(1, x.attempts.length)) * 100)),
  }
}
