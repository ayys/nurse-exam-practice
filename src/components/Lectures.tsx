import { useEffect, useState } from 'react'
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
  mediaUrl,
  progressRatio,
  vttFile,
} from '../lib/klimek'
import { useKlimekPlayer, type SleepMode } from '../lib/KlimekPlayer'
import { getQuizScores } from '../lib/klimek-quiz'
import { parseVtt, searchCues, type Cue } from '../lib/vtt'
import { SeekBar } from './SeekBar'
import { Transcript } from './Transcript'

interface LecturesProps {
  onBack: () => void
  onOpenPdf: (pdfId: string) => void
  onOpenQuiz?: (lectureId: string) => void
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

export function Lectures({ onBack, onOpenPdf, onOpenQuiz }: LecturesProps) {
  const player = useKlimekPlayer()
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [transcripts, setTranscripts] = useState<Record<string, Cue[]>>({})
  const progress = getAllProgress()
  const stats = listenedSummary(progress)
  const lastId = getLastLectureId()
  const last = LECTURES.find((l) => l.id === lastId)
  const lastProg = last ? progress[last.id] : null
  const quizScores = getQuizScores()
  const current = player.lecture

  const filtered = LECTURES.filter((l) => {
    if (matchesLectureQuery(l, query)) return true
    if (query.trim().length < 3) return false
    const cues = l.id === current?.id ? player.cues : transcripts[l.id] ?? []
    return searchCues(cues, query).length > 0
  })
  const activeCue = player.cueIndex >= 0 ? player.cues[player.cueIndex] : null
  const captionHits = query.trim().length >= 3
    ? LECTURES.flatMap((lecture) => {
        const cues = lecture.id === current?.id ? player.cues : transcripts[lecture.id] ?? []
        return searchCues(cues, query).slice(0, 4).map((cue) => ({ lecture, cue }))
      }).slice(0, 12)
    : []

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      LECTURES.map(async (lecture) => {
        try {
          const res = await fetch(mediaUrl(vttFile(lecture.file)))
          if (!res.ok) return [lecture.id, [] as Cue[]] as const
          return [lecture.id, parseVtt(await res.text())] as const
        } catch {
          return [lecture.id, [] as Cue[]] as const
        }
      }),
    ).then((entries) => {
      if (!cancelled) setTranscripts(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [])

  function playLecture(id: string, time?: number) {
    if (player.lecture?.id === id && time != null) {
      player.seek(time)
      return
    }
    player.load(id, { play: true, time })
  }

  return (
    <div className="stack rise study-page">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Home
        </button>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          Space play/pause · ←/→ 10s · [ ] speed · C captions · B bookmark
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
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              {onOpenQuiz && (
                <button type="button" className="btn btn-primary" onClick={() => onOpenQuiz(current.id)}>
                  Quiz this lecture
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => onOpenPdf(current.companionPdf)}>
                Open outlines
              </button>
            </div>
          </div>
          {quizScores[current.id] && (
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              Last quiz: {quizScores[current.id].score}/{quizScores[current.id].total}
            </p>
          )}

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
            <label className="row" style={{ marginTop: '1.4rem' }}>
              <input
                type="checkbox"
                checked={player.prefs.captions}
                onChange={(e) => player.setCaptions(e.target.checked)}
              />
              Captions
            </label>
          </div>

          {player.prefs.captions && activeCue && (
            <p className="caption-line" aria-live="polite">
              {activeCue.text}
            </p>
          )}

          <Transcript cues={player.cues} activeIndex={player.cueIndex} onSeek={player.seek} />

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
          placeholder="Acid-base, insulin, OB, labs, delegation… also searches captions"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {captionHits.length > 0 && (
        <section className="panel stack">
          <h2 className="brand" style={{ fontSize: '1.2rem', margin: 0 }}>
            In the lectures
          </h2>
          <ul className="caption-hits">
            {captionHits.map(({ lecture, cue }) => (
              <li key={`${lecture.id}-${cue.start}-${cue.text.slice(0, 18)}`}>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => playLecture(lecture.id, cue.start)}
                >
                  {lecture.letter}. {lecture.title} · {formatClock(cue.start)}
                  <span className="muted"> — {cue.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="lecture-list">
        {filtered.map((lecture) => {
          const p = progress[lecture.id]
          const time = lecture.id === current?.id ? player.currentTime : p?.time ?? 0
          const dur = lecture.id === current?.id ? player.duration || lecture.duration : p?.duration || lecture.duration
          const ratio = progressRatio(time, dur)
          const done = ratio >= COMPLETE_AT
          const active = current?.id === lecture.id

          const quizScore = quizScores[lecture.id]

          return (
            <li key={lecture.id} className="lecture-row">
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
                    {quizScore && (
                      <span className="badge">Quiz {quizScore.score}/{quizScore.total}</span>
                    )}
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
              {onOpenQuiz && (
                <button
                  type="button"
                  className="btn btn-secondary lecture-quiz-btn"
                  onClick={() => onOpenQuiz(lecture.id)}
                >
                  Quiz this lecture
                </button>
              )}
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
