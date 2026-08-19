import { useState } from 'react'
import {
  COMPLETE_AT,
  LECTURES,
  PLAYBACK_RATES,
  SKIP_LONG_SECONDS,
  SKIP_SECONDS,
  formatClock,
  formatPrettyDuration,
  getAllProgress,
  getLastLectureId,
  isLectureDone,
  listenedSummary,
  matchesLectureQuery,
  progressRatio,
} from '../lib/klimek'
import { useKlimekPlayer, type SleepMode } from '../lib/KlimekPlayer'
import { SeekBar } from './SeekBar'

interface LecturesProps {
  onBack: () => void
  onOpenPdf: (pdfId: string) => void
}

const SLEEP_OPTIONS: { label: string; value: SleepMode }[] = [
  { label: 'Off', value: { kind: 'off' } },
  { label: '5 min', value: { kind: 'minutes', minutes: 5 } },
  { label: '15 min', value: { kind: 'minutes', minutes: 15 } },
  { label: '30 min', value: { kind: 'minutes', minutes: 30 } },
  { label: '45 min', value: { kind: 'minutes', minutes: 45 } },
  { label: 'End of lecture', value: { kind: 'end' } },
]

function sleepEquals(a: SleepMode, b: SleepMode): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'minutes' && b.kind === 'minutes') return a.minutes === b.minutes
  return true
}

