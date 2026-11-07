import { useCallback, useEffect, useState } from 'react'
import { ExamScreen } from './components/ExamScreen'
import { Result } from './components/Result'
import { Dashboard } from './components/Dashboard'
import { Stage } from './components/Stage'
import { recordSession, saveSession } from './engine/coach'
import { PROFILES } from './data/profiles'
import { BANK, QUESTIONS } from './data/questions'
import { createSession, finishSection, goto, remainingMs, resume, select, tick } from './engine/session'
import type { ExamConfig, Session } from './engine/types'

const KEY = 'skct-cbt:session'
const load = (): Session | null => {
  try { const r = localStorage.getItem(KEY); return r ? (JSON.parse(r) as Session) : null } catch { return null }
}
const save = (s: Session | null) => {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export default function App() {
  const [s, setS] = useState<Session | null>(() => {
    const p = load()
    return p && p.phase !== 'done' ? resume(p, Date.now()) : p
  })
  const [now, setNow] = useState(Date.now())
  const [memo, setMemo] = useState('')
  const [paint, setPaint] = useState('')
  const [fsLost, setFsLost] = useState(false)
  const [cfg, setCfg] = useState<Partial<ExamConfig>>({})

  const update = useCallback((fn: (p: Session, t: number) => Session) => {
    setS((p) => {
      if (!p) return p
      const n = fn(p, Date.now())
      save(n)
      return n
    })
  }, [])

  // 타이머: 절대 마감시각 기준. 렌더 주기/백그라운드 전환과 무관하게 매 틱 now를 재계산.
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      update(tick)
    }, 200)
    const vis = () => { setNow(Date.now()); update(tick) }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [update])

  useEffect(() => { if (s?.phase === 'done') saveSession(recordSession(s, BANK)) }, [s])

  // 전체화면 이탈 감지
  const inExam = !!s && s.phase !== 'done'
  useEffect(() => {
    const on = () => setFsLost(inExam && !document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [inExam])

  const enterFs = () => document.documentElement.requestFullscreen?.().catch(() => setFsLost(false))

  const start = (pid: string) => {
    const profile = PROFILES.find((p) => p.id === pid)!
    const p = { ...profile, config: { ...profile.config, ...cfg } }
    const n = createSession(p, QUESTIONS, Date.now())
    save(n)
    setMemo(''); setPaint('')
    setS(n)
    enterFs()
  }

  const home = () => { save(null); setS(null); if (document.fullscreenElement) document.exitFullscreen() }

  const onGoto = (i: number) => {
    update((p, t) => goto(p, i, t))
    if (s && !s.config.toolsPersist) { setMemo(''); setPaint('') }
  }

  let body
  if (!s) {
    body = (
      <div className="start" data-testid="start">
        <div className="logo">SKCT 인지검사 연습 시뮬레이터</div>
        <p className="disclaimer">개인 학습용 비공식 시뮬레이터입니다. SK그룹 또는 공식 SKCT 서비스와 무관합니다.</p>
        <div className="opts">
          <label><input type="checkbox" checked={cfg.allowBack ?? false} onChange={(e) => setCfg({ ...cfg, allowBack: e.target.checked })} /> 이전 문항 복귀 허용 (실제 규칙 미확인)</label>
          <label><input type="checkbox" checked={cfg.allowSkip ?? true} onChange={(e) => setCfg({ ...cfg, allowSkip: e.target.checked })} /> 미응답으로 다음 문항 이동 허용</label>
          <label><input type="checkbox" checked={cfg.toolsPersist ?? true} onChange={(e) => setCfg({ ...cfg, toolsPersist: e.target.checked })} /> 문항 이동 시 메모·그림판 유지</label>
        </div>
        {PROFILES.map((p) => {
          const ok = p.sections.every((sec) => QUESTIONS.filter((q) => q.section === sec.id).length >= sec.count)
          return (
            <div className="profile" key={p.id}>
              <button className="btn primary" disabled={!ok} data-testid={`start-${p.id}`} onClick={() => start(p.id)}>{p.name}</button>
              <small>{ok ? p.note : `${p.note} (현재 문제은행 ${QUESTIONS.length}문항 — 부족)`}</small>
            </div>
          )
        })}
        <Dashboard />
        <small className="hint">시작하면 전체화면으로 전환됩니다 (1920×1080 기준 화면을 비례 축소/확대).</small>
      </div>
    )
  } else if (s.phase === 'done') {
    body = <Result s={s} onHome={home} />
  } else if (s.phase === 'break') {
    body = (
      <div className="breakscreen" data-testid="break">
        <h1>{s.sections[s.sectionIdx].name} 영역 준비</h1>
        <p>잠시 후 다음 영역이 시작됩니다.</p>
        <b className="bigtime" data-testid="break-time">{Math.ceil(remainingMs(s, now) / 1000)}</b>
        <button className="btn primary" onClick={() => update((p, t) => ({ ...p, breakDeadline: t }))}>바로 시작</button>
      </div>
    )
  } else {
    body = (
      <ExamScreen
        s={s} now={now} memo={memo} paint={paint} setMemo={setMemo} setPaint={setPaint}
        onSelect={(c) => update((p, t) => select(p, c, t))}
        onGoto={onGoto}
        onFinishSection={() => { update(finishSection); setMemo(''); setPaint('') }}
      />
    )
  }

  return (
    <Stage>
      {body}
      {fsLost && (
        <div className="modal" data-testid="fs-warning">
          <div className="dialog">
            <p>전체화면이 종료되었습니다.</p>
            <p className="sub">시험은 계속 진행 중이며 시간은 멈추지 않습니다. 전체화면으로 다시 진입하세요.</p>
            <button className="btn primary" onClick={() => { enterFs(); setFsLost(false) }}>전체화면 재진입</button>
          </div>
        </div>
      )}
    </Stage>
  )
}
