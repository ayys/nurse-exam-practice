import type { QuestionBank, TrueFalseBank, TrueFalseCard } from './types'

export async function loadBank(): Promise<QuestionBank> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/questions.json`)
  if (!res.ok) {
    throw new Error(`Failed to load question bank (${res.status})`)
  }
  return (await res.json()) as QuestionBank
}

export async function loadTrueFalseBank(): Promise<TrueFalseBank> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/true-false.json`)
  if (!res.ok) {
    throw new Error(`Failed to load true/false bank (${res.status})`)
  }
  return (await res.json()) as TrueFalseBank
}

export function pickSwipeDeck(cards: TrueFalseCard[], count: number): TrueFalseCard[] {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
