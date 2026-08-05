import { useEffect, useState } from 'react'
import { Home } from './components/Home'
import { Exam } from './components/Exam'
import { Results } from './components/Results'
import { SwipeDeck } from './components/SwipeDeck'
import { SwipeResults } from './components/SwipeResults'
import { loadBank, loadTrueFalseBank, pickSwipeDeck } from './lib/bank'
import { buildExamQuestions, scoreExam } from './lib/exam'
import { getRetryIds, pushHistory, setRetryIds } from './lib/storage'
import type {
  ExamConfig,
  ExamResult,
  Question,
  QuestionBank,
  SwipeConfig,
  SwipeResult,
  TrueFalseBank,
  TrueFalseCard,
} from './lib/types'

type Screen = 'home' | 'exam' | 'results' | 'swipe' | 'swipe-results'

export default function App() {
  const [bank, setBank] = useState<QuestionBank | null>(null)
  const [tfBank, setTfBank] = useState<TrueFalseBank | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>('home')
  const [config, setConfig] = useState<ExamConfig | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [result, setResult] = useState<ExamResult | null>(null)
  const [swipeCards, setSwipeCards] = useState<TrueFalseCard[]>([])
  const [swipeConfig, setSwipeConfig] = useState<SwipeConfig | null>(null)
  const [swipeResult, setSwipeResult] = useState<SwipeResult | null>(null)

  useEffect(() => {
    Promise.all([loadBank(), loadTrueFalseBank()])
      .then(([mcq, tf]) => {
        setBank(mcq)
        setTfBank(tf)
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load questions'),
      )
  }, [])

  function startExam(next: ExamConfig) {
    if (!bank) return
    const qs = buildExamQuestions(bank, next, getRetryIds())
    if (qs.length === 0) {
      setError('No questions available for that selection.')
      return
    }
    setError(null)
    setConfig(next)
    setQuestions(qs)
    setResult(null)
    setScreen('exam')
  }

  function startSwipe(next: SwipeConfig) {
    if (!tfBank) return
    const deck = pickSwipeDeck(tfBank.cards, next.count)
    if (deck.length === 0) {
      setError('No true/false cards available.')
      return
    }
    setError(null)
    setSwipeConfig(next)
    setSwipeCards(deck)
    setSwipeResult(null)
    setScreen('swipe')
  }

  function handleSubmit(answers: Record<string, string | null>, elapsedSeconds: number) {
    if (!config) return
    const scored = scoreExam(questions, answers, elapsedSeconds)
    setResult(scored)
    pushHistory({
      at: new Date().toISOString(),
      mode: config.mode,
      paperId: config.paperId,
      score: scored.score,
      total: scored.total,
      percent: scored.percent,
    })
    setScreen('results')
  }

  function handleSwipeComplete(scored: SwipeResult) {
    setSwipeResult(scored)
    pushHistory({
      at: new Date().toISOString(),
      mode: 'swipe',
      score: scored.score,
      total: scored.total,
      percent: scored.percent,
    })
    setScreen('swipe-results')
  }

  function retryWrong() {
    if (!result) return
    const wrong = result.items.filter((i) => !i.correct).map((i) => i.question.id)
    setRetryIds([...new Set([...getRetryIds(), ...wrong])])
    startExam({ mode: 'retry', timed: false })
  }

  if (error && !bank) {
    return (
      <div className="app-shell">
        <div className="panel">
          <h1 className="brand">TU Nurse Exam</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!bank || !tfBank) {
    return (
      <div className="app-shell">
        <div className="panel muted">Loading question bank…</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {error && screen === 'home' && (
        <div className="panel badge-bad" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {screen === 'home' && (
        <Home
          bank={bank}
          swipeCount={tfBank.count}
          onStart={startExam}
          onStartSwipe={startSwipe}
        />
      )}
      {screen === 'exam' && config && (
        <Exam
          questions={questions}
          config={config}
          onSubmit={handleSubmit}
          onQuit={() => setScreen('home')}
        />
      )}
      {screen === 'results' && result && (
        <Results result={result} onHome={() => setScreen('home')} onRetryWrong={retryWrong} />
      )}
      {screen === 'swipe' && (
        <SwipeDeck
          key={swipeCards.map((c) => c.id).join('|')}
          cards={swipeCards}
          onComplete={handleSwipeComplete}
          onQuit={() => setScreen('home')}
        />
      )}
      {screen === 'swipe-results' && swipeResult && (
        <SwipeResults
          result={swipeResult}
          onHome={() => setScreen('home')}
          onAgain={() => startSwipe(swipeConfig ?? { count: 40 })}
        />
      )}
    </div>
  )
}
