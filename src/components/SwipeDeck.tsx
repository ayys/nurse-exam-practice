import { useCallback, useEffect, useRef, useState } from 'react'
import type { SwipeResult, TrueFalseCard } from '../lib/types'

interface SwipeDeckProps {
  cards: TrueFalseCard[]
  onComplete: (result: SwipeResult) => void
  onQuit: () => void
}

type Phase = 'main' | 'retry'
type Feedback = 'correct' | 'wrong' | null

const COMMIT_PX = 110
const MAX_ROTATE = 14

export function SwipeDeck({ cards, onComplete, onQuit }: SwipeDeckProps) {
  const [phase, setPhase] = useState<Phase>('main')
  const [mainIndex, setMainIndex] = useState(0)
  const [retryQueue, setRetryQueue] = useState<TrueFalseCard[]>([])
  const [retryIndex, setRetryIndex] = useState(0)
  const [firstPass, setFirstPass] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const lockedRef = useRef(false)
  const dragXRef = useRef(0)
  const startXRef = useRef(0)
  const firstPassRef = useRef(firstPass)
  const retryQueueRef = useRef(retryQueue)
  firstPassRef.current = firstPass
  retryQueueRef.current = retryQueue
  dragXRef.current = dragX

  const deck = phase === 'main' ? cards : retryQueue
  const index = phase === 'main' ? mainIndex : retryIndex
  const card = deck[index]
  const totalMain = cards.length
  const answeredMain = Object.keys(firstPass).length
  const progress = totalMain === 0 ? 0 : (answeredMain / totalMain) * 100

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const finishWithPass = useCallback(
    (pass: Record<string, boolean>) => {
      const items = cards.map((c) => {
        const correct = pass[c.id] === true
        return { card: c, selected: pass[c.id] !== undefined, correct }
      })
      const score = items.filter((i) => i.correct).length
      const total = items.length
      onComplete({
        score,
        total,
        percent: total === 0 ? 0 : Math.round((score / total) * 100),
        items,
        elapsedSeconds: elapsed,
      })
    },
    [cards, elapsed, onComplete],
  )

  const commit = useCallback(
    (choseTrue: boolean) => {
      if (!card || lockedRef.current || feedback) return
      lockedRef.current = true
      const correct = choseTrue === card.isTrue
      setExitDir(choseTrue ? 'right' : 'left')
      setFeedback(correct ? 'correct' : 'wrong')

      window.setTimeout(() => {
        setFeedback(null)
        setExitDir(null)
        setDragX(0)
        dragXRef.current = 0

        if (phase === 'main') {
          const nextPass = { ...firstPassRef.current, [card.id]: correct }
          firstPassRef.current = nextPass
          setFirstPass(nextPass)

          let nextRetry = retryQueueRef.current
          if (!correct && !nextRetry.some((c) => c.id === card.id)) {
            nextRetry = [...nextRetry, card]
            retryQueueRef.current = nextRetry
            setRetryQueue(nextRetry)
          }

          const next = mainIndex + 1
          if (next >= cards.length) {
            if (nextRetry.length > 0) {
              setPhase('retry')
              setRetryIndex(0)
            } else {
              finishWithPass(nextPass)
            }
          } else {
            setMainIndex(next)
          }
        } else {
          const next = retryIndex + 1
          if (next >= retryQueueRef.current.length) {
            finishWithPass(firstPassRef.current)
          } else {
            setRetryIndex(next)
          }
        }

        lockedRef.current = false
      }, 520)
    },
    [card, feedback, phase, mainIndex, cards.length, retryIndex, finishWithPass],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') commit(true)
      if (e.key === 'ArrowLeft') commit(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commit])

  function onPointerDown(e: React.PointerEvent) {
    if (lockedRef.current || feedback) return
    setDragging(true)
    startXRef.current = e.clientX
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || lockedRef.current) return
    const dx = e.clientX - startXRef.current
    setDragX(dx)
    dragXRef.current = dx
  }

  function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    const dx = dragXRef.current
    if (dx >= COMMIT_PX) commit(true)
    else if (dx <= -COMMIT_PX) commit(false)
    else {
      setDragX(0)
      dragXRef.current = 0
    }
  }

  if (!card) {
    return (
      <div className="panel stack">
        <p>No cards in this deck.</p>
        <button type="button" className="btn btn-secondary" onClick={onQuit}>
          Back home
        </button>
      </div>
    )
  }

  const rotate = Math.max(-MAX_ROTATE, Math.min(MAX_ROTATE, dragX / 18))
  const trueHint = Math.min(1, Math.max(0, dragX / COMMIT_PX))
  const falseHint = Math.min(1, Math.max(0, -dragX / COMMIT_PX))
  const exiting = exitDir !== null
  const transform = exiting ? undefined : `translateX(${dragX}px) rotate(${rotate}deg)`

  return (
    <div className="stack rise swipe-shell">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
            {phase === 'main'
              ? `Card ${Math.min(answeredMain + 1, totalMain)} of ${totalMain}`
              : `Retry ${retryIndex + 1} of ${retryQueue.length}`}
          </p>
          <p className="brand" style={{ margin: 0, fontSize: '1.35rem' }}>
            {phase === 'main' ? 'Swipe True / False' : 'Retry pile'}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onQuit}>
          Quit
        </button>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {phase === 'retry' && (
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          First-pass score is locked. This pass is for practice.
        </p>
      )}

      <div className="swipe-stage">
        <div
          className="swipe-stamp swipe-stamp-true"
          style={{ opacity: exiting && exitDir === 'right' ? 1 : trueHint }}
        >
          TRUE
        </div>
        <div
          className="swipe-stamp swipe-stamp-false"
          style={{ opacity: exiting && exitDir === 'left' ? 1 : falseHint }}
        >
          FALSE
        </div>

        <article
          className={[
            'swipe-card',
            exiting && exitDir === 'right' ? 'swipe-exit-right' : '',
            exiting && exitDir === 'left' ? 'swipe-exit-left' : '',
            feedback === 'correct' ? 'swipe-flash-ok' : '',
            feedback === 'wrong' ? 'swipe-flash-bad' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            transform,
            transition: dragging ? 'none' : 'transform 180ms ease',
            borderColor:
              trueHint > falseHint
                ? `rgba(31, 122, 76, ${0.15 + trueHint * 0.55})`
                : falseHint > 0
                  ? `rgba(194, 59, 90, ${0.15 + falseHint * 0.55})`
                  : undefined,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <p
            className="muted"
            style={{
              margin: 0,
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Statement
          </p>
          <p className="swipe-statement">{card.statement}</p>
          {feedback && (
            <p className={`swipe-feedback ${feedback === 'correct' ? 'ok' : 'bad'}`}>
              {feedback === 'correct' ? 'Correct' : `Wrong — it was ${card.isTrue ? 'True' : 'False'}`}
            </p>
          )}
        </article>
      </div>

      <div className="row swipe-actions">
        <button
          type="button"
          className="btn btn-danger swipe-btn"
          disabled={!!feedback}
          onClick={() => commit(false)}
        >
          False
        </button>
        <button
          type="button"
          className="btn btn-primary swipe-btn"
          disabled={!!feedback}
          onClick={() => commit(true)}
        >
          True
        </button>
      </div>

      <p className="muted" style={{ margin: 0, textAlign: 'center', fontSize: '0.85rem' }}>
        Swipe right for True · left for False (or use buttons / arrow keys)
      </p>
    </div>
  )
}
