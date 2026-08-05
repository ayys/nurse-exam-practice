import type { QuestionBank } from './types'

export async function loadBank(): Promise<QuestionBank> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/questions.json`)
  if (!res.ok) {
    throw new Error(`Failed to load question bank (${res.status})`)
  }
  return (await res.json()) as QuestionBank
}
