import { useEffect, useRef, useState } from 'react'
import { initialCalc, KEY_MAP, press, type CalcState } from '../engine/calc'

const KEYS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['±', '0', '.', '='],
]

export function Calculator({ active }: { active: boolean }) {
  const [s, setS] = useState<CalcState>(initialCalc)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return
      const k = KEY_MAP[e.key] ?? e.key
      if (/^[0-9.+\-=]$/.test(k) || ['×', '÷', '⌫', 'C', '='].includes(k)) {
        e.preventDefault()
        setS((p) => press(p, k))
        setFlash(k)
        setTimeout(() => setFlash(null), 90)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [active])

  return (
    <div className="calc" data-testid="calculator">
      <div className="calc-display" data-testid="calc-display">
        <span className="calc-op">{s.op ?? ''}</span>
        {s.display}
      </div>
      <div className="calc-keys">
        {KEYS.flat().map((k) => (
          <button
            key={k}
            className={`ckey ${/[÷×\-+=]/.test(k) ? 'op' : ''} ${flash === k ? 'flash' : ''}`}
            onClick={() => setS((p) => press(p, k))}
            data-key={k}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="tool-hint">숫자패드 입력 가능 · Enter(=) · Backspace(⌫)</div>
    </div>
  )
}

export function Memo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="memo">
      <textarea
        data-testid="memo"
        value={value}
        maxLength={400}
        placeholder="조건·숫자를 간단히 메모하세요"
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      <div className="tool-hint">{value.length} / 400자 (제한된 메모 영역)</div>
    </div>
  )
}

export function Paint({ data, onChange }: { data: string; onChange: (d: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')

  const last = useRef('')
  useEffect(() => {
    if (data === last.current) return // 자체 드로잉으로 인한 변경은 다시 그리지 않음
    last.current = data
    const c = ref.current!
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    if (data) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = data
    }
  }, [data])

  const pos = (e: React.PointerEvent) => {
    const c = ref.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }
  const down = (e: React.PointerEvent) => {
    drawing.current = true
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const ctx = ref.current!.getContext('2d')!
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineCap = 'round'
    ctx.lineWidth = tool === 'pen' ? 3 : 22
    ctx.strokeStyle = '#111'
    ctx.globalCompositeOperation = tool === 'pen' ? 'source-over' : 'destination-out'
    ctx.lineTo(p.x + 0.01, p.y)
    ctx.stroke()
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = ref.current!.getContext('2d')!
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = ref.current!.toDataURL()
    onChange(last.current)
  }

  return (
    <div className="paint">
      <div className="paint-bar">
        <button className={tool === 'pen' ? 'on' : ''} onClick={() => setTool('pen')}>펜</button>
        <button className={tool === 'eraser' ? 'on' : ''} onClick={() => setTool('eraser')}>지우개</button>
        <button onClick={() => onChange('')}>전체 지우기</button>
      </div>
      <canvas ref={ref} width={520} height={300} data-testid="paint-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
    </div>
  )
}
