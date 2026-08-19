import { formatClock, progressRatio } from '../lib/klimek'

interface SeekBarProps {
  currentTime: number
  duration: number
  buffered: { start: number; end: number }[]
  onSeek: (time: number) => void
  ariaLabel?: string
}

export function SeekBar({ currentTime, duration, buffered, onSeek, ariaLabel }: SeekBarProps) {
  const max = duration > 0 ? duration : 1
  const played = progressRatio(currentTime, duration) * 100

  return (
    <div className="seek">
      <div className="seek-track" aria-hidden="true">
        {buffered.map((range) => (
          <span
            key={`${range.start}-${range.end}`}
            className="seek-buffered"
            style={{
              left: `${progressRatio(range.start, duration) * 100}%`,
              width: `${progressRatio(range.end - range.start, duration) * 100}%`,
            }}
          />
        ))}
        <span className="seek-played" style={{ width: `${played}%` }} />
      </div>
      <input
        className="seek-input"
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(currentTime, max)}
        aria-label={ariaLabel ?? 'Seek'}
        aria-valuetext={formatClock(currentTime)}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
    </div>
  )
}
