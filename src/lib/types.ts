export type AnswerSource = 'highlight' | 'key' | 'ai' | 'unknown'

export interface Option {
  key: string
  text: string
}

export interface Question {
  id: string
  paper: string
  number: number
  prompt: string
  options: Option[]
  answer: string | null
  answerSource: AnswerSource
}

export interface PaperMeta {
  id: string
  title: string
  count: number
}

export interface QuestionBank {
  version: number
  papers: PaperMeta[]
  questions: Question[]
}

export type ExamMode = 'full' | 'practice' | 'retry' | 'swipe'

export interface ExamConfig {
  mode: ExamMode
  paperId?: string
  count?: number
  timed: boolean
  durationMinutes?: number
}

export interface TrueFalseCard {
  id: string
  statement: string
  isTrue: boolean
  sourceQuestionId: string
  paper: string
}

export interface TrueFalseBank {
  version: number
  count: number
  cards: TrueFalseCard[]
}

export interface SwipeConfig {
  count: number
}

export interface SwipeResultItem {
  card: TrueFalseCard
  selected: boolean
  correct: boolean
}

export interface SwipeResult {
  score: number
  total: number
  percent: number
  items: SwipeResultItem[]
  elapsedSeconds: number
}

export interface ExamAnswer {
  questionId: string
  selected: string | null
}

export interface ExamResultItem {
  question: Question
  selected: string | null
  correct: boolean
  correctAnswer: string | null
}

export interface ExamResult {
  score: number
  total: number
  percent: number
  items: ExamResultItem[]
  elapsedSeconds: number
}
