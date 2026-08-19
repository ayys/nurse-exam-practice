export interface Cue {
  start: number
  end: number
  text: string
}

function parseClock(raw: string): number {
  const parts = raw.trim().replace(',', '.').split(':')
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2])
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1])
  }
  return Number(parts[0]) || 0
}

export function parseVtt(raw: string): Cue[] {
  const cues: Cue[] = []
  const blocks = raw.replace(/^\uFEFF/, '').split(/\r?\n\r?\n/)
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((line) => line.trim() !== '')
    const timing = lines.find((line) => line.includes('-->'))
    if (!timing) continue
    const [startRaw, endRaw] = timing.split('-->')
    const start = parseClock(startRaw)
    const end = parseClock((endRaw ?? '').trim().split(/\s+/)[0] ?? '')
    const text = lines
      .slice(lines.indexOf(timing) + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
    cues.push({ start, end, text })
  }
  return cues
}

export function cueIndexAt(cues: Cue[], time: number): number {
  let lo = 0
  let hi = cues.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (cues[mid].start <= time) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  if (ans >= 0 && time < cues[ans].end) return ans
  return -1
}

export function cueAt(cues: Cue[], time: number): Cue | null {
  const i = cueIndexAt(cues, time)
  return i >= 0 ? cues[i] : null
}

export function searchCues(cues: Cue[], query: string): Cue[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return cues.filter((cue) => cue.text.toLowerCase().includes(q))
}
