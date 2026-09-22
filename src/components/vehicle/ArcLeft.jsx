export default function ArcLeft({ angle, maxAngle, arcR, gapDeg, maxDeg, arcTopY = 5 }) {
  const absAngle  = Math.abs(angle)
  const progress  = absAngle / maxAngle
  const isActive  = angle < 0
  const activeLen = progress * (maxDeg - gapDeg)

  const cx = arcR
  const cy = arcTopY + arcR

  function polarToXY(deg) {
    const rad = ((deg - 90) * Math.PI) / 180
    return {
      x: cx + arcR * Math.cos(rad),
      y: cy + arcR * Math.sin(rad)
    }
  }

  const trackOuter = polarToXY(-maxDeg)
  const gapPoint   = polarToXY(-gapDeg)

  let activeEnd = null
  if (isActive) {
    activeEnd = polarToXY(-(gapDeg + activeLen))
  }

  const arcColor =
    progress < 0.33 ? '#22c55e' :
    progress < 0.66 ? '#f59e0b' :
                      '#ef4444'

  return (
    <g className="arc-left">
      <path
        d={`M ${trackOuter.x} ${trackOuter.y} A ${arcR} ${arcR} 0 0 1 ${gapPoint.x} ${gapPoint.y}`}
        fill="none"
        stroke="#1e2d45"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {isActive && activeEnd && (
        <path
          d={`M ${gapPoint.x} ${gapPoint.y} A ${arcR} ${arcR} 0 0 0 ${activeEnd.x} ${activeEnd.y}`}
          fill="none"
          stroke={arcColor}
          strokeWidth="8"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${arcColor})` }}
        />
      )}
    </g>
  )
}