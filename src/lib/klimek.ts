export interface Lecture {
  id: string
  letter: string
  title: string
  file: string
  duration: number
  tags: string[]
  summary: string
  companionPdf: string
}

export interface PdfDoc {
  id: string
  title: string
  file: string
  blurb: string
  kind: 'outline' | 'notes' | 'questions'
}

export const LECTURES: Lecture[] = [
  {
    id: 'a',
    letter: 'A',
    title: 'Acid-Base Principles',
    file: 'a-acid-base.mp3',
    duration: 5541,
    tags: ['ABG', 'acidosis', 'alkalosis', 'ventilation'],
    summary:
      'As the pH goes, so goes my patient — except potassium. If pH and bicarb move the same way, it is metabolic.',
    companionPdf: 'lectures',
  },
  {
    id: 'b',
    letter: 'B',
    title: 'Alcohol',
    file: 'b-alcohol.mp3',
    duration: 6115,
    tags: ['alcohol', 'Wernicke', 'withdrawal', 'AWS', 'DT'],
    summary:
      'Denial, dependency, Wernicke-Korsakoff, AWS vs delirium tremens, and uppers/downers overdose-withdrawal.',
    companionPdf: 'lectures',
  },
  {
    id: 'c',
    letter: 'C',
    title: 'Cardiac and Pharm',
    file: 'c-cardiac-pharm.mp3',
    duration: 6611,
    tags: ['cardiac', 'CCB', 'chest tubes', 'heart'],
    summary:
      'Calcium channel blockers, cardiac arrhythmias, chest tubes, and congenital heart defects.',
    companionPdf: 'lectures',
  },
  {
    id: 'd',
    letter: 'D',
    title: 'Canes, Crutches, Walkers & Psych',
    file: 'd-mobility-psych.mp3',
    duration: 5818,
    tags: ['crutches', 'canes', 'walkers', 'psych', 'delusions'],
    summary:
      'How to fit and gait with mobility aids, then psych: delusions, hallucinations, and how to talk to each.',
    companionPdf: 'lectures',
  },
  {
    id: 'e',
    letter: 'E',
    title: 'Diabetes',
    file: 'e-diabetes.mp3',
    duration: 4307,
    tags: ['diabetes', 'insulin', 'DKA', 'HHNK', 'hypoglycemia'],
    summary:
      'DI vs SIADH, insulin peaks, hypoglycemia, DKA vs HHNK, and long-term complications.',
    companionPdf: 'lectures',
  },
  {
    id: 'f',
    letter: 'F',
    title: 'Psych Pharm & Hernias',
    file: 'f-psych-pharm-hernias.mp3',
    duration: 5271,
    tags: ['phenothiazines', 'lithium', 'benzos', 'hernias', 'psych'],
    summary:
      'All-end-in-ZINE psych drugs, lithium, MAOIs, Prozac, and hiatal hernia vs dumping syndrome.',
    companionPdf: 'lectures',
  },
  {
    id: 'g',
    letter: 'G',
    title: 'Endocrine',
    file: 'g-endocrine.mp3',
    duration: 6333,
    tags: ['thyroid', 'adrenal', 'Addison', 'Cushing', 'endocrine'],
    summary:
      'Hyper/hypothyroid, thyroidectomy, Addison vs Cushing, and treatment rules of thumb.',
    companionPdf: 'lectures',
  },
  {
    id: 'h',
    letter: 'H',
    title: 'Labs',
    file: 'h-labs.mp3',
    duration: 3233,
    tags: ['labs', 'potassium', 'creatinine', 'INR', 'ABG'],
    summary:
      'Five Ds of deadly labs: pH, potassium, CO2, O2, platelets. Know what is critical vs watch.',
    companionPdf: 'lectures',
  },
  {
    id: 'i',
    letter: 'I',
    title: 'Psych Drugs',
    file: 'i-psych-drugs.mp3',
    duration: 3375,
    tags: ['NMS', 'serotonin', 'haloperidol', 'clozapine', 'Zoloft'],
    summary:
      'NMS vs EPS, clozapine agranulocytosis, Zoloft interactions, and geodon/ziprasidone QT risk.',
    companionPdf: 'lectures',
  },
  {
    id: 'j',
    letter: 'J',
    title: 'Maternity & OB',
    file: 'j-maternity-ob.mp3',
    duration: 3914,
    tags: ['pregnancy', 'labor', 'fetal heart', 'maternity'],
    summary:
      'Due date, weight gain, stages of labor, fetal heart patterns, and delivery meds.',
    companionPdf: 'lectures',
  },
  {
    id: 'k',
    letter: 'K',
    title: 'OB 2',
    file: 'k-ob-2.mp3',
    duration: 4709,
    tags: ['OB', 'tocolytics', 'oxytocin', 'complications', 'newborn'],
    summary:
      'Labor complications, tocolytics vs oxytocics, newborn assessment, and postpartum care.',
    companionPdf: 'lectures',
  },
  {
    id: 'l',
    letter: 'L',
    title: 'Prioritization & Delegation',
    file: 'l-prioritization.mp3',
    duration: 7458,
    tags: ['prioritization', 'delegation', 'staff', 'NCLEX'],
    summary:
      'Who to see first, what can be delegated, and how to answer staff-management questions.',
    companionPdf: 'lectures',
  },
]

