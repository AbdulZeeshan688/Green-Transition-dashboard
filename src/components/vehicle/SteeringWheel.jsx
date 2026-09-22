import { useState, useEffect, useCallback } from 'react'
import './SteeringWheel.css'
import wheelImg from '../../assets/steering-wheel.png'
import ArcLeft from './ArcLeft'
import ArcRight from './ArcRight'

const MAX_ANGLE   = 540
const ARC_R       = 160
const GAP_DEG     = 18
const MAX_DEG     = 75
const ARC_TOP_Y   = 5
const ARC_BOTTOM_GAP = 2
const STEP_DEG    = 5

export default function SteeringWheel() {
  const [angle, setAngle] = useState(0)
  const absAngle   = Math.abs(angle)
  const direction  = angle < 0 ? 'L' : angle > 0 ? 'R' : ''
  const progress   = absAngle / MAX_ANGLE

  const arcColor =
    progress < 0.33 ? '#22c55e' :
    progress < 0.66 ? '#f59e0b' :
                      '#ef4444'

  const cx          = ARC_R
  const viewBox     = `0 0 ${ARC_R * 2} ${ARC_R + ARC_TOP_Y + ARC_BOTTOM_GAP}`
  const imgRotation = (angle / 360) * 360

  const textY = ARC_TOP_Y + 0
  const textX = cx + 0

  const steer = useCallback((dir) => {
    setAngle(prev => {
      const next = prev + dir
      return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, next))
    })
  }, [])

  useEffect(() => {
    const held = { left: false, right: false }
    let interval = null

    // Re-check both keys each tick so switching direction stays responsive.
    function step() {
      if (held.left)  steer(-STEP_DEG)
      if (held.right) steer(STEP_DEG)
    }

    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        held.left = true
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        held.right = true
      }
      if ((held.left || held.right) && !interval) {
        interval = setInterval(step, 30)
      }
    }

    function handleKeyUp(e) {
      const key = e.key
      if (key === 'ArrowLeft') {
        e.preventDefault()
        held.left = false
      } else if (key === 'ArrowRight') {
        e.preventDefault()
        held.right = false
      }
      if (!held.left && !held.right && interval) {
        clearInterval(interval)
        interval = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (interval) clearInterval(interval)
    }
  }, [steer])

  return (
    <div className="wheel-wrap">
      <div className="wheel-arc-wrap">
        <svg
          className="wheel-arc-svg"
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <ArcLeft
            angle={angle}
            maxAngle={MAX_ANGLE}
            arcR={ARC_R}
            gapDeg={GAP_DEG}
            maxDeg={MAX_DEG}
            arcTopY={ARC_TOP_Y}
          />
          <ArcRight
            angle={angle}
            maxAngle={MAX_ANGLE}
            arcR={ARC_R}
            gapDeg={GAP_DEG}
            maxDeg={MAX_DEG}
            arcTopY={ARC_TOP_Y}
          />

          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={absAngle > 0 ? arcColor : '#4b5e7a'}
            fontSize="14"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {absAngle > 0 ? `${direction} ${absAngle}°` : '0°'}
          </text>

        </svg>
      </div>

      <div className="wheel-container">
        <img
          src={wheelImg}
          alt="steering wheel"
          className="wheel-img"
          style={{ transform: `rotate(${imgRotation}deg)` }}
        />
      </div>
    </div>
  )
}