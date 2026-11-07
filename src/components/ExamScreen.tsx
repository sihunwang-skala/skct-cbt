import { useState } from 'react'
import { BANK } from '../data/questions'
import { currentId, remainingMs } from '../engine/session'
import type { Session } from '../engine/types'
import { Calculator, Memo, Paint } from './Tools'

const fmt = (ms: number) => {
  const t = Math.ceil(ms / 1000)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
const MARK = ['①', '②', '③', '④', '⑤']

interface Props {
  s: Session
  now: number
  memo: string
  paint: string
  setMemo: (v: string) => void
  setPaint: (v: string) => void
  onSelect: (c: number) => void
  onGoto: (i: number) => void
  onFinishSection: () => void
  onHome: () => void
}

export function ExamScreen({ s, now, memo, paint, setMemo, setPaint, onSelect, onGoto, onFinishSection, onHome }: Props) {
  const [tab, setTab] = useState<'memo' | 'paint'>('memo')
  const [confirm, setConfirm] = useState(false)
  const [homeAsk, setHomeAsk] = useState(false)
  const sec = s.sections[s.sectionIdx]
  const ids = s.sectionQuestions[s.sectionIdx]
  const q = BANK[currentId(s)]
  const rem = remainingMs(s, now)
  const ans = s.answers[q.id]
  const last = s.qIdx === ids.length - 1
  const lastSection = s.sectionIdx === s.sections.length - 1

  return (
    <div className="exam" data-testid="exam">
      <header className="topbar">
        <div className="title">{sec.name}</div>
        <button className="homebtn" data-testid="home" onClick={() => setHomeAsk(true)}>⌂ 처음으로</button>
        <div className="timer">
          남은 시간 <b data-testid="timer" aria-label={fmt(rem)} className={rem < 60000 ? 'warn' : ''}>
            {[...fmt(rem)].map((c, i) => <span key={i} className={c === ':' ? 'colon' : 'dg'}>{c}</span>)}
          </b>
        </div>
      </header>
      <div className="timebar"><i style={{ width: `${(rem / (sec.limitSec * 1000)) * 100}%` }} /></div>

      <main className="main">
        <section className={`qpane ${sec.tools ? '' : 'wide'}`} key={q.id}>
          <div className="qhead">
            <span className="qno" data-testid="qno">{s.qIdx + 1}.</span>
            <span className="qstem">{q.stem}</span>
          </div>
          {q.passage && <div className="passage">{q.passage}</div>}
          {q.conditions && (
            <ul className="conds">{q.conditions.map((c, i) => <li key={i}>{c}</li>)}</ul>
          )}
          {q.image && <img className="qimg" src={`/__private/img/${q.image}`} alt="문제 이미지" />}
          {q.table && (
            <div className="tbl-wrap">
              <div className="tbl-cap"><b>[{q.table.caption}]</b><span>{q.table.unit}</span></div>
              <table>
                <thead><tr>{q.table.header.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{q.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          <ol className="choices">
            {q.choices.map((c, i) => (
              <li key={i}>
                <button
                  data-testid={`choice-${i}`}
                  className={ans === i ? 'sel' : ''}
                  onClick={() => onSelect(i)}
                >
                  <span className="mk">{MARK[i]}</span>{c}
                </button>
              </li>
            ))}
          </ol>
        </section>

        {sec.tools && <aside className="tools">
          <div className="tabs">
            <button className={tab === 'memo' ? 'on' : ''} onClick={() => setTab('memo')} data-testid="tab-memo">메모장</button>
            <button className={tab === 'paint' ? 'on' : ''} onClick={() => setTab('paint')} data-testid="tab-paint">그림판</button>
          </div>
          <div className="tool-body">
            {tab === 'memo' && <Memo value={memo} onChange={setMemo} />}
            {tab === 'paint' && <Paint data={paint} onChange={setPaint} />}
          </div>
          <div className="tool-calc"><Calculator active /></div>
        </aside>}
      </main>

      <footer className="bottombar">
        <div className="chips">
          {ids.map((id, i) => (
            <button
              key={id}
              className={`chip ${i === s.qIdx ? 'cur' : ''} ${s.answers[id] != null ? 'done' : ''}`}
              onClick={() => onGoto(i)}
              disabled={!s.config.allowBack && i !== s.qIdx + 1 && i !== s.qIdx}
            >{i + 1}</button>
          ))}
        </div>
        <div className="nav">
          <button className="btn ghost" data-testid="prev" disabled={!s.config.allowBack || s.qIdx === 0} onClick={() => onGoto(s.qIdx - 1)}>이전</button>
          {last ? (
            <button className="btn primary" data-testid="finish-section" onClick={() => setConfirm(true)}>{lastSection ? '검사 종료' : '다음 영역'}</button>
          ) : (
            <button className="btn primary" data-testid="next" disabled={!s.config.allowSkip && ans == null} onClick={() => onGoto(s.qIdx + 1)}>다음 문항</button>
          )}
        </div>
      </footer>

      {homeAsk && (
        <div className="modal" data-testid="home-confirm">
          <div className="dialog">
            <p>시험을 중단하고 처음 화면으로 돌아갈까요?</p>
            <p className="sub">진행 중인 시험 기록은 저장되지 않고 사라집니다.</p>
            <div className="row">
              <button className="btn ghost" onClick={() => setHomeAsk(false)}>계속 풀기</button>
              <button className="btn primary" data-testid="home-yes" onClick={onHome}>처음으로</button>
            </div>
          </div>
        </div>
      )}
      {confirm && (
        <div className="modal" data-testid="confirm">
          <div className="dialog">
            <p>{lastSection ? '검사를 종료하시겠습니까?' : `${sec.name} 영역을 종료하고 다음 영역으로 이동하시겠습니까?`}</p>
            <p className="sub">이동 후에는 이 영역으로 돌아올 수 없습니다.</p>
            <div className="row">
              <button className="btn ghost" onClick={() => setConfirm(false)}>취소</button>
              <button className="btn primary" data-testid="confirm-yes" onClick={() => { setConfirm(false); onFinishSection() }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