export const PDFS: PdfDoc[] = [
  {
    id: 'lectures',
    title: 'Lecture outlines',
    file: 'lectures.pdf',
    kind: 'outline',
    blurb: 'Short outlines that follow the audio. Keep this open while you listen.',
  },
  {
    id: 'notes',
    title: 'Study notes',
    file: 'notes.pdf',
    kind: 'notes',
    blurb: 'Fuller notes for review after a lecture, or when you need a written recap.',
  },
  {
    id: 'blue-book',
    title: 'Blue Book',
    file: 'blue-book.pdf',
    kind: 'questions',
    blurb: 'Practice questions. Work a section after the matching lecture.',
  },
  {
    id: 'yellow-book',
    title: 'Yellow Book',
    file: 'yellow-book.pdf',
    kind: 'questions',
    blurb: 'More review questions — useful for weak topics after you listen.',
  },
]

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const
export const SKIP_SECONDS = 10
export const SKIP_LONG_SECONDS = 30
export const COMPLETE_AT = 0.92

export function mediaUrl(file: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}klimek/${file}`
}

export function vttFile(audioFile: string): string {
  return audioFile.replace(/\.mp3$/i, '.vtt')
}

export function lectureById(id: string): Lecture | undefined {
  return LECTURES.find((l) => l.id === id)
}

export function pdfById(id: string): PdfDoc | undefined {
  return PDFS.find((p) => p.id === id)
}

export function nextLectureId(id: string): string | null {
  const i = LECTURES.findIndex((l) => l.id === id)
  if (i < 0 || i >= LECTURES.length - 1) return null
  return LECTURES[i + 1].id
}

export function prevLectureId(id: string): string | null {
  const i = LECTURES.findIndex((l) => l.id === id)
  if (i <= 0) return null
  return LECTURES[i - 1].id
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function formatPrettyDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${Math.max(1, m)}m`
}

export function progressRatio(time: number, duration: number): number {
  if (!duration || duration <= 0) return 0
  return Math.min(1, Math.max(0, time / duration))
}

export function isLectureDone(time: number, duration: number): boolean {
  return progressRatio(time, duration) >= COMPLETE_AT
}

export function matchesLectureQuery(lecture: Lecture, raw: string): boolean {
  const q = raw.trim().toLowerCase()
  if (!q) return true
  if (lecture.letter.toLowerCase() === q || lecture.id === q) return true
  const hay = [lecture.title, lecture.summary, ...lecture.tags].join(' ').toLowerCase()
  return hay.includes(q)
}

export interface LectureProgress {
  time: number
  duration: number
  updatedAt: number
}

