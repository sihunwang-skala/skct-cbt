import { describe, expect, it } from 'vitest'
import { initialCalc, press } from './calc'
import { createSession, finishSection, goto, remainingMs, resume, score, select, tick } from './session'
import { PROFILES } from '../data/profiles'
import { BANK, QUESTIONS } from '../data/questions'

const run = (keys: string) => [...keys].reduce((s, k) => press(s, k === '*' ? '×' : k === '/' ? '÷' : k), initialCalc).display

describe('calculator', () => {
  it('basic ops and chaining', () => {
    expect(run('12+30=')).toBe('42')
    expect(run('7*8-6=')).toBe('50') // 즉시 실행 방식
    expect(run('1/4=')).toBe('0.25')
    expect(run('0.1+0.2=')).toBe('0.3')
    expect(run('5/0=')).toBe('Error')
    expect(run('9+5C7')).toBe('7')
  })
  it('decimal and delete', () => {
    expect(run('1.5.5')).toBe('1.55')
    expect(press(press(press(initialCalc, '1'), '2'), '⌫').display).toBe('1')
  })
})

const profile = PROFILES.find((p) => p.id === 'skct-sample')!
const T0 = 1_000_000

describe('session / timer', () => {
  it('deadline-based remaining time', () => {
    const s = createSession(profile, QUESTIONS, T0)
    expect(remainingMs(s, T0 + 100_000)).toBe(140_000)
  })
  it('auto advances section on expiry, even after long background gap', () => {
    let s = createSession(profile, QUESTIONS, T0)
    s = tick(s, T0 + 240_000)
    expect(s.phase).toBe('break')
    s = tick(s, T0 + 240_000 + 10_000)
    expect(s.phase).toBe('exam')
    expect(s.sectionIdx).toBe(1)
    // 탭이 오래 숨겨졌다가 복구: 전체 5영역 + 휴식이 모두 지난 시점
    const r = resume(createSession(profile, QUESTIONS, T0), T0 + 10 * 3600_000)
    expect(r.phase).toBe('done')
  })
  it('records per-question time and answer changes', () => {
    let s = createSession(profile, QUESTIONS, T0)
    const id = s.sectionQuestions[0][0]
    s = select(s, 1, T0 + 1000)
    s = select(s, 2, T0 + 2000)
    s = goto(s, 1, T0 + 5000)
    expect(s.timeSpent[id]).toBe(5000)
    expect(s.changes[id]).toBe(1)
  })
  it('blocks going back when allowBack=false, allows when true', () => {
    let s = createSession(profile, QUESTIONS, T0)
    s = goto(s, 1, T0 + 1)
    expect(goto(s, 0, T0 + 2).qIdx).toBe(1)
    const s2 = createSession({ ...profile, config: { ...profile.config, allowBack: true } }, QUESTIONS, T0)
    expect(goto(goto(s2, 1, T0 + 1), 0, T0 + 2).qIdx).toBe(0)
  })
  it('blocks next on blank when allowSkip=false', () => {
    const s = createSession({ ...profile, config: { ...profile.config, allowSkip: false } }, QUESTIONS, T0)
    expect(goto(s, 1, T0 + 1).qIdx).toBe(0)
  })
  it('scores correct / wrong / blank', () => {
    let s = createSession(profile, QUESTIONS, T0)
    const id0 = s.sectionQuestions[0][0]
    s = select(s, BANK[id0].answer, T0 + 10)
    s = select(goto(s, 1, T0 + 20), (BANK[s.sectionQuestions[0][1]].answer + 1) % 5, T0 + 30)
    s = finishSection(s, T0 + 40)
    const r = score(s, BANK)
    expect(r.sections[0]).toMatchObject({ correct: 1, wrong: 1, blank: 1 })
  })
})

import { tagsFor, summarize } from './coach'
describe('coach tags', () => {
  const q = BANK['D-001']
  it('tags slow wrong answer', () => expect(tagsFor(q, 0, 100_000, 1)).toEqual(['오답', '시간 초과', '답 번복']))
  it('tags fast correct', () => expect(tagsFor(q, q.answer, 30_000)).toEqual(['목표시간 내 정답']))
  it('tags blank', () => expect(tagsFor(q, null, 0)).toEqual(['미응답']))
  it('summarize empty', () => expect(summarize([]).accuracy).toBe(0))
})
