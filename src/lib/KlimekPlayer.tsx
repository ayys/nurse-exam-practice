import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  addBookmark,
  getBookmarks,
  getPrefs,
  getProgress,
  lectureById,
  mediaUrl,
  nextLectureId,
  prevLectureId,
  removeBookmark,
  savePrefs,
  saveProgress,
  setLastLectureId,
  vttFile,
  type Bookmark,
  type Lecture,
  type PlayerPrefs,
} from './klimek'
import { cueIndexAt, parseVtt, type Cue } from './vtt'

export type SleepMode = { kind: 'off' } | { kind: 'minutes'; minutes: number } | { kind: 'end' }

interface BufferedRange {
  start: number
  end: number
}

interface PlayerValue {
  lecture: Lecture | null
  playing: boolean
  currentTime: number
  duration: number
  buffered: BufferedRange[]
  prefs: PlayerPrefs
  sleep: SleepMode
  sleepRemainingMs: number | null
  bookmarks: Bookmark[]
  error: string | null
  cues: Cue[]
  cueIndex: number
  load: (id: string, opts?: { play?: boolean; time?: number }) => void
  toggle: () => void
  pause: () => void
  seek: (time: number) => void
  skip: (delta: number) => void
  setRate: (rate: number) => void
  setVolume: (volume: number) => void
  setAutoplay: (autoplay: boolean) => void
  setCaptions: (captions: boolean) => void
  setSleep: (sleep: SleepMode) => void
  next: () => void
  prev: () => void
  bookmark: (note?: string) => void
  deleteBookmark: (id: string) => void
}

const KlimekPlayerContext = createContext<PlayerValue | null>(null)

function readRanges(audio: HTMLAudioElement): BufferedRange[] {
  const ranges: BufferedRange[] = []
  const { buffered } = audio
  for (let i = 0; i < buffered.length; i += 1) {
    ranges.push({ start: buffered.start(i), end: buffered.end(i) })
  }
  return ranges
}

