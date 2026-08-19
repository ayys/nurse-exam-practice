import { useEffect, useState, type ReactNode } from 'react'
import { Home } from './components/Home'
import { Exam } from './components/Exam'
import { Results } from './components/Results'
import { SwipeDeck } from './components/SwipeDeck'
import { SwipeResults } from './components/SwipeResults'
import { Lectures } from './components/Lectures'
import { KlimekQuiz } from './components/KlimekQuiz'
import { Pdfs } from './components/Pdfs'
import { MiniPlayer } from './components/MiniPlayer'
import { loadBank, loadTrueFalseBank, pickSwipeDeck } from './lib/bank'
import {
  buildNclexQuiz,
  loadKlimekQuizzes,
  quizByLecture,
  type KlimekQuizBank,
  type LectureQuiz,
  type NclexQuizConfig,
} from './lib/klimek-quiz'
import { buildExamQuestions, scoreExam } from './lib/exam'
import { KlimekPlayerProvider, useKlimekPlayer } from './lib/KlimekPlayer'
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

type Screen =
  | 'home'
  | 'exam'
  | 'results'
  | 'swipe'
  | 'swipe-results'
  | 'lectures'
  | 'pdfs'
  | 'klimek-quiz'

export default function App() {
  return (
    <KlimekPlayerProvider>
      <NurseApp />
    </KlimekPlayerProvider>
  )
}

function NurseApp() {
  const player = useKlimekPlayer()
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
  const [pdfId, setPdfId] = useState<string | undefined>()
  const [quizBank, setQuizBank] = useState<KlimekQuizBank | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<LectureQuiz | null>(null)
  const [quizOrigin, setQuizOrigin] = useState<'home' | 'lectures'>('lectures')

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

  useEffect(() => {
    loadKlimekQuizzes()
      .then(setQuizBank)
      .catch(() => setQuizBank(null))
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

  const showMini = Boolean(player.lecture) && screen !== 'lectures'
  const study = screen === 'lectures' || screen === 'pdfs' || screen === 'klimek-quiz'

  function openPdfs(id?: string) {
    setPdfId(id)
    setScreen('pdfs')
  }

  function openQuiz(lectureId: string) {
    if (!quizBank) return
    const quiz = quizByLecture(quizBank, lectureId)
    if (!quiz) {
      setError('That lecture quiz could not be loaded.')
      return
    }
    setError(null)
    setQuizOrigin('lectures')
    setActiveQuiz(quiz)
    setScreen('klimek-quiz')
  }

  function startNclex(config: NclexQuizConfig) {
    if (!quizBank) return
    const quiz = buildNclexQuiz(quizBank, config)
    if (!quiz || quiz.questions.length === 0) {
      setError('No NCLEX questions available for that selection.')
      return
    }
    setError(null)
    setQuizOrigin('home')
    setActiveQuiz(quiz)
    setScreen('klimek-quiz')
  }

  function closeQuiz() {
    setActiveQuiz(null)
    setScreen(quizOrigin === 'home' ? 'home' : 'lectures')
  }

  function studyShell(children: ReactNode) {
    return (
      <div className={`app-shell${showMini ? ' has-mini-player' : ''}${study ? ' study-shell' : ''}`}>
        {children}
        {showMini && <MiniPlayer onOpenLectures={() => setScreen('lectures')} />}
      </div>
    )
  }

  if (study) {
    return studyShell(
      <>
        {screen === 'lectures' && (
          <Lectures
            onBack={() => setScreen('home')}
            onOpenPdf={(id) => openPdfs(id)}
            onOpenQuiz={quizBank ? openQuiz : undefined}
          />
        )}
        {screen === 'pdfs' && (
          <Pdfs
            key={pdfId ?? 'pdfs'}
            initialId={pdfId}
            onBack={() => setScreen('home')}
            onOpenLectures={() => setScreen('lectures')}
          />
        )}
        {screen === 'klimek-quiz' && activeQuiz && quizBank && (
          <KlimekQuiz
            key={`${activeQuiz.lectureId}:${activeQuiz.questions.map((q) => q.id).join(',')}`}
            quiz={activeQuiz}
            attribution={quizBank.attribution}
            backLabel={quizOrigin === 'home' ? 'Back home' : 'Back to lectures'}
            onBack={closeQuiz}
            onNextLectureQuiz={quizOrigin === 'lectures' ? openQuiz : undefined}
          />
        )}
        {screen === 'klimek-quiz' && !activeQuiz && (
          <div className="stack rise study-page">
            <div className="panel stack">
              <p style={{ margin: 0 }}>This quiz could not be loaded. Lectures still work.</p>
              <button type="button" className="btn btn-secondary" onClick={closeQuiz}>
                {quizOrigin === 'home' ? 'Back home' : 'Back to lectures'}
              </button>
            </div>
          </div>
        )}
      </>,
    )
  }

  if (error && !bank) {
    return studyShell(
      <div className="panel stack">
        <h1 className="brand">TU Nurse Exam</h1>
        <p>{error}</p>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => setScreen('lectures')}>
            Open lectures
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => openPdfs()}>
            Open PDFs
          </button>
        </div>
      </div>,
    )
  }

  if (!bank || !tfBank) {
    return studyShell(
      <div className="stack">
        <div className="panel muted">Loading question bank…</div>
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={() => setScreen('lectures')}>
            Open lectures
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => openPdfs()}>
            Open PDFs
          </button>
        </div>
      </div>,
    )
  }

  return (
    <div className={`app-shell${showMini ? ' has-mini-player' : ''}`}>
      {error && screen === 'home' && (
        <div className="panel badge-bad" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {screen === 'home' && (
        <Home
          bank={bank}
          swipeCount={tfBank.count}
          quizBank={quizBank}
          onStart={startExam}
          onStartSwipe={startSwipe}
          onStartNclex={startNclex}
          onOpenLectures={() => setScreen('lectures')}
          onOpenPdfs={() => openPdfs()}
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
      {showMini && <MiniPlayer onOpenLectures={() => setScreen('lectures')} />}
    </div>
  )
}
