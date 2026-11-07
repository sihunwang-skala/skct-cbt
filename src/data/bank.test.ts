import { describe, expect, it } from 'vitest'
import { validateQuestion } from './bank'

const base = { id: 'P-1', section: 'math', stem: '문제', choices: ['1', '2', '3', '4', '5'], answer: 2 }
describe('validateQuestion', () => {
  it('accepts a valid question but keeps it unverified unless declared', () => {
    const r = validateQuestion(base)
    expect(r.ok && r.q.verification).toBe('unverified')
  })
  it('keeps declared verification when an answer exists', () => {
    const r = validateQuestion({ ...base, verification: 'script' })
    expect(r.ok && r.q.verification).toBe('script')
  })
  it('missing answer forces unverified even if declared', () => {
    const { answer: _a, ...noAns } = base
    const r = validateQuestion({ ...noAns, verification: 'script' })
    expect(r.ok && r.q.verification).toBe('unverified')
  })
  it('rejects bad choices / section / duplicates / image path traversal', () => {
    expect(validateQuestion({ ...base, choices: ['1', '2'] }).ok).toBe(false)
    expect(validateQuestion({ ...base, section: 'x' }).ok).toBe(false)
    expect(validateQuestion({ ...base, choices: ['1', '1', '3', '4', '5'] }).ok).toBe(false)
    const r = validateQuestion({ ...base, image: '../secret.png' })
    expect(r.ok && r.q.image).toBeUndefined()
  })
})
