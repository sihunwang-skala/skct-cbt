import { loadHistory, summarize } from '../engine/coach'

export function Dashboard() {
  const s = summarize(loadHistory())
  if (!s.sessions) return null
  return (
    <div className="dash" data-testid="dashboard">
      <h3>학습 기록 ({s.sessions}회 · {s.total}문항)</h3>
      <div className="dash-row"><span>정답률 <b>{s.accuracy}%</b></span><span>목표시간 내 정답률 <b>{s.inTimeRate}%</b></span><span>최근 추이 {s.trend.join(' → ')}%</span></div>
      <table className="rt"><thead><tr><th>유형 (취약순)</th><th>문항</th><th>정답률</th><th>평균(초)</th></tr></thead>
        <tbody>{s.bySubtype.slice(0, 5).map((r) => <tr key={r.key}><td>{r.key}</td><td>{r.n}</td><td>{r.acc}%</td><td>{r.avgSec}</td></tr>)}</tbody></table>
      <small>{Object.entries(s.tagCount).map(([k, v]) => `${k} ${v}`).join(' · ')} (자동 추정, 확정 원인 아님)</small>
    </div>
  )
}
