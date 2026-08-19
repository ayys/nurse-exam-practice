import { useMemo, useState } from 'react'
import {
  LECTURES,
  PDFS,
  formatPrettyDuration,
  getPdfPrefs,
  mediaUrl,
  pdfById,
  savePdfPrefs,
} from '../lib/klimek'
import { useKlimekPlayer } from '../lib/KlimekPlayer'

interface PdfsProps {
  initialId?: string
  onBack: () => void
  onOpenLectures: () => void
}

export function Pdfs({ initialId, onBack, onOpenLectures }: PdfsProps) {
  const player = useKlimekPlayer()
  const prefs = useMemo(() => getPdfPrefs(), [])
  const [activeId, setActiveId] = useState(initialId && pdfById(initialId) ? initialId : prefs.lastId)
  const [page, setPage] = useState(String(prefs.pages[activeId] ?? 1))
  const [zoom, setZoom] = useState('page-width')
  const doc = pdfById(activeId) ?? PDFS[0]
  const src = `${mediaUrl(doc.file)}#page=${Number(page) || 1}&zoom=${zoom}`

  function selectDoc(id: string) {
    const nextPrefs = getPdfPrefs()
    const nextPage = nextPrefs.pages[id] ?? 1
    setActiveId(id)
    setPage(String(nextPage))
    savePdfPrefs({ ...nextPrefs, lastId: id })
  }

  function applyPage(nextPage: number) {
    const safe = Math.max(1, Math.floor(nextPage))
    setPage(String(safe))
    const nextPrefs = getPdfPrefs()
    savePdfPrefs({
      lastId: doc.id,
      pages: { ...nextPrefs.pages, [doc.id]: safe },
    })
  }

  return (
    <div className="stack rise study-page pdf-page">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Home
        </button>
        <button type="button" className="btn btn-secondary" onClick={onOpenLectures}>
          Lectures
        </button>
      </div>

      <header className="stack" style={{ gap: '0.4rem' }}>
        <p className="muted" style={{ margin: 0, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
          Study PDFs
        </p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 2.8rem)' }}>
          {doc.title}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {doc.blurb} Audio keeps playing if you started a lecture — use the bar below.
        </p>
      </header>

      <nav className="pdf-tabs" aria-label="PDF library">
        {PDFS.map((pdf) => (
          <button
            key={pdf.id}
            type="button"
            className={`pdf-tab ${pdf.id === doc.id ? 'active' : ''}`}
            onClick={() => selectDoc(pdf.id)}
          >
            {pdf.title}
          </button>
        ))}
      </nav>

      <div className="panel pdf-toolbar row">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            applyPage(Number(page) || 1)
          }}
        >
          <div className="field" style={{ minWidth: '6rem', flex: '0 0 auto' }}>
            <label htmlFor="pdf-page">Page</label>
            <input
              id="pdf-page"
              inputMode="numeric"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              onBlur={() => applyPage(Number(page) || 1)}
            />
          </div>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '1.4rem' }} onClick={() => applyPage((Number(page) || 1) - 1)}>
            Prev
          </button>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '1.4rem' }} onClick={() => applyPage((Number(page) || 1) + 1)}>
            Next
          </button>
        </form>
        <div className="field" style={{ minWidth: '8rem', flex: '0 1 10rem' }}>
          <label htmlFor="pdf-zoom">Zoom</label>
          <select id="pdf-zoom" value={zoom} onChange={(e) => setZoom(e.target.value)}>
            <option value="page-width">Fit width</option>
            <option value="page-fit">Fit page</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
          </select>
        </div>
        <div className="field" style={{ minWidth: '10rem' }}>
          <label htmlFor="listen-along">Listen while reading</label>
          <select
            id="listen-along"
            value={player.lecture?.id ?? ''}
            onChange={(e) => {
              if (e.target.value) player.load(e.target.value, { play: true })
            }}
          >
            <option value="">Choose a lecture</option>
            {LECTURES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.letter}. {l.title} ({formatPrettyDuration(l.duration)})
              </option>
            ))}
          </select>
        </div>
        <a className="btn btn-secondary" style={{ marginTop: '1.4rem' }} href={mediaUrl(doc.file)} target="_blank" rel="noreferrer">
          Open / download
        </a>
      </div>

      <div className="pdf-frame-wrap panel">
        <iframe title={doc.title} className="pdf-frame" src={src} />
      </div>
    </div>
  )
}