export interface Bookmark {
  id: string
  lectureId: string
  time: number
  note: string
  createdAt: number
}

export interface PlayerPrefs {
  rate: number
  autoplay: boolean
  volume: number
  captions: boolean
}

export interface PdfPrefs {
  lastId: string
  pages: Record<string, number>
}

const PROGRESS_KEY = 'tu-nurse-exam:klimek:progress'
const BOOKMARK_KEY = 'tu-nurse-exam:klimek:bookmarks'
const PREFS_KEY = 'tu-nurse-exam:klimek:prefs'
const LAST_KEY = 'tu-nurse-exam:klimek:last'
const PDF_KEY = 'tu-nurse-exam:klimek:pdf'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getAllProgress(): Record<string, LectureProgress> {
  const data = readJson<Record<string, LectureProgress>>(PROGRESS_KEY, {})
  return data && typeof data === 'object' ? data : {}
}

export function getProgress(id: string): LectureProgress | null {
  return getAllProgress()[id] ?? null
}

export function saveProgress(id: string, time: number, duration: number): void {
  const all = getAllProgress()
  all[id] = { time: Math.max(0, time), duration: Math.max(0, duration), updatedAt: Date.now() }
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
  } catch {
    /* ignore quota */
  }
}

export function getLastLectureId(): string | null {
  const id = localStorage.getItem(LAST_KEY)
  return id && lectureById(id) ? id : null
}

export function setLastLectureId(id: string): void {
  localStorage.setItem(LAST_KEY, id)
}

export function getBookmarks(lectureId?: string): Bookmark[] {
  const all = readJson<Bookmark[]>(BOOKMARK_KEY, [])
  const list = Array.isArray(all) ? all : []
  return lectureId ? list.filter((b) => b.lectureId === lectureId) : list
}

export function addBookmark(lectureId: string, time: number, note: string): Bookmark {
  const bookmark: Bookmark = {
    id: `${lectureId}-${Math.floor(time)}-${Date.now()}`,
    lectureId,
    time: Math.max(0, Math.floor(time)),
    note: note.trim(),
    createdAt: Date.now(),
  }
  const all = getBookmarks()
  all.push(bookmark)
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(all))
  return bookmark
}

export function removeBookmark(id: string): void {
  localStorage.setItem(
    BOOKMARK_KEY,
    JSON.stringify(getBookmarks().filter((b) => b.id !== id)),
  )
}

export function getPrefs(): PlayerPrefs {
  const prefs = readJson<Partial<PlayerPrefs>>(PREFS_KEY, {})
  const rate = PLAYBACK_RATES.includes(prefs.rate as (typeof PLAYBACK_RATES)[number])
    ? (prefs.rate as number)
    : 1
  return {
    rate,
    autoplay: Boolean(prefs.autoplay),
    volume: typeof prefs.volume === 'number' ? Math.min(1, Math.max(0, prefs.volume)) : 1,
    captions: prefs.captions !== false,
  }
}

export function savePrefs(prefs: PlayerPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function getPdfPrefs(): PdfPrefs {
  const prefs = readJson<Partial<PdfPrefs>>(PDF_KEY, {})
  return {
    lastId: typeof prefs.lastId === 'string' && pdfById(prefs.lastId) ? prefs.lastId : 'lectures',
    pages: prefs.pages && typeof prefs.pages === 'object' ? prefs.pages : {},
  }
}

export function savePdfPrefs(prefs: PdfPrefs): void {
  localStorage.setItem(PDF_KEY, JSON.stringify(prefs))
}

export function listenedSummary(progress: Record<string, LectureProgress>): {
  done: number
  started: number
  seconds: number
} {
  let done = 0
  let started = 0
  let seconds = 0
  for (const lecture of LECTURES) {
    const p = progress[lecture.id]
    if (!p || p.time < 15) continue
    started += 1
    seconds += Math.min(p.time, lecture.duration)
    if (isLectureDone(p.time, p.duration || lecture.duration)) done += 1
  }
  return { done, started, seconds }
}
