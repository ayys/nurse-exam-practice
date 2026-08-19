import { useEffect, useState } from 'react'
import { congratsForAkshu } from '../lib/congrats'
import { lectureById, nextLectureId } from '../lib/klimek'
import {
  copyText,
  formatQuestionForLlm,
  saveQuizScore,
  type LectureQuiz,
  type QuizQuestion,
  type QuizSource,
} from '../lib/klimek-quiz'

interface KlimekQuizProps {
  quiz: LectureQuiz
  attribution: string
  backLabel: string
  onBack: () => void
  onNextLectureQuiz?: (lectureId: string) => void
}

function sourceLabel(source: QuizSource): string {
  if (source.kind === 'open-rn') {
    const license = source.license ? ` · ${source.license}` : ''
    return `Adapted from Open RN: ${source.work}${license}`
  }
  return source.work
}

export function KlimekQuiz({
  quiz,
  attribution,
  backLabel,
  onBack,
  onNextLectureQuiz,
}: KlimekQuizProps) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setIndex(0)
    setPicked(null)
    setScore(0)
    setDone(false)
  }, [quiz.lectureId, quiz.questions])

  const lecture = lectureById(quiz.lectureId)
  const nextId = quiz.lectureId === 'all' ? null : nextLectureId(quiz.lectureId)
  const nextLecture = nextId ? lectureById(nextId) : undefined
  const total = quiz.questions.length
  const question = quiz.questions[index]
  const percent = total > 0 ? Math.round((score / total) * 100) : 0
  const topic = lecture ? `${lecture.letter}. ${lecture.title}` : quiz.title

  function choose(key: string) {
    if (picked || !question) return
    setPicked(key)
    if (key === question.answer) setScore((s) => s + 1)
  }

  function goNext() {
    if (!picked) return
    if (index >= total - 1) {
      const finalScore = score
      saveQuizScore(quiz.lectureId, finalScore, total)
      setDone(true)
      return
    }
    setIndex((i) => i + 1)
    setPicked(null)
  }

  function retry() {
    setIndex(0)
    setPicked(null)
    setScore(0)
    setDone(false)
  }

  if (total === 0 || !question) {
    return (
      <div className="stack rise study-page">
        <div className="panel stack">
          <p style={{ margin: 0 }}>No questions are available for this quiz yet.</p>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            {backLabel}
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    const congrats = congratsForAkshu(percent)
    return (
      <div className="stack rise study-page">
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
            {lecture ? `Lecture ${lecture.letter} quiz` : quiz.title}
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
            {percent}%
          </p>
          <p style={{ margin: 0, fontSize: '1.15rem' }}>
            {score} of {total} correct
          </p>
          <div className="row" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              {backLabel}
            </button>
            <button type="button" className="btn btn-primary" onClick={retry}>
              Retry quiz
            </button>
            {nextLecture && onNextLectureQuiz && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onNextLectureQuiz(nextLecture.id)}
              >
                Quiz lecture {nextLecture.letter}
              </button>
            )}
          </div>
        </section>
        <p className="muted quiz-source" style={{ margin: 0 }}>
          {attribution}
        </p>
      </div>
    )
  }

  const revealed = Boolean(picked)
  const progress = ((index + (revealed ? 1 : 0)) / total) * 100

  return (
    <div className="stack rise study-page">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          {backLabel}
        </button>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
          {topic}
        </p>
      </div>

      <div>
        <p className="muted" style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
          Question {index + 1} of {total}
        </p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="panel stack quiz-card">
        <div className="row quiz-prompt-row">
          <h2
            className="brand"
            style={{
              fontSize: 'clamp(1.2rem, 3.4vw, 1.55rem)',
              margin: 0,
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            {question.prompt}
          </h2>
          <CopyQuestionButton question={question} topic={topic} picked={picked} />
        </div>
        <div className="stack" style={{ gap: '0.65rem' }}>
          {question.options.map((opt) => (
            <OptionButton
              key={opt.key}
              option={opt}
              question={question}
              picked={picked}
              onChoose={choose}
            />
          ))}
        </div>

        {revealed && (
          <div className="quiz-rationale stack" style={{ gap: '0.45rem' }}>
            <p
              className={picked === question.answer ? 'quiz-feedback ok' : 'quiz-feedback bad'}
              style={{ margin: 0, fontWeight: 700 }}
            >
              {picked === question.answer ? 'Correct' : `Incorrect — answer is ${question.answer}`}
            </p>
            <p style={{ margin: 0 }}>{question.rationale}</p>
            <p className="muted quiz-source" style={{ margin: 0 }}>
              {sourceLabel(question.source)}
              {question.source.url && (
                <>
                  {' · '}
                  <a href={question.source.url} target="_blank" rel="noreferrer">
                    Source
                  </a>
                </>
              )}
            </p>
          </div>
        )}
      </section>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          {attribution}
        </p>
        <button type="button" className="btn btn-primary" disabled={!picked} onClick={goNext}>
          {index >= total - 1 ? 'See score' : 'Next question'}
        </button>
      </div>
    </div>
  )
}

function CopyQuestionButton({
  question,
  topic,
  picked,
}: {
  question: QuizQuestion
  topic: string
  picked: string | null
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [question.id, picked])

  async function copy() {
    const ok = await copyText(
      formatQuestionForLlm(question, { topic, picked }),
    )
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      className="btn btn-secondary copy-question"
      onClick={() => void copy()}
      title="Copy question and options to paste into a chat for more explanation"
    >
      {copied ? 'Copied' : 'Copy question'}
    </button>
  )
}

function OptionButton({
  option,
  question,
  picked,
  onChoose,
}: {
  option: { key: string; text: string }
  question: QuizQuestion
  picked: string | null
  onChoose: (key: string) => void
}) {
  const revealed = Boolean(picked)
  const isPicked = picked === option.key
  const isAnswer = option.key === question.answer
  let state = ''
  if (revealed && isAnswer) state = 'correct'
  else if (revealed && isPicked && !isAnswer) state = 'wrong'
  else if (isPicked) state = 'selected'

  return (
    <button
      type="button"
      className={`option ${state}`.trim()}
      disabled={revealed}
      onClick={() => onChoose(option.key)}
    >
      <span className="option-key">{option.key}.</span>
      <span>{option.text}</span>
    </button>
  )
}