export function KlimekPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lectureIdRef = useRef<string | null>(null)
  const prefsRef = useRef(getPrefs())
  const sleepRef = useRef<SleepMode>({ kind: 'off' })
  const sleepUntilRef = useRef<number | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState<BufferedRange[]>([])
  const [prefs, setPrefs] = useState<PlayerPrefs>(prefsRef.current)
  const [sleep, setSleepState] = useState<SleepMode>({ kind: 'off' })
  const [sleepRemainingMs, setSleepRemainingMs] = useState<number | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cues, setCues] = useState<Cue[]>([])

  const persistProgress = useCallback(() => {
    const audio = audioRef.current
    const id = lectureIdRef.current
    if (!audio || !id) return
    const dur = Number.isFinite(audio.duration) ? audio.duration : 0
    saveProgress(id, audio.currentTime, dur)
  }, [])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current != null) return
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null
      persistProgress()
    }, 1500)
  }, [persistProgress])

  const applyMediaSession = useCallback((item: Lecture | null, isPlaying: boolean) => {
    if (!('mediaSession' in navigator)) return
    if (!item) {
      navigator.mediaSession.metadata = null
      return
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${item.letter}. ${item.title}`,
      artist: 'Mark Klimek',
      album: 'NCLEX Review Lectures',
    })
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [])

  const load = useCallback(
    (id: string, opts?: { play?: boolean; time?: number }) => {
      const audio = audioRef.current
      const item = lectureById(id)
      if (!audio || !item) return

      lectureIdRef.current = id
      setLecture(item)
      setLastLectureId(id)
      setBookmarks(getBookmarks(id))
      setPlaying(false)
      setError(null)
      setCues([])

      const saved = getProgress(id)
      const resume =
        opts?.time ??
        (saved && saved.time > 8 && saved.time < item.duration * 0.97 ? saved.time : 0)

      const onMeta = () => {
        audio.playbackRate = prefsRef.current.rate
        audio.volume = prefsRef.current.volume
        if (resume > 0 && resume < audio.duration) audio.currentTime = resume
        setDuration(Number.isFinite(audio.duration) ? audio.duration : item.duration)
        setCurrentTime(audio.currentTime)
        setBuffered(readRanges(audio))
        if (opts?.play !== false) {
          void audio.play().catch(() => setPlaying(false))
        }
      }

      audio.src = mediaUrl(item.file)
      audio.addEventListener('loadedmetadata', onMeta, { once: true })
      audio.load()
      applyMediaSession(item, Boolean(opts?.play !== false))
    },
    [applyMediaSession],
  )

  useEffect(() => {
    if (!lecture) {
      setCues([])
      return
    }
    const ac = new AbortController()
    fetch(mediaUrl(vttFile(lecture.file)), { signal: ac.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('missing captions'))))
      .then((text) => {
        if (!ac.signal.aborted) setCues(parseVtt(text))
      })
      .catch(() => {
        if (!ac.signal.aborted) setCues([])
      })
    return () => ac.abort()
  }, [lecture])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    persistProgress()
  }, [persistProgress])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !lectureIdRef.current) return
    if (audio.paused) void audio.play().catch(() => undefined)
    else {
      audio.pause()
      persistProgress()
    }
  }, [persistProgress])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = Number.isFinite(audio.duration) ? audio.duration : 0
    audio.currentTime = Math.min(Math.max(0, time), max || time)
    setCurrentTime(audio.currentTime)
    persistProgress()
  }, [persistProgress])

  const skip = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (!audio) return
      seek(audio.currentTime + delta)
    },
    [seek],
  )

  const next = useCallback(() => {
    const id = lectureIdRef.current
    if (!id) return
    const nxt = nextLectureId(id)
    if (nxt) load(nxt, { play: true })
  }, [load])

  const prev = useCallback(() => {
    const audio = audioRef.current
    const id = lectureIdRef.current
    if (!audio || !id) return
    if (audio.currentTime > 4) {
      seek(0)
      return
    }
    const previous = prevLectureId(id)
    if (previous) load(previous, { play: true })
    else seek(0)
  }, [load, seek])

  const updatePrefs = useCallback((patch: Partial<PlayerPrefs>) => {
    const nextPrefs = { ...prefsRef.current, ...patch }
    prefsRef.current = nextPrefs
    setPrefs(nextPrefs)
    savePrefs(nextPrefs)
    const audio = audioRef.current
    if (!audio) return
    if (patch.rate != null) audio.playbackRate = patch.rate
    if (patch.volume != null) audio.volume = patch.volume
  }, [])

  const setRate = useCallback((rate: number) => updatePrefs({ rate }), [updatePrefs])
  const setVolume = useCallback((volume: number) => updatePrefs({ volume }), [updatePrefs])
  const setAutoplay = useCallback((autoplay: boolean) => updatePrefs({ autoplay }), [updatePrefs])
  const setCaptions = useCallback((captions: boolean) => updatePrefs({ captions }), [updatePrefs])

  const setSleep = useCallback((nextSleep: SleepMode) => {
    sleepRef.current = nextSleep
    setSleepState(nextSleep)
    if (nextSleep.kind === 'minutes') {
      sleepUntilRef.current = Date.now() + nextSleep.minutes * 60_000
      setSleepRemainingMs(nextSleep.minutes * 60_000)
    } else {
      sleepUntilRef.current = null
      setSleepRemainingMs(null)
    }
  }, [])

  const bookmark = useCallback(
    (note = '') => {
      const id = lectureIdRef.current
      const audio = audioRef.current
      if (!id || !audio) return
      addBookmark(id, audio.currentTime, note)
      setBookmarks(getBookmarks(id))
    },
    [],
  )

  const deleteBookmark = useCallback((id: string) => {
    removeBookmark(id)
    const lectureId = lectureIdRef.current
    if (lectureId) setBookmarks(getBookmarks(lectureId))
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => {
      setPlaying(true)
      applyMediaSession(lectureById(lectureIdRef.current ?? '') ?? null, true)
    }
    const onPause = () => {
      setPlaying(false)
      persistProgress()
      applyMediaSession(lectureById(lectureIdRef.current ?? '') ?? null, false)
    }
    const onTime = () => {
      setCurrentTime(audio.currentTime)
      scheduleSave()
    }
    const onDuration = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const onProgress = () => setBuffered(readRanges(audio))
    const onError = () => {
      setError('Audio file is missing. From this project run npm run klimek:copy after placing files in Downloads/mark-klimek.')
      setPlaying(false)
    }
    const onEnded = () => {
      persistProgress()
      const id = lectureIdRef.current
      if (!id) return
      if (sleepRef.current.kind === 'end') {
        setSleep({ kind: 'off' })
        return
      }
      if (prefsRef.current.autoplay) {
        const nxt = nextLectureId(id)
        if (nxt) load(nxt, { play: true })
      }
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('progress', onProgress)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('progress', onProgress)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [applyMediaSession, load, persistProgress, scheduleSave, setSleep])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (sleepRef.current.kind !== 'minutes' || sleepUntilRef.current == null) return
      const left = sleepUntilRef.current - Date.now()
      setSleepRemainingMs(Math.max(0, left))
      if (left <= 0) {
        audioRef.current?.pause()
        persistProgress()
        sleepRef.current = { kind: 'off' }
        sleepUntilRef.current = null
        setSleepState({ kind: 'off' })
        setSleepRemainingMs(null)
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [persistProgress])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return
      }
      if (!lectureIdRef.current) return

      if (event.code === 'Space') {
        event.preventDefault()
        toggle()
      } else if (event.code === 'ArrowRight') {
        event.preventDefault()
        skip(event.shiftKey ? 30 : 10)
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        skip(event.shiftKey ? -30 : -10)
      } else if (event.key === '[') {
        const rates = [0.75, 1, 1.25, 1.5, 1.75, 2]
        const i = rates.indexOf(prefsRef.current.rate)
        if (i > 0) setRate(rates[i - 1])
      } else if (event.key === ']') {
        const rates = [0.75, 1, 1.25, 1.5, 1.75, 2]
        const i = rates.indexOf(prefsRef.current.rate)
        if (i >= 0 && i < rates.length - 1) setRate(rates[i + 1])
      } else if (event.key === 'n' || event.key === 'N') {
        next()
      } else if (event.key === 'p' || event.key === 'P') {
        prev()
      } else if (event.key === 'b' || event.key === 'B') {
        bookmark()
      } else if (event.key === 'c' || event.key === 'C') {
        setCaptions(!prefsRef.current.captions)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bookmark, next, prev, setCaptions, setRate, skip, toggle])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const set = (action: MediaSessionAction, handler: () => void) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        /* unsupported action */
      }
    }
    set('play', () => void audioRef.current?.play())
    set('pause', () => pause())
    set('previoustrack', () => prev())
    set('nexttrack', () => next())
    set('seekbackward', () => skip(-10))
    set('seekforward', () => skip(10))
    return () => {
      ;(['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward'] as const).forEach(
        (action) => {
          try {
            navigator.mediaSession.setActionHandler(action, null)
          } catch {
            /* ignore */
          }
        },
      )
    }
  }, [next, pause, prev, skip])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current)
      persistProgress()
    }
  }, [persistProgress])

  const cueIndex = useMemo(() => cueIndexAt(cues, currentTime), [cues, currentTime])

  const value = useMemo<PlayerValue>(
    () => ({
      lecture,
      playing,
      currentTime,
      duration: duration || lecture?.duration || 0,
      buffered,
      prefs,
      sleep,
      sleepRemainingMs,
      bookmarks,
      error,
      cues,
      cueIndex,
      load,
      toggle,
      pause,
      seek,
      skip,
      setRate,
      setVolume,
      setAutoplay,
      setCaptions,
      setSleep,
      next,
      prev,
      bookmark,
      deleteBookmark,
    }),
    [
      bookmark,
      bookmarks,
      buffered,
      cueIndex,
      cues,
      currentTime,
      deleteBookmark,
      duration,
      error,
      lecture,
      load,
      next,
      pause,
      playing,
      prefs,
      prev,
      seek,
      setAutoplay,
      setCaptions,
      setRate,
      setSleep,
      setVolume,
      skip,
      sleep,
      sleepRemainingMs,
      toggle,
    ],
  )

  return (
    <KlimekPlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" className="sr-audio" />
      {children}
    </KlimekPlayerContext.Provider>
  )
}

export function useKlimekPlayer(): PlayerValue {
  const ctx = useContext(KlimekPlayerContext)
  if (!ctx) throw new Error('useKlimekPlayer must be used inside KlimekPlayerProvider')
  return ctx
}
