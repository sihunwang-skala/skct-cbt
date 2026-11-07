import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../data/questions'
import { eligibleQuestions, selectQuestions, shuffled } from './selection'
import type { SessionRecord } from './coach'

describe('question selection', () => {
  it('uses a reproducible seeded shuffle', () => {
    const a = shuffled([1, 2, 3, 4, 5, 6], 'same')
    expect(shuffled([1, 2, 3, 4, 5, 6], 'same')).toEqual(a)
    expect(shuffled([1, 2, 3, 4, 5, 6], 'different')).not.toEqual(a)
  })

  it('filters by section, subtype and difficulty', () => {
    const q = eligibleQuestions(QUESTIONS, 'math', {
      seed: 'x', subtypes: ['농도'], difficulties: [2], review: 'all',
    })
    expect(q.map((x) => x.id)).toEqual(['M-002'])
  })

  it('supports unseen, wrong and slow review filters using latest attempt', () => {
    const history: SessionRecord[] = [{
      sid: 's1', at: 1, mode: 'test', attempts: [
        { id: 'M-001', section: 'math', subtype: '거리·속력·시간', correct: false, blank: false, ms: 10_000, targetSec: 70, tags: ['오답'] },
        { id: 'M-002', section: 'math', subtype: '농도', correct: true, blank: false, ms: 120_000, targetSec: 80, tags: ['시간 초과'] },
      ],
    }]
    const ids = (review: 'unseen' | 'wrong' | 'slow') => eligibleQuestions(QUESTIONS, 'math', { seed: 'x', review, history }).map((q) => q.id)
    expect(ids('unseen')).toEqual(['M-003'])
    expect(ids('wrong')).toEqual(['M-001'])
    expect(ids('slow')).toEqual(['M-002'])
  })

  it('never selects unverified questions', () => {
    const extra = { ...QUESTIONS[0], id: 'U-1', verification: 'unverified' as const }
    expect(selectQuestions([...QUESTIONS, extra], 'verbal', 99, { seed: 'x' }).some((q) => q.id === 'U-1')).toBe(false)
  })
})
