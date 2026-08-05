import { useState } from 'react'
import type { ExamResult } from '../lib/types'
import { formatTime, sourceLabel } from '../lib/exam'
import { congratsForAkshu } from '../lib/congrats'
import { isMarkedRetry, toggleRetry } from '../lib/storage'

interface ResultsProps {
  result: ExamResult
  onRetryWrong: () => void
  onHome: () => void
}

export function Results({ result, onRetryWrong, onHome }: ResultsProps) {
  const [retryIds, setRetryIds] = useState(() =>
    result.items.map((i) => i.question.id).filter((id) => isMarkedRetry(id)),
  )
  const [congrats] = useState(() => congratsForAkshu(result.percent))

  const wrongCount = result.items.filter((i) => !i.correct).length

  return (
    <div className="stack rise">
      <section className="panel stack congrats" style={{ textAlign: 'center' }}>
        <p className="muted" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem', fontWeight: 600 }}>
          Results
        </p>
        <h1 className="brand" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', margin: 0 }}>
          {congrats.title}
        </h1>
        <p className="congrats-message" style={{ margin: 0, fontSize: '1.1rem', maxWidth: '28rem', marginInline: 'auto' }}>
          {congrats.message}
        </p>
        <p className="brand" style={{ fontSize: 'clamp(2.5rem, 8vw, 3.8rem)', margin: '0.35rem 0 0' }}>
          {result.percent}%
        </p>
        <p style={{ margin: 0, fontSize: '1.15rem' }}>
          {result.score} of {result.total} correct
        </p>
        <p className="muted" style={{ margin: 0 }}>
          Time {formatTime(result.elapsedSeconds)}
        </p>
        <div className="row" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-primary" onClick={onHome}>
            Back home
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={wrongCount === 0}
            onClick={onRetryWrong}
          >
            Retry missed ({wrongCount})
          </button>
        </div>
      </section>

      <section className="stack">
        {result.items.map((item, idx) => {
          const marked = retryIds.includes(item.question.id)
          return (
            <article key={item.question.id} className="panel stack" style={{ gap: '0.65rem' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="row">
                  <span className={`badge ${item.correct ? 'badge-ok' : 'badge-bad'}`}>
                    {item.correct ? 'Correct' : 'Incorrect'}
                  </span>
                  <span
                    className={`badge ${item.question.answerSource === 'ai' ? 'badge-ai' : ''}`}
                  >
                    {sourceLabel(item.question.answerSource)}
                  </span>
                </div>
                <button
                  type="button"
                  className={`btn ${marked ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  onClick={() => setRetryIds(toggleRetry(item.question.id))}
                >
                  {marked ? 'Saved for retry' : 'Retry later'}
                </button>
              </div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600 }}>
                {idx + 1}. {item.question.prompt}
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {item.question.options.map((opt) => {
                  const isCorrect = opt.key === item.correctAnswer
                  const isSelected = opt.key === item.selected
                  return (
                    <li
                      key={opt.key}
                      style={{
                        marginBottom: '0.25rem',
                        fontWeight: isCorrect || isSelected ? 600 : 400,
                        color: isCorrect ? 'var(--ok)' : isSelected ? 'var(--bad)' : undefined,
                      }}
                    >
                      {opt.key}. {opt.text}
                      {isCorrect ? ' ✓' : ''}
                      {isSelected && !isCorrect ? ' (yours)' : ''}
                    </li>
                  )
                })}
              </ul>
              {!item.selected && <p className="muted" style={{ margin: 0 }}>No answer selected.</p>}
            </article>
          )
        })}
      </section>
    </div>
  )
}
