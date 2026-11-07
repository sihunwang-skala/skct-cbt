import type { ExamProfile, SectionSpec } from '../engine/types'

// 근거: SK 공식 「SKCT 응시자 안내사항」 인지검사(대졸) 시간표 — 영역당 20문항 15분.
const full: SectionSpec[] = [
  { id: 'verbal', name: '언어이해', count: 20, limitSec: 900, tools: false },
  { id: 'data', name: '자료해석', count: 20, limitSec: 900, tools: true },
  { id: 'math', name: '창의수리', count: 20, limitSec: 900, tools: true },
  { id: 'reasoning', name: '언어추리', count: 20, limitSec: 900, tools: true },
  { id: 'sequence', name: '수열추리', count: 20, limitSec: 900, tools: true },
]

const sampleSections: SectionSpec[] = full.map((s) => ({ ...s, count: 3, limitSec: 240 }))

export const PROFILES: ExamProfile[] = [
  {
    id: 'skct-cognitive-full',
    name: 'SKCT 인지검사 (대졸) · 5영역 100문항 75분',
    sections: full,
    config: { allowBack: false, allowSkip: true, toolsPersist: true, breakSec: 60 },
    note: '공식 시간표 기준. 문제은행이 영역당 20문항 이상 채워져야 활성화됩니다.',
  },
  {
    id: 'skct-sample',
    name: '화면 점검용 샘플 · 5영역 × 3문항',
    sections: sampleSections,
    config: { allowBack: false, allowSkip: true, toolsPersist: true, breakSec: 60 },
    note: '레이아웃·도구·타이머 점검용 축약 프로필(영역당 4분).',
  },
]
