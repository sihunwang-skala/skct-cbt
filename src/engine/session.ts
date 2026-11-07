import type { ExamProfile, Question, Session } from './types'

// 모든 시간 로직은 now(ms)를 인자로 받는 순수 함수 → 렌더링 주기와 무관, 테스트 가능.

export function createSession(profile: ExamProfile, bank: Question[], now: number): Session {
  const sectionQuestions = profile.sections.map((sec) =>
    bank.filter((q) => q.section === sec.id && q.verification !== undefined).slice(0, sec.count).map((q) => q.id),
  )
  return {
    id: `s${now}`,
    profileId: profile.id,
    sectionQuestions,
    config: { ...profile.config },
    sections: profile.sections,
    sectionIdx: 0,
    qIdx: 0,
    phase: 'exam',
    deadline: now + profile.sections[0].limitSec * 1000,
    breakDeadline: 0,
    shownAt: now,
    startedAt: now,
    finishedAt: null,
    answers: {},
    changes: {},
    timeSpent: {},
  }
}

export const currentId = (s: Session) => s.sectionQuestions[s.sectionIdx][s.qIdx]
export const remainingMs = (s: Session, now: number) =>
  Math.max(0, (s.phase === 'break' ? s.breakDeadline : s.deadline) - now)

function leave(s: Session, at: number): Session {
  if (s.phase !== 'exam') return s
  const id = currentId(s)
  return { ...s, timeSpent: { ...s.timeSpent, [id]: (s.timeSpent[id] ?? 0) + Math.max(0, at - s.shownAt) }, shownAt: at }
}

function startSection(s: Session, i: number, at: number): Session {
  return { ...s, phase: 'exam', sectionIdx: i, qIdx: 0, deadline: at + s.sections[i].limitSec * 1000, shownAt: at }
}

export function finishSection(s: Session, at: number): Session {
  if (s.phase !== 'exam') return s
  const l = leave(s, at)
  const next = l.sectionIdx + 1
  if (next >= l.sections.length) return { ...l, phase: 'done', finishedAt: at }
  if (l.config.breakSec > 0) return { ...l, phase: 'break', breakDeadline: at + l.config.breakSec * 1000, sectionIdx: next, qIdx: 0 }
  return startSection(l, next, at)
}

export function select(s: Session, choice: number, now: number): Session {
  if (s.phase !== 'exam' || now >= s.deadline) return s
  const id = currentId(s)
  if (s.answers[id] === choice) return s
  const changed = s.answers[id] != null
  return {
    ...s,
    answers: { ...s.answers, [id]: choice },
    changes: changed ? { ...s.changes, [id]: (s.changes[id] ?? 0) + 1 } : s.changes,
  }
}

export function goto(s: Session, idx: number, now: number): Session {
  if (s.phase !== 'exam' || now >= s.deadline) return s
  const n = s.sectionQuestions[s.sectionIdx].length
  if (idx < 0 || idx >= n || idx === s.qIdx) return s
  if (idx < s.qIdx && !s.config.allowBack) return s
  if (idx > s.qIdx && !s.config.allowBack && idx !== s.qIdx + 1) return s
  if (idx > s.qIdx && !s.config.allowSkip && s.answers[currentId(s)] == null) return s
  return { ...leave(s, now), qIdx: idx }
}

export function tick(s: Session, now: number): Session {
  if (s.phase === 'exam' && now >= s.deadline) return finishSection(s, s.deadline)
  if (s.phase === 'break' && now >= s.breakDeadline) return startSection(s, s.sectionIdx, s.breakDeadline)
  return s
}

/** 새로고침 복구: 화면이 닫혀 있던 시간은 문항 시간에 포함하지 않고, 마감 시각은 유지 */
export function resume(s: Session, now: number): Session {
  const t = s.phase === 'exam' ? { ...s, shownAt: Math.min(now, s.deadline) } : s
  let cur = t
  // 닫혀 있는 동안 여러 영역이 지났을 수 있으므로 반복 처리
  for (let i = 0; i < 20; i++) {
    const nx = tick(cur, now)
    if (nx === cur) break
    cur = nx
  }
  return cur
}

export interface SectionResult { name: string; total: number; correct: number; wrong: number; blank: number; avgSec: number }

export function score(s: Session, bank: Record<string, Question>) {
  const sections: SectionResult[] = s.sections.map((sec, i) => {
    const ids = s.sectionQuestions[i]
    let correct = 0, blank = 0, ms = 0
    for (const id of ids) {
      const a = s.answers[id]
      if (a == null) blank++
      else if (a === bank[id].answer) correct++
      ms += s.timeSpent[id] ?? 0
    }
    return { name: sec.name, total: ids.length, correct, blank, wrong: ids.length - correct - blank, avgSec: ids.length ? ms / ids.length / 1000 : 0 }
  })
  const total = sections.reduce((a, b) => a + b.total, 0)
  const correct = sections.reduce((a, b) => a + b.correct, 0)
  // 연습용 환산(정답률×100). 공식 채점 방식은 비공개/미확인 → 공식 점수 아님.
  return { sections, total, correct, practiceScore100: total ? Math.round((correct / total) * 1000) / 10 : 0 }
}