export function Lectures({ onBack, onOpenPdf }: LecturesProps) {
  const player = useKlimekPlayer()
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const progress = getAllProgress()
  const stats = listenedSummary(progress)
  const lastId = getLastLectureId()
  const last = LECTURES.find((l) => l.id === lastId)
  const lastProg = last ? progress[last.id] : null

  const filtered = LECTURES.filter((l) => matchesLectureQuery(l, query))
  const current = player.lecture

  function playLecture(id: string, time?: number) {
    player.load(id, { play: true, time })
  }

  return (
    <div className="stack rise study-page">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Home
        </button>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          Space play/pause · ←/→ 10s · Shift+arrows 30s · [ ] speed · B bookmark
        </p>
      </div>

      <header className="stack" style={{ gap: '0.45rem' }}>
        <p className="muted" style={{ margin: 0, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
          NCLEX review · 12 lectures
        </p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          Mark Klimek
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: '40rem' }}>
          {stats.done} finished · {stats.started} started · {formatPrettyDuration(stats.seconds)} listened
          this browser. Progress and bookmarks stay on this device.
        </p>
      </header>

      {player.error && (
        <div className="panel badge-bad">{player.error}</div>
      )}

      {last && lastProg && lastProg.time > 15 && !isLectureDone(lastProg.time, lastProg.duration || last.duration) && (
        <button
          type="button"
          className="panel continue-banner"
          onClick={() => playLecture(last.id)}
        >
          <span>
            <strong>Continue {last.letter}. {last.title}</strong>
            <span className="muted">
              {' '}
              {formatClock(lastProg.time)} of {formatPrettyDuration(last.duration)} (
              {Math.round(progressRatio(lastProg.time, lastProg.duration || last.duration) * 100)}%)
            </span>
          </span>
          <span className="btn btn-primary" style={{ pointerEvents: 'none' }}>
            Resume
          </span>
        </button>
      )}

      {current && (
        <section className="panel stack player-card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="muted" style={{ margin: 0, fontWeight: 600 }}>
                Now playing
              </p>
              <h2 className="brand" style={{ fontSize: '1.7rem', margin: '0.15rem 0 0.35rem' }}>
                <span className="letter-badge">{current.letter}</span> {current.title}
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                {current.summary}
              </p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => onOpenPdf(current.companionPdf)}>
              Open outlines
            </button>
          </div>

          <SeekBar
            currentTime={player.currentTime}
            duration={player.duration}
            buffered={player.buffered}
            onSeek={player.seek}
          />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">{formatClock(player.currentTime)}</span>
            <span className="muted">−{formatClock(Math.max(0, player.duration - player.currentTime))}</span>
          </div>

          <div className="player-controls">
            <button type="button" className="icon-btn" onClick={player.prev} aria-label="Previous lecture">
              Prev
            </button>
            <button type="button" className="icon-btn" onClick={() => player.skip(-SKIP_LONG_SECONDS)}>
              −30
            </button>
            <button type="button" className="icon-btn" onClick={() => player.skip(-SKIP_SECONDS)}>
              −10
            </button>
            <button type="button" className="icon-btn icon-btn-play" onClick={player.toggle}>
              {player.playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="icon-btn" onClick={() => player.skip(SKIP_SECONDS)}>
              +10
            </button>
            <button type="button" className="icon-btn" onClick={() => player.skip(SKIP_LONG_SECONDS)}>
              +30
            </button>
            <button type="button" className="icon-btn" onClick={player.next} aria-label="Next lecture">
              Next
            </button>
          </div>

          <div className="row player-tools">
            <div className="field">
              <label htmlFor="rate">Speed</label>
              <select
                id="rate"
                value={player.prefs.rate}
                onChange={(e) => player.setRate(Number(e.target.value))}
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}×
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sleep">Sleep timer</label>
              <select
                id="sleep"
                value={
                  player.sleep.kind === 'minutes'
                    ? `m-${player.sleep.minutes}`
                    : player.sleep.kind
                }
                onChange={(e) => {
                  const found = SLEEP_OPTIONS.find((opt) => {
                    if (opt.value.kind === 'minutes') return e.target.value === `m-${opt.value.minutes}`
                    return e.target.value === opt.value.kind
                  })
                  if (found) player.setSleep(found.value)
                }}
              >
                {SLEEP_OPTIONS.map((opt) => (
                  <option
                    key={opt.label}
                    value={opt.value.kind === 'minutes' ? `m-${opt.value.minutes}` : opt.value.kind}
                  >
                    {opt.label}
                    {sleepEquals(player.sleep, opt.value) &&
                    player.sleep.kind === 'minutes' &&
                    player.sleepRemainingMs != null
                      ? ` (${formatClock(player.sleepRemainingMs / 1000)})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="vol">Volume</label>
              <input
                id="vol"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={player.prefs.volume}
                onChange={(e) => player.setVolume(Number(e.target.value))}
              />
            </div>
            <label className="row" style={{ marginTop: '1.4rem' }}>
              <input
                type="checkbox"
                checked={player.prefs.autoplay}
                onChange={(e) => player.setAutoplay(e.target.checked)}
              />
              Autoplay next
            </label>
          </div>

          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault()
              player.bookmark(note)
              setNote('')
            }}
          >
            <div className="field" style={{ flex: 2 }}>
              <label htmlFor="bookmark-note">Bookmark this moment</label>
              <input
                id="bookmark-note"
                value={note}
                placeholder="Optional note, e.g. insulin peaks"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ marginTop: '1.4rem' }}>
              Save at {formatClock(player.currentTime)}
            </button>
          </form>

          {player.bookmarks.length > 0 && (
            <ul className="bookmark-list">
              {player.bookmarks
                .slice()
                .sort((a, b) => a.time - b.time)
                .map((b) => (
                  <li key={b.id}>
                    <button type="button" className="linkish" onClick={() => player.seek(b.time)}>
                      {formatClock(b.time)}
                      {b.note ? ` — ${b.note}` : ''}
                    </button>
                    <button type="button" className="text-btn" onClick={() => player.deleteBookmark(b.id)}>
                      Remove
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      <div className="field">
        <label htmlFor="lecture-search">Find a lecture</label>
        <input
          id="lecture-search"
          value={query}
          placeholder="Acid-base, insulin, OB, labs, delegation…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <ul className="lecture-list">
        {filtered.map((lecture) => {
          const p = progress[lecture.id]
          const time = lecture.id === current?.id ? player.currentTime : p?.time ?? 0
          const dur = lecture.id === current?.id ? player.duration || lecture.duration : p?.duration || lecture.duration
          const ratio = progressRatio(time, dur)
          const done = ratio >= COMPLETE_AT
          const active = current?.id === lecture.id

          return (
            <li key={lecture.id}>
              <button
                type="button"
                className={`lecture-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}
                onClick={() => playLecture(lecture.id)}
              >
                <span className="letter-badge">{lecture.letter}</span>
                <span className="lecture-item-body">
                  <span className="lecture-item-title">
                    {lecture.title}
                    {done && <span className="badge badge-ok">Done</span>}
                    {active && !done && <span className="badge">Playing</span>}
                  </span>
                  <span className="muted lecture-item-meta">
                    {formatPrettyDuration(lecture.duration)}
                    {time > 15 && !done ? ` · ${Math.round(ratio * 100)}%` : ''}
                    {' · '}
                    {lecture.tags.slice(0, 3).join(' · ')}
                  </span>
                  <span className="progress-track lecture-progress">
                    <span className="progress-fill" style={{ width: `${ratio * 100}%` }} />
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="muted">No lectures match that search.</p>
      )}
    </div>
  )
}
