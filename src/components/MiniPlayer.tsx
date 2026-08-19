import { SKIP_LONG_SECONDS, SKIP_SECONDS, formatClock } from '../lib/klimek'
import { useKlimekPlayer } from '../lib/KlimekPlayer'
import { SeekBar } from './SeekBar'

interface MiniPlayerProps {
  onOpenLectures: () => void
}

export function MiniPlayer({ onOpenLectures }: MiniPlayerProps) {
  const player = useKlimekPlayer()
  if (!player.lecture) return null

  return (
    <div className="mini-player panel">
      <button type="button" className="mini-player-title" onClick={onOpenLectures}>
        <span className="letter-badge">{player.lecture.letter}</span>
        <span>
          <strong>{player.lecture.title}</strong>
          <span className="muted">
            {formatClock(player.currentTime)} / {formatClock(player.duration)}
          </span>
        </span>
      </button>
      <div className="mini-player-controls">
        <button type="button" className="icon-btn" aria-label="Back 10 seconds" onClick={() => player.skip(-SKIP_SECONDS)}>
          −10
        </button>
        <button
          type="button"
          className="icon-btn icon-btn-play"
          aria-label={player.playing ? 'Pause' : 'Play'}
          onClick={player.toggle}
        >
          {player.playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="icon-btn" aria-label="Forward 10 seconds" onClick={() => player.skip(SKIP_SECONDS)}>
          +10
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Forward 30 seconds"
          onClick={() => player.skip(SKIP_LONG_SECONDS)}
        >
          +30
        </button>
      </div>
      <SeekBar
        currentTime={player.currentTime}
        duration={player.duration}
        buffered={player.buffered}
        onSeek={player.seek}
        ariaLabel="Lecture position"
      />
    </div>
  )
}
