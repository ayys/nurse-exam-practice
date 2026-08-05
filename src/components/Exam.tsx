import { useEffect, useMemo, useRef, useState } from 'react'
import type { ExamConfig, Question } from '../lib/types'
import { formatTime } from '../lib/exam'

interface ExamProps {
  questions: Question[]
  config: ExamConfig
  onSubmit: (answers: Record<string, string | null>, elapsedSeconds: number) => void
  onQuit: () => void
}

export function Exam({ questions, config, onSubmit, onQuit }: ExamProps) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [elapsed, setElapsed] = useState(0)
  const duration = (config.durationMinutes ?? 60) * 60
  const timed = config.timed
  const answersRef = useRef(answers)
  const submittedRef = useRef(false)
  answersRef.current = answers

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!timed || submittedRef.current) return
    if (elapsed >= duration) {
      submittedRef.current = true
      onSubmit(answersRef.current, elapsed)
    }
  }, [elapsed, timed, duration, onSubmit])

  const q = questions[index]
  const answeredCount = useMemo(
    () => questions.filter((item) => answers[item.id]).length,
    [questions, answers],
  )
  const remaining = Math.max(0, duration - elapsed)
  const progress = ((index + 1) / questions.length) * 100

  if (!q) {
    return (
      <div className="panel">
        <p>No questions available for this exam.</p>
        <button type="button" className="btn btn-secondary" onClick={onQuit}>
          Back home
        </button>
      </div>
    )
  }

  return (
    <div className="stack rise">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
            Question {index + 1} of {questions.length}
          </p>
          <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>
            Answered {answeredCount}/{questions.length}
          </p>
        </div>
        <div className="row">
          {timed && (
            <span className={`badge ${remaining < 300 ? 'badge-bad' : ''}`}>
              {formatTime(remaining)}
            </span>
          )}
          {!timed && <span className="badge">{formatTime(elapsed)}</span>}
          <button type="button" className="btn btn-secondary" onClick={onQuit}>
            Quit
          </button>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <section className="panel stack">
        <p style={{ margin: 0, fontSize: '0.8rem' }} className="muted">
          #{q.number} · {q.paper}
        </p>
        <h2
          className="brand"
          style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', margin: 0, fontWeight: 600, lineHeight: 1.35 }}
        >
          {q.prompt}
        </h2>
        <div className="stack" style={{ gap: '0.65rem' }}>
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                className={`option ${selected ? 'selected' : ''}`}
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.key }))}
              >
                <span className="option-key">{opt.key}.</span>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </button>
        <div className="row">
          {index < questions.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onSubmit(answers, elapsed)}
            >
              Submit exam
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
