import { useMemo, useState } from 'react'
import {
  LECTURES,
  formatPrettyDuration,
  getAllProgress,
  getLastLectureId,
  isLectureDone,
  lectureById,
  listenedSummary,
  progressRatio,
} from '../lib/klimek'
import { useKlimekPlayer } from '../lib/KlimekPlayer'
import { allQuizQuestions, getQuizScores, type KlimekQuizBank, type NclexQuizConfig } from '../lib/klimek-quiz'
import { getHistory, getRetryIds } from '../lib/storage'
import type { ExamConfig, QuestionBank, SwipeConfig } from '../lib/types'

interface HomeProps {
  bank: QuestionBank
  swipeCount: number
  quizBank: KlimekQuizBank | null
  onStart: (config: ExamConfig) => void
  onStartSwipe: (config: SwipeConfig) => void
  onStartNclex: (config: NclexQuizConfig) => void
  onOpenLectures: () => void
  onOpenPdfs: () => void
}

export function Home({
  bank,
  swipeCount,
  quizBank,
  onStart,
  onStartSwipe,
  onStartNclex,
  onOpenLectures,
  onOpenPdfs,
}: HomeProps) {
  const player = useKlimekPlayer()
  const klimekProgress = getAllProgress()
  const klimekStats = listenedSummary(klimekProgress)
  const lastLecture = lectureById(getLastLectureId() ?? '')
  const lastProg = lastLecture ? klimekProgress[lastLecture.id] : null
  const canResume =
    Boolean(lastLecture && lastProg && lastProg.time > 15 && !isLectureDone(lastProg.time, lastProg.duration || lastLecture.duration))
  const [paperId, setPaperId] = useState(bank.papers[0]?.id ?? '')
  const [practicePaper, setPracticePaper] = useState('all')
  const [count, setCount] = useState(20)
  const [swipeSize, setSwipeSize] = useState(40)
  const [timed, setTimed] = useState(true)
  const [nclexTopic, setNclexTopic] = useState('all')
  const [nclexCount, setNclexCount] = useState(10)
  const retryCount = getRetryIds().length
  const history = useMemo(() => getHistory().slice(0, 5), [])

  const maxPractice = useMemo(() => {
    if (practicePaper === 'all') return bank.questions.filter((q) => q.answer).length
    return bank.questions.filter((q) => q.paper === practicePaper && q.answer).length
  }, [bank, practicePaper])

  const nclexTotal = useMemo(() => {
    if (!quizBank) return 0
    if (nclexTopic === 'all') return allQuizQuestions(quizBank).length
    return quizBank.quizzes.find((q) => q.lectureId === nclexTopic)?.questions.length ?? 0
  }, [quizBank, nclexTopic])
  const nclexScores = getQuizScores()
  const scoredLectures = LECTURES.filter((l) => nclexScores[l.id]).length

  return (
    <div className="stack rise">
      <header className="stack" style={{ gap: '0.5rem', padding: '1.25rem 0 0.5rem' }}>
        <p className="muted" style={{ margin: 0, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
          Past papers · Staff Nurse
        </p>
        <h1 className="brand" style={{ fontSize: 'clamp(2.4rem, 7vw, 3.6rem)', lineHeight: 1.05 }}>
          TU Nurse Exam
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: '36rem', fontSize: '1.05rem' }}>
          Practice from TU Teaching Hospital and Staff Nurse question sets. Score at the end, review every item, and save tough ones for later.
        </p>
      </header>

      <section className="panel stack">
        <div>
          <h2 className="brand" style={{ fontSize: '1.45rem', margin: '0 0 0.25rem' }}>Mark Klimek lectures</h2>
          <p className="muted" style={{ margin: 0 }}>
            {LECTURES.length} audio lectures plus Blue Book, Yellow Book, outlines, and notes.
            {klimekStats.started > 0
              ? ` ${klimekStats.done} finished, ${formatPrettyDuration(klimekStats.seconds)} listened.`
              : ' Resume, speed control, bookmarks, and listen-while-you-read.'}
          </p>
        </div>
        {canResume && lastLecture && lastProg && (
          <button
            type="button"
            className="continue-banner"
            onClick={() => {
              player.load(lastLecture.id, { play: true })
              onOpenLectures()
            }}
          >
            <span>
              Continue {lastLecture.letter}. {lastLecture.title}
              <span className="muted">
                {' '}
                · {Math.round(progressRatio(lastProg.time, lastProg.duration || lastLecture.duration) * 100)}%
              </span>
            </span>
          </button>
        )}
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={onOpenLectures}>
            Open lectures
          </button>
          <button type="button" className="btn btn-secondary" onClick={onOpenPdfs}>
            Open PDFs
          </button>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2 className="brand" style={{ fontSize: '1.45rem', margin: '0 0 0.25rem' }}>Full paper</h2>
          <p className="muted" style={{ margin: 0 }}>One complete set, in order. Default timer 60 minutes.</p>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="paper">Paper</label>
            <select id="paper" value={paperId} onChange={(e) => setPaperId(e.target.value)}>
              {bank.papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.count})
                </option>
              ))}
            </select>
          </div>
          <label className="row" style={{ marginTop: '1.4rem' }}>
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            Timed (60 min)
          </label>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              onStart({
                mode: 'full',
                paperId,
                timed,
                durationMinutes: 60,
              })
            }
          >
            Start full paper
          </button>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2 className="brand" style={{ fontSize: '1.45rem', margin: '0 0 0.25rem' }}>Practice quiz</h2>
          <p className="muted" style={{ margin: 0 }}>Shuffled subset from one paper or the whole bank.</p>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="practice-paper">Source</label>
            <select
              id="practice-paper"
              value={practicePaper}
              onChange={(e) => setPracticePaper(e.target.value)}
            >
              <option value="all">All papers</option>
              {bank.papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="count">Questions</label>
            <select
              id="count"
              value={Math.min(count, maxPractice || 1)}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[10, 20, 30, 50].filter((n) => n <= maxPractice).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              {maxPractice > 0 && ![10, 20, 30, 50].includes(maxPractice) && (
                <option value={maxPractice}>All ({maxPractice})</option>
              )}
            </select>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={maxPractice === 0}
            onClick={() =>
              onStart({
                mode: 'practice',
                paperId: practicePaper,
                count: Math.min(count, maxPractice),
                timed: false,
              })
            }
          >
            Start practice
          </button>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2 className="brand" style={{ fontSize: '1.45rem', margin: '0 0 0.25rem' }}>NCLEX quiz</h2>
          <p className="muted" style={{ margin: 0 }}>
            {quizBank
              ? `Teach-mode items with rationales. ${allQuizQuestions(quizBank).length} questions across ${quizBank.quizzes.length} Klimek topics${
                  scoredLectures > 0
                    ? ` · ${scoredLectures} topic${scoredLectures === 1 ? '' : 's'} scored in this browser`
                    : ''
                }.`
              : 'NCLEX lecture quizzes are still loading.'}
          </p>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="nclex-topic">Topic</label>
            <select
              id="nclex-topic"
              value={nclexTopic}
              onChange={(e) => setNclexTopic(e.target.value)}
              disabled={!quizBank}
            >
              <option value="all">All topics</option>
              {LECTURES.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.letter}. {lecture.title}
                  {nclexScores[lecture.id]
                    ? ` (${nclexScores[lecture.id].score}/${nclexScores[lecture.id].total})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="nclex-count">Questions</label>
            <select
              id="nclex-count"
              value={Math.min(nclexCount, nclexTotal || 1)}
              onChange={(e) => setNclexCount(Number(e.target.value))}
              disabled={nclexTotal === 0}
            >
              {[10, 20, 30, 50]
                .filter((n) => n <= nclexTotal)
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              {nclexTotal > 0 && ![10, 20, 30, 50].includes(nclexTotal) && (
                <option value={nclexTotal}>All ({nclexTotal})</option>
              )}
            </select>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={nclexTotal === 0}
            onClick={() =>
              onStartNclex({
                lectureId: nclexTopic,
                count: Math.min(nclexCount, nclexTotal),
              })
            }
          >
            Start NCLEX quiz
          </button>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2 className="brand" style={{ fontSize: '1.45rem', margin: '0 0 0.25rem' }}>Swipe True / False</h2>
          <p className="muted" style={{ margin: 0 }}>
            Tinder-style practice from the MCQ bank. Right = True, left = False. Missed cards go to a retry pile.
          </p>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="swipe-count">Cards</label>
            <select
              id="swipe-count"
              value={Math.min(swipeSize, swipeCount || 1)}
              onChange={(e) => setSwipeSize(Number(e.target.value))}
              disabled={swipeCount === 0}
            >
              {[20, 40, 80]
                .filter((n) => n < swipeCount)
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              {swipeCount > 0 && (
                <option value={swipeCount}>All ({swipeCount})</option>
              )}
            </select>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={swipeCount === 0}
            onClick={() =>
              onStartSwipe({ count: Math.min(swipeSize, swipeCount) })
            }
          >
            Start swiping
          </button>
        </div>
      </section>

      <section className="panel stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 className="brand" style={{ fontSize: '1.45rem', margin: '0 0 0.25rem' }}>Retry later</h2>
            <p className="muted" style={{ margin: 0 }}>
              {retryCount === 0
                ? 'Mark questions during review to build this list.'
                : `${retryCount} question${retryCount === 1 ? '' : 's'} saved in this browser.`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={retryCount === 0}
            onClick={() => onStart({ mode: 'retry', timed: false })}
          >
            Practice saved
          </button>
        </div>
      </section>

      {history.length > 0 && (
        <section className="panel stack">
          <h2 className="brand" style={{ fontSize: '1.2rem', margin: 0 }}>Recent scores</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {history.map((h, i) => (
              <li key={`${h.at}-${i}`} className="muted">
                {new Date(h.at).toLocaleString()} — {h.score}/{h.total} ({h.percent}%) · {h.mode}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
