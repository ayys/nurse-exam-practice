const RETRY_KEY = 'tu-nurse-exam:retry'
const HISTORY_KEY = 'tu-nurse-exam:history'

export function getRetryIds(): string[] {
  try {
    const raw = localStorage.getItem(RETRY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function setRetryIds(ids: string[]): void {
  localStorage.setItem(RETRY_KEY, JSON.stringify([...new Set(ids)]))
}

export function toggleRetry(id: string): string[] {
  const current = getRetryIds()
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  setRetryIds(next)
  return next
}

export function isMarkedRetry(id: string): boolean {
  return getRetryIds().includes(id)
}

export interface HistoryEntry {
  at: string
  mode: string
  paperId?: string
  score: number
  total: number
  percent: number
}

export function pushHistory(entry: HistoryEntry): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const list: HistoryEntry[] = raw ? (JSON.parse(raw) as HistoryEntry[]) : []
    list.unshift(entry)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20)))
  } catch {
    /* ignore quota errors */
  }
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}
