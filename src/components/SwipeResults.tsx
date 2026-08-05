import { useState } from 'react'
import type { SwipeResult } from '../lib/types'
import { formatTime } from '../lib/exam'
import { congratsForAkshu } from '../lib/congrats'

interface SwipeResultsProps {
  result: SwipeResult
  onHome: () => void
  onAgain: () => void
}

export function SwipeResults({ result, onHome, onAgain }: SwipeResultsProps) {
  const [congrats] = useState(() => congratsForAkshu(result.percent))
  const missed = result.items.filter((i) => !i.correct)

  return (
    <div className="stack rise">
      <section className="panel stack congrats" style={{ textAlign: 'center' }}>
        <p
          className="muted"
          style={{
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          Swipe results
        </p>
        <h1 className="brand" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', margin: 0 }}>
          {congrats.title}
        </h1>
        <p
          className="congrats-message"
          style={{ margin: 0, fontSize: '1.1rem', maxWidth: '28rem', marginInline: 'auto' }}
        >
          {congrats.message}
        </p>
        <p className="brand" style={{ fontSize: 'clamp(2.5rem, 8vw, 3.8rem)', margin: '0.35rem 0 0' }}>
          {result.percent}%
        </p>
        <p style={{ margin: 0, fontSize: '1.15rem' }}>
          {result.score} of {result.total} correct (first pass)
        </p>
        <p className="muted" style={{ margin: 0 }}>
          Time {formatTime(result.elapsedSeconds)}
        </p>
        <div className="row" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-primary" onClick={onHome}>
            Back home
          </button>
          <button type="button" className="btn btn-secondary" onClick={onAgain}>
            Swipe again
          </button>
        </div>
      </section>

      {missed.length > 0 && (
        <section className="panel stack">
          <h2 className="brand" style={{ fontSize: '1.25rem', margin: 0 }}>
            Missed on first pass ({missed.length})
          </h2>
          <ul className="swipe-missed-list">
            {missed.map((item) => (
              <li key={item.card.id}>
                <span className={`badge ${item.card.isTrue ? 'badge-ok' : 'badge-bad'}`}>
                  {item.card.isTrue ? 'True' : 'False'}
                </span>
                <span>{item.card.statement}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
