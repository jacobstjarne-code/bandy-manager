import { SVERIGE_PATH, SVERIGE_VIEWBOX } from '../../../domain/data/sverigeMapPath'

export function SverigeBackdrop() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 240,
        maxWidth: 240,
        opacity: 0.08,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <svg
        viewBox={SVERIGE_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
      >
        <path
          d={SVERIGE_PATH}
          fill="var(--accent)"
          stroke="var(--accent)"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}
