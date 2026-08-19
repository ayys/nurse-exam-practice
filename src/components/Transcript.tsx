import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../lib/klimek'
import { searchCues, type Cue } from '../lib/vtt'

interface TranscriptProps {
  cues: Cue[]
  activeIndex: number
  onSeek: (time: number) => void
}

export function Transcript({ cues, activeIndex, onSeek }: TranscriptProps) {
  const [filter, setFilter] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const filtered = filter.trim().length >= 2 ? searchCues(cues, filter) : cues

  useEffect(() => {
    if (filter.trim()) return
    const node = listRef.current?.querySelector('[data-active="true"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, filter])

  if (cues.length === 0) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        Timed captions for this lecture are not ready yet. They appear here as soon as the transcript file is available.
      </p>
    )
  }

  return (
    <div className="stack transcript">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>Transcript</strong>
        <span className="muted">{cues.length} lines</span>
      </div>
      <input
        value={filter}
        placeholder="Search this lecture…"
        aria-label="Search transcript"
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="transcript-list" ref={listRef}>
        {filtered.map((cue) => {
          const i = cues.indexOf(cue)
          const active = i === activeIndex
          return (
            <button
              key={`${cue.start}-${cue.text.slice(0, 24)}`}
              type="button"
              className={`transcript-cue${active ? ' active' : ''}`}
              data-active={active ? 'true' : 'false'}
              onClick={() => onSeek(cue.start)}
            >
              <span className="muted">{formatClock(cue.start)}</span>
              <span>{cue.text}</span>
            </button>
          )
        })}
        {filtered.length === 0 && <p className="muted">No lines match that search.</p>}
      </div>
    </div>
  )
}
