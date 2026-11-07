import type { Question, SectionId } from '../engine/types'
import { BANK, QUESTIONS } from './questions'

const SECTIONS: SectionId[] = ['verbal', 'data', 'math', 'reasoning', 'sequence']

export type Validation = { ok: true; q: Question } | { ok: false; error: string }

/** 외부(개인) 문제 JSON 검증. 정답이 없거나 검증 상태가 불명확하면 'unverified'로 격리 → 모의고사 제외. */
export function validateQuestion(x: unknown): Validation {
  const o = x as Record<string, unknown>
  if (!o || typeof o !== 'object') return { ok: false, error: '객체가 아님' }
  const id = typeof o.id === 'string' ? o.id.trim() : ''
  if (!id) return { ok: false, error: 'id 없음' }
  if (!SECTIONS.includes(o.section as SectionId)) return { ok: false, error: `${id}: section 오류(${String(o.section)})` }
  if (typeof o.stem !== 'string' || !o.stem.trim()) return { ok: false, error: `${id}: stem 없음` }
  const ch = o.choices
  if (!Array.isArray(ch) || ch.length !== 5 || ch.some((c) => typeof c !== 'string' || !c.trim()))
    return { ok: false, error: `${id}: choices는 비어있지 않은 문자열 5개여야 함` }
  if (new Set(ch).size !== 5) return { ok: false, error: `${id}: 선지 중복` }
  const hasAnswer = Number.isInteger(o.answer) && (o.answer as number) >= 0 && (o.answer as number) <= 4
  const v = o.verification === 'script' || o.verification === 'manual' ? o.verification : 'unverified'
  const str = (k: string, d = '') => (typeof o[k] === 'string' ? (o[k] as string) : d)
  const q: Question = {
    id, section: o.section as SectionId, subtype: str('subtype', '미분류'),
    difficulty: ([1, 2, 3].includes(o.difficulty as number) ? o.difficulty : 2) as 1 | 2 | 3,
    targetSec: typeof o.targetSec === 'number' && o.targetSec > 0 ? o.targetSec : 60,
    stem: o.stem as string,
    passage: typeof o.passage === 'string' ? o.passage : undefined,
    conditions: Array.isArray(o.conditions) ? (o.conditions as string[]) : undefined,
    table: o.table as Question['table'],
    image: typeof o.image === 'string' && /^[\w.-]+$/.test(o.image) ? o.image : undefined,
    choices: ch as Question['choices'],
    answer: (hasAnswer ? o.answer : 0) as Question['answer'],
    explanation: str('explanation'), fastMethod: str('fastMethod'), commonMistake: str('commonMistake'),
    source: str('source', '비공개 자료(개인 학습용)'),
    verification: hasAnswer ? v : 'unverified',
  }
  return { ok: true, q }
}

export interface PrivateBankInfo { available: boolean; loaded: number; unverified: number; errors: string[] }

/** 로컬 서버의 /__private/bank.json 에서만 읽는다(번들에 포함되지 않음 → 정적 배포 시 존재하지 않음). */
export async function loadPrivateBank(): Promise<PrivateBankInfo> {
  const info: PrivateBankInfo = { available: false, loaded: 0, unverified: 0, errors: [] }
  try {
    const r = await fetch('/__private/bank.json', { cache: 'no-store' })
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return info
    const items: unknown[] = await r.json()
    info.available = true
    for (const it of items) {
      const v = validateQuestion(it)
      if (!v.ok) { info.errors.push(v.error); continue }
      if (BANK[v.q.id]) {
        if (BANK[v.q.id].source !== v.q.source || v.q.source.startsWith('자체 제작')) { info.errors.push(`${v.q.id}: id 중복(건너뜀)`); }
        continue
      }
      QUESTIONS.push(v.q); BANK[v.q.id] = v.q
      info.loaded++
      if (v.q.verification === 'unverified') info.unverified++
    }
  } catch { /* 서버 없음/정적 배포 */ }
  return info
}
