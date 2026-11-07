import { BANK } from '../data/questions'
import { tagsFor } from '../engine/coach'
import { score } from '../engine/session'
import type { Session } from '../engine/types'

const MARK = ['①', '②', '③', '④', '⑤']

export function Result({ s, onHome }: { s: Session; onHome: () => void }) {
  const r = score(s, BANK)
  return (
    <div className="result" data-testid="result">
      <h1>채점 결과</h1>
      <p className="note">원점수와 연습용 100점 환산은 개인 학습용 지표이며, SKCT 공식 점수·합격 가능성이 아닙니다.</p>
      <div className="sum">
        <div><span>원점수</span><b data-testid="raw">{r.correct} / {r.total}</b></div>
        <div><span>연습용 100점 환산</span><b>{r.practiceScore100}</b></div>
      </div>
      <table className="rt">
        <thead><tr><th>영역</th><th>정답</th><th>오답</th><th>미응답</th><th>평균 풀이(초)</th></tr></thead>
        <tbody>
          {r.sections.map((x) => (
            <tr key={x.name}><td>{x.name}</td><td>{x.correct}</td><td>{x.wrong}</td><td>{x.blank}</td><td>{x.avgSec.toFixed(1)}</td></tr>
          ))}
        </tbody>
      </table>
      <h2>문항별 복기 (검사 종료 후에만 표시)</h2>
      {s.sectionQuestions.flat().map((id) => {
        const q = BANK[id]
        const a = s.answers[id]
        const ok = a === q.answer
        return (
          <details key={id} className={ok ? 'ok' : 'ng'}>
            <summary>
              {id} · {q.subtype} · {a == null ? '미응답' : ok ? '정답' : '오답'} · {((s.timeSpent[id] ?? 0) / 1000).toFixed(1)}초 (목표 {q.targetSec}초) · {tagsFor(q, a, s.timeSpent[id] ?? 0, s.changes[id]).join(', ') || '-'}
            </summary>
            <p>{q.stem}</p>
            <p>내 답: {a == null ? '-' : `${MARK[a]} ${q.choices[a]}`} / 정답: {MARK[q.answer]} {q.choices[q.answer]}</p>
            <p><b>해설</b> {q.explanation}</p>
            <p><b>빠른 풀이</b> {q.fastMethod}</p>
            <p><b>자주 하는 실수</b> {q.commonMistake}</p>
          </details>
        )
      })}
      <button className="btn primary" onClick={onHome}>처음으로</button>
    </div>
  )
}
