import { useState } from 'react'
import { loadHistory } from '../engine/coach'
import { eligibleQuestions, subtypesFor, type ReviewFilter } from '../engine/selection'
import type { Question, SectionId } from '../engine/types'

const SECTIONS: Array<{ id: SectionId; name: string }> = [
  { id: 'verbal', name: '언어이해' },
  { id: 'data', name: '자료해석' },
  { id: 'math', name: '창의수리' },
  { id: 'reasoning', name: '언어추리' },
  { id: 'sequence', name: '수열추리' },
]

export interface FocusRequest {
  section: SectionId
  subtypes: string[]
  difficulties: Array<1 | 2 | 3>
  review: ReviewFilter
  count: number
  limitSec: number
  seed: string
}

export function FocusSetup({ questions, onStart }: { questions: Question[]; onStart: (request: FocusRequest) => void }) {
  const [section, setSection] = useState<SectionId>('math')
  const [subtypes, setSubtypes] = useState<string[]>([])
  const [difficulties, setDifficulties] = useState<Array<1 | 2 | 3>>([1, 2, 3])
  const [review, setReview] = useState<ReviewFilter>('all')
  const [count, setCount] = useState(20)
  const [minutes, setMinutes] = useState(15)
  const [seed, setSeed] = useState(() => Date.now().toString(36))
  const history = loadHistory()

  const availableSubtypes = subtypesFor(questions, section)
  const available = eligibleQuestions(questions, section, { seed, subtypes, difficulties, review, history }).length

  const changeSection = (id: SectionId) => { setSection(id); setSubtypes([]) }
  const toggleSubtype = (value: string) => setSubtypes((xs) => xs.includes(value) ? xs.filter((x) => x !== value) : [...xs, value])
  const toggleDifficulty = (value: 1 | 2 | 3) => setDifficulties((xs) => xs.includes(value) ? xs.filter((x) => x !== value) : [...xs, value])

  return (
    <section className="focus-setup" aria-label="유형 집중 모드 설정">
      <div className="field">
        <b>1. 영역</b>
        <div className="segmented">
          {SECTIONS.map((x) => <button key={x.id} className={section === x.id ? 'on' : ''} onClick={() => changeSection(x.id)}>{x.name}</button>)}
        </div>
      </div>

      <div className="field">
        <b>2. 세부 유형</b><span className="field-note">선택하지 않으면 전체</span>
        <div className="checks subtype-checks">
          {availableSubtypes.map((x) => <label key={x}><input type="checkbox" checked={subtypes.includes(x)} onChange={() => toggleSubtype(x)} />{x}</label>)}
          {!availableSubtypes.length && <span className="empty">검증된 문제가 없습니다.</span>}
        </div>
      </div>

      <div className="focus-grid">
        <div className="field">
          <b>3. 난도</b>
          <div className="checks inline">
            {([1, 2, 3] as const).map((x) => <label key={x}><input type="checkbox" checked={difficulties.includes(x)} onChange={() => toggleDifficulty(x)} />{x}</label>)}
          </div>
        </div>
        <label className="field"><b>4. 학습 상태</b>
          <select value={review} onChange={(e) => setReview(e.target.value as ReviewFilter)}>
            <option value="all">전체</option><option value="unseen">미풀이</option><option value="wrong">최근 오답</option><option value="slow">최근 시간 초과</option>
          </select>
        </label>
        <label className="field"><b>5. 문항 수</b><input data-testid="focus-count" type="number" min="1" max="100" value={count} onChange={(e) => setCount(Math.max(1, +e.target.value || 1))} /></label>
        <label className="field"><b>6. 제한시간</b><span className="number-unit"><input type="number" min="1" max="120" value={minutes} onChange={(e) => setMinutes(Math.max(1, +e.target.value || 1))} />분</span></label>
      </div>

      <div className="seed-row">
        <label><b>Random Seed</b><input data-testid="focus-seed" value={seed} onChange={(e) => setSeed(e.target.value)} /></label>
        <button className="btn small" onClick={() => setSeed(Date.now().toString(36))}>새 조합</button>
        <span>동일한 Seed는 동일한 문제 순서를 만듭니다.</span>
      </div>

      <div className="focus-action">
        <span>조건에 맞는 검증 문항 <b data-testid="focus-available">{available}</b>개</span>
        <button
          className="btn primary"
          data-testid="start-focus"
          disabled={!available || !difficulties.length}
          onClick={() => onStart({ section, subtypes, difficulties, review, count: Math.min(count, available), limitSec: minutes * 60, seed: seed || 'default' })}
        >랜덤 훈련 시작</button>
      </div>
    </section>
  )
}
