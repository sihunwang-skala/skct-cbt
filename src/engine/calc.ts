// 실전 계산기 로직: 즉시 실행(chain) 방식. 실제 SKCT 계산기의 연산 순서 규칙은 미확인 → 이후 설정화.
export interface CalcState {
  display: string
  acc: number | null
  op: string | null
  fresh: boolean
}

export const initialCalc: CalcState = { display: '0', acc: null, op: null, fresh: true }

const fix = (n: number) => Number(n.toPrecision(12))

function apply(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return fix(a + b)
    case '-': return fix(a - b)
    case '×': return fix(a * b)
    case '÷': return b === 0 ? NaN : fix(a / b)
  }
  return b
}

const show = (n: number) => (Number.isFinite(n) ? String(n) : 'Error')

export function press(s: CalcState, key: string): CalcState {
  if (s.display === 'Error' && key !== 'C') return s
  if (/^[0-9]$/.test(key)) {
    if (s.fresh) return { ...s, display: key, fresh: false }
    if (s.display.replace(/[-.]/g, '').length >= 12) return s
    return { ...s, display: s.display === '0' ? key : s.display + key }
  }
  switch (key) {
    case '.':
      if (s.fresh) return { ...s, display: '0.', fresh: false }
      return s.display.includes('.') ? s : { ...s, display: s.display + '.' }
    case 'C':
      return initialCalc
    case '⌫':
      if (s.fresh) return s
      return { ...s, display: s.display.length <= 1 || (s.display.length === 2 && s.display[0] === '-') ? '0' : s.display.slice(0, -1) }
    case '±':
      return s.display === '0' ? s : { ...s, display: s.display.startsWith('-') ? s.display.slice(1) : '-' + s.display }
    case '%':
      return { ...s, display: show(fix(parseFloat(s.display) / 100)), fresh: true }
    case '+': case '-': case '×': case '÷': {
      const cur = parseFloat(s.display)
      if (s.acc !== null && s.op && !s.fresh) {
        const r = apply(s.acc, s.op, cur)
        return { display: show(r), acc: Number.isFinite(r) ? r : null, op: key, fresh: true }
      }
      return { ...s, acc: cur, op: key, fresh: true }
    }
    case '=': {
      if (s.acc === null || !s.op) return { ...s, fresh: true }
      const r = apply(s.acc, s.op, parseFloat(s.display))
      return { display: show(r), acc: null, op: null, fresh: true }
    }
  }
  return s
}

export const KEY_MAP: Record<string, string> = {
  '*': '×', '/': '÷', Enter: '=', '=': '=', Backspace: '⌫', // Esc 초기화는 후기상 지원되지 않는 것으로 보여 제외(미확인)
}
