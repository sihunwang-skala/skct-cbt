export type SectionId = 'verbal' | 'data' | 'math' | 'reasoning' | 'sequence'

export interface TableData {
  caption: string
  header: string[]
  rows: string[][]
  unit?: string
}

export interface Question {
  id: string
  section: SectionId
  subtype: string
  difficulty: 1 | 2 | 3
  targetSec: number
  stem: string
  passage?: string
  conditions?: string[]
  table?: TableData
  choices: [string, string, string, string, string]
  answer: 0 | 1 | 2 | 3 | 4
  explanation: string
  fastMethod: string
  commonMistake: string
  source: string
  /** script = independently verified in src/data/questions.test.ts; manual = author review only */
  /** unverified = 가져오기 직후, 정답 미검증 → 모의고사에서 제외 */
  verification: 'script' | 'manual' | 'unverified'
  /** 비공개 이미지 파일명(private/images/). 표·그래프 등 원본 영역 렌더링용 */
  image?: string
}

export interface SectionSpec {
  id: SectionId
  name: string
  count: number
  limitSec: number
  /** 도구 패널(계산기·메모장·그림판) 표시 여부. 사용자 기억 기준: 언어이해만 도구 없음 → 문제 전체 폭 */
  tools: boolean
}

export interface ExamConfig {
  allowBack: boolean // 이전 문항 복귀 허용 (실제 규칙 미확인 → 설정)
  allowSkip: boolean // 미응답으로 다음 이동 허용
  toolsPersist: boolean // 문항 이동 시 메모/그림판 유지
  breakSec: number // 영역 사이 휴식 (사용자 확인: 1분)
}

export interface ExamProfile {
  id: string
  name: string
  sections: SectionSpec[]
  config: ExamConfig
  note: string
}

export type Phase = 'exam' | 'break' | 'done'

export interface Session {
  id: string
  profileId: string
  sectionQuestions: string[][] // question ids per section
  config: ExamConfig
  sections: SectionSpec[]
  sectionIdx: number
  qIdx: number
  phase: Phase
  deadline: number // ms epoch, section end
  breakDeadline: number
  shownAt: number
  startedAt: number
  finishedAt: number | null
  answers: Record<string, number | null>
  changes: Record<string, number> // 답안 변경 횟수
  timeSpent: Record<string, number> // ms
  selectionSeed?: string // 같은 seed를 입력하면 동일한 문제 순서를 재현
}
