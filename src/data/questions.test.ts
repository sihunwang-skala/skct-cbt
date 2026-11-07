import { describe, expect, it } from 'vitest'
import { BANK } from './questions'

// 정답은 문제은행의 값과 무관하게 독립 계산(브루트포스/직접 계산)으로 재도출해 비교한다.
const ans = (id: string) => BANK[id].choices[BANK[id].answer]

describe('independent verification of answers', () => {
  it('D-001 growth rates', () => {
    const d = { A: [400, 440], B: [250, 300], C: [200, 210] } as Record<string, number[]>
    const rate = Object.entries(d).map(([k, [a, b]]) => [k, (b - a) / a] as const).sort((x, y) => y[1] - x[1])
    expect(rate[0][0]).toBe(ans('D-001'))
    expect(rate[0][1] > rate[1][1]).toBe(true)
  })
  it('D-002 percentage points', () => {
    expect((120 / 400 - 100 / 400) * 100).toBeCloseTo(5)
    expect(ans('D-002')).toBe('5%p 증가')
  })
  it('D-003 mean', () => expect(String((120 + 95 + 140 + 85) / 4)).toBe(ans('D-003')))
  it('M-001 average speed', () => expect(`${Math.round(((2 * 1) / (1 / 40 + 1 / 60)) * 1e6) / 1e6}km/h`).toBe(ans('M-001')))
  it('M-002 concentration', () => {
    const x = [...Array(100).keys()].filter((g) => Math.abs((20 + g) / (200 + g) - 0.2) < 1e-9)
    expect(`${x[0]}g`).toBe(ans('M-002'))
  })
  it('M-003 work rate', () => expect(`${Math.round((1 / (1 / 10 + 1 / 15)) * 1e6) / 1e6}일`).toBe(ans('M-003')))

  it('L-001 syllogism by exhaustive model search over 3-element universe', () => {
    // 각 원소에 대해 (A,B,C,D) 속성을 0/1로 두고 모든 모델 탐색
    const props = [...Array(16).keys()].map((m) => ({ A: !!(m & 1), B: !!(m & 2), C: !!(m & 4), D: !!(m & 8) }))
    type P = (typeof props)[number]
    const models: P[][] = []
    for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) for (let c = 0; c < 16; c++) models.push([props[a], props[b], props[c]])
    const all = (m: P[], f: (x: P) => boolean) => m.every(f)
    const some = (m: P[], f: (x: P) => boolean) => m.some(f)
    const valid = models.filter(
      (m) => all(m, (x) => !x.A || x.B) && all(m, (x) => !x.B || x.C) && some(m, (x) => x.D && x.A),
    )
    const choices: ((m: P[]) => boolean)[] = [
      (m) => all(m, (x) => !x.D || x.C),
      (m) => some(m, (x) => x.D && x.C),
      (m) => all(m, (x) => !x.C || x.A),
      (m) => some(m, (x) => x.C && !x.D),
      (m) => all(m, (x) => !(x.B && !x.A)),
    ]
    const must = choices.map((f) => valid.every(f))
    expect(must.filter(Boolean).length).toBe(1)
    expect(must.indexOf(true)).toBe(BANK['L-001'].answer)
  })
  it('L-002 ranking by permutation search is unique', () => {
    const perms = (a: string[]): string[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])))
    const ok = perms([...'ABCDE']).filter((p) => {
      const i = (x: string) => p.indexOf(x)
      return i('C') < i('A') && i('A') < i('B') && i('D') === i('C') + 1 && i('E') === 4
    })
    expect(ok.length).toBe(1)
    expect(ok[0][2]).toBe(ans('L-002'))
  })
  it('L-003 liar puzzle by enumeration', () => {
    const culprits = ['갑', '을', '병']
    const possible = new Set<string>()
    for (const c of culprits) for (const liar of culprits) {
      const truth: Record<string, boolean> = { 갑: c !== '갑', 을: c === '병' }
      truth['병'] = !truth['을'] // 병: "을의 말은 거짓이다"
      const says = Object.fromEntries(culprits.map((p) => [p, truth[p]]))
      const falseOnes = culprits.filter((p) => !says[p])
      if (falseOnes.length === 1 && falseOnes[0] === liar) possible.add(c)
    }
    const cannot = culprits.filter((p) => !possible.has(p))
    expect(cannot).toEqual([ans('L-003')])
  })

  const seq = (id: string, expected: number) => expect(String(expected)).toBe(ans(id))
  it('S-001 alternating +2 / ×2', () => {
    const a = [3]
    for (let i = 0; i < 7; i++) a.push(i % 2 === 0 ? a[i] + 2 : a[i] * 2)
    expect(a.slice(0, 7)).toEqual([3, 5, 10, 12, 24, 26, 52])
    seq('S-001', a[7])
  })
  it('S-002 fibonacci-like', () => {
    const a = [2, 3]
    while (a.length < 7) a.push(a[a.length - 1] + a[a.length - 2])
    expect(a.slice(0, 6)).toEqual([2, 3, 5, 8, 13, 21])
    seq('S-002', a[6])
  })
  it('S-003 factorial', () => seq('S-003', 720))

  it('every question has 5 distinct choices and a valid answer', () => {
    for (const q of Object.values(BANK)) {
      expect(new Set(q.choices).size).toBe(5)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(5)
    }
  })
})
