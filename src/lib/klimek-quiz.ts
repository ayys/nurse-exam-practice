import { shuffle } from './exam'

export interface QuizOption {
  key: string
  text: string
}

export interface QuizSource {
  kind: 'open-rn' | 'original'
  work: string
  license?: string
  url?: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: QuizOption[]
  answer: string
  rationale: string
  source: QuizSource
}

export interface LectureQuiz {
  lectureId: string
  title: string
  questions: QuizQuestion[]
}

export interface KlimekQuizBank {
  version: number
  attribution: string
  quizzes: LectureQuiz[]
}

export async function loadKlimekQuizzes(): Promise<KlimekQuizBank> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/klimek-quizzes.json`)
  if (!res.ok) {
    throw new Error(`Failed to load lecture quizzes (${res.status})`)
  }
  return (await res.json()) as KlimekQuizBank
}

export function quizByLecture(bank: KlimekQuizBank, lectureId: string): LectureQuiz | undefined {
  return bank.quizzes.find((q) => q.lectureId === lectureId)
}

export interface NclexQuizConfig {
  lectureId: string
  count: number
}

export function allQuizQuestions(bank: KlimekQuizBank): QuizQuestion[] {
  return bank.quizzes.flatMap((quiz) => quiz.questions)
}

export function buildNclexQuiz(bank: KlimekQuizBank, config: NclexQuizConfig): LectureQuiz | undefined {
  if (config.lectureId === 'all') {
    const pool = allQuizQuestions(bank)
    if (pool.length === 0) return undefined
    const count = Math.min(config.count, pool.length)
    return {
      lectureId: 'all',
      title: 'NCLEX practice',
      questions: shuffle(pool).slice(0, count),
    }
  }
  const quiz = quizByLecture(bank, config.lectureId)
  if (!quiz) return undefined
  const count = Math.min(config.count, quiz.questions.length)
  return {
    ...quiz,
    questions: shuffle(quiz.questions).slice(0, count),
  }
}

const QUIZ_SCORE_KEY = 'tu-nurse-exam:klimek:quiz-scores'

export interface QuizScore {
  score: number
  total: number
  at: number
}

export function getQuizScores(): Record<string, QuizScore> {
  try {
    const raw = localStorage.getItem(QUIZ_SCORE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, QuizScore>) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function formatQuestionForLlm(
  question: QuizQuestion,
  extras?: { topic?: string; picked?: string | null },
): string {
  const lines = [
    'I am studying for NCLEX. Please explain this question in more detail: why the best answer is correct, why the other options are wrong, and any related nursing points I should remember.',
    '',
  ]
  if (extras?.topic) {
    lines.push(`Topic: ${extras.topic}`, '')
  }
  lines.push('Question:', question.prompt, '', 'Options:')
  for (const opt of question.options) {
    lines.push(`${opt.key}. ${opt.text}`)
  }
  if (extras?.picked) {
    lines.push(
      '',
      `My answer: ${extras.picked}`,
      `Quiz answer: ${question.answer}`,
      `Quiz rationale: ${question.rationale}`,
    )
  }
  return lines.join('\n')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

export function saveQuizScore(lectureId: string, score: number, total: number): void {
  if (lectureId === 'all') return
  const all = getQuizScores()
  all[lectureId] = { score, total, at: Date.now() }
  try {
    localStorage.setItem(QUIZ_SCORE_KEY, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}
