import type { ExamConfig, ExamResult, Question, QuestionBank } from './types'

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function buildExamQuestions(
  bank: QuestionBank,
  config: ExamConfig,
  retryIds: string[],
): Question[] {
  const usable = bank.questions.filter(
    (q) => q.options.length >= 2 && q.answer,
  )

  if (config.mode === 'retry') {
    const set = new Set(retryIds)
    return shuffle(usable.filter((q) => set.has(q.id)))
  }

  if (config.mode === 'full') {
    const paperQs = usable
      .filter((q) => q.paper === config.paperId)
      .sort((a, b) => a.number - b.number)
    return paperQs
  }

  // practice
  let pool = usable
  if (config.paperId && config.paperId !== 'all') {
    pool = usable.filter((q) => q.paper === config.paperId)
  }
  const count = Math.min(config.count ?? 20, pool.length)
  return shuffle(pool).slice(0, count)
}

export function scoreExam(
  questions: Question[],
  answers: Record<string, string | null>,
  elapsedSeconds: number,
): ExamResult {
  const items = questions.map((question) => {
    const selected = answers[question.id] ?? null
    const correctAnswer = question.answer
    const correct =
      selected != null &&
      correctAnswer != null &&
      selected.toUpperCase() === correctAnswer.toUpperCase()
    return { question, selected, correct, correctAnswer }
  })
  const score = items.filter((i) => i.correct).length
  const total = items.length
  const percent = total === 0 ? 0 : Math.round((score / total) * 100)
  return { score, total, percent, items, elapsedSeconds }
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function sourceLabel(source: string): string {
  switch (source) {
    case 'highlight':
      return 'From highlight'
    case 'key':
      return 'From answer key'
    case 'ai':
      return 'AI best-effort'
    default:
      return 'Unverified'
  }
}
