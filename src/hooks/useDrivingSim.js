import { useState, useEffect, useRef } from 'react'

// Vehicle limits — these will come from the vehicle config API later.
const MAX_SPEED_FWD  = 160  // max forward speed km/h
const MAX_SPEED_REV  = 20   // max reverse speed km/h
const ACCEL_RATE     = 30   // acceleration rate km/h per second
const BRAKE_RATE     = 80   // braking rate km/h per second
const FRICTION_DECEL = 3    // natural deceleration from friction km/h per second
const REGEN_DECEL    = [0, 3, 6, 10, 15, 21] // regen decel per level km/h per second
const PEDAL_SPEED    = 120  // how fast pedal UI fills/empties

// Drive modes — same approach as production EVs. Each mode maps to a regen
// level and a throttle/power curve (power factor), instead of a raw 0-5 regen
// slider. One-pedal modes also bring the car to a full stop on coast.
const DRIVE_MODES = {
  ECO:       { label: 'Eco',       regen: 4, power: 0.8, onePedal: false },
  COMFORT:   { label: 'Comfort',   regen: 3, power: 1.0, onePedal: false },
  ONE_PEDAL: { label: 'i-Pedal',   regen: 5, power: 1.0, onePedal: true },
}
const DEFAULT_MODE = 'COMFORT'

// Local physics simulation producing: speed, gear, driveMode, accelPct, brakePct,
// motorPower, motorTorque, mode, rpm. Swap in the CAN bus / telemetry client
// later without changing the rest of the UI.
export default function useDrivingSim() {
  const [speed,       setSpeed]       = useState(0)
  const [gear,        setGearState]   = useState('P')
  const [driveMode,   setDriveModeState] = useState(DEFAULT_MODE)
  const [accelPct,    setAccelPct]    = useState(0)
  const [brakePct,    setBrakePct]    = useState(0)
  const [motorPower,  setMotorPower]  = useState(0)
  const [motorTorque, setMotorTorque] = useState(0)
  const [mode,        setMode]        = useState('IDLE')
  const [rpm,         setRpm]         = useState(0)
  const [odo,         setOdo]         = useState(0)

  const phys = useRef({
    speed:       0,
    accelRaw:    0,
    brakeRaw:    0,
    motorPower:  0,
    motorTorque: 0,
    mode:        'IDLE',
    rpm:         0,
    gear:        'P',
    driveMode:   DEFAULT_MODE,
    odo:         0,
  })

  function setGear(g) {
    phys.current.gear = g
    setGearState(g)
  }

  function setDriveMode(m) {
    if (!DRIVE_MODES[m]) return
    phys.current.driveMode = m
    setDriveModeState(m)
  }

  useEffect(() => {
    const held = { up: false, down: false }

    function handleKeyDown(e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        held.up = true
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        held.down = true
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
      }
    }

    function handleKeyUp(e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        held.up = false
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        held.down = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup',   handleKeyUp)

    let lastTime = performance.now()
    let animId

    function tick(now) {
      const dt    = Math.min((now - lastTime) / 1000, 0.05)
      lastTime    = now
      const p     = phys.current
      const gear  = p.gear
      const dm    = DRIVE_MODES[p.driveMode] || DRIVE_MODES[DEFAULT_MODE]
      const regen = dm.regen
      const power = dm.power
      const onePedal = dm.onePedal

      const targetAccel = held.up   ? 100 : 0
      const targetBrake = held.down ? 100 : 0

      const accelDiff = targetAccel - p.accelRaw
      const brakeDiff = targetBrake - p.brakeRaw

      p.accelRaw += Math.sign(accelDiff) * Math.min(Math.abs(accelDiff), PEDAL_SPEED * dt)
      p.brakeRaw += Math.sign(brakeDiff) * Math.min(Math.abs(brakeDiff), PEDAL_SPEED * dt)
      p.accelRaw  = Math.max(0, Math.min(100, p.accelRaw))
      p.brakeRaw  = Math.max(0, Math.min(100, p.brakeRaw))

      const accelFrac = p.accelRaw / 100
      const brakeFrac = p.brakeRaw / 100

      let speed = p.speed

      const friction   = FRICTION_DECEL
      const regenExtra = REGEN_DECEL[regen] ?? 0
      const coastDecel = friction + regenExtra

      if (gear === 'P') {
        speed         = 0
        p.mode        = 'IDLE'
        p.motorPower  = 0
        p.motorTorque = 0
        p.rpm         = 0

      } else if (gear === 'N') {
        speed  = Math.max(0, speed - friction * dt)
        p.mode = speed > 0 ? 'NEUTRAL' : 'IDLE'

      } else if (gear === 'R') {
        if (held.up) {
          speed  = Math.min(MAX_SPEED_REV, speed + ACCEL_RATE * 0.5 * power * accelFrac * dt)
          p.mode = 'DRIVING'
        } else if (held.down) {
          speed  = Math.max(0, speed - BRAKE_RATE * brakeFrac * dt)
          p.mode = 'BRAKING'
        } else {
          speed  = Math.max(0, speed - coastDecel * dt)
          if (onePedal && speed < 2) speed = 0
          p.mode = speed > 0 ? (regenExtra > 0 ? 'REGEN' : 'DRIVING') : 'IDLE'
        }

      } else if (gear === 'D') {
        if (held.up && !held.down) {
          const aeroFactor = Math.max(0.15, 1 - (speed / MAX_SPEED_FWD) * 0.85)
          speed  = Math.min(MAX_SPEED_FWD, speed + ACCEL_RATE * power * accelFrac * aeroFactor * dt)
          p.mode = 'DRIVING'
        } else if (held.down) {
          speed  = Math.max(0, speed - BRAKE_RATE * brakeFrac * dt)
          p.mode = 'BRAKING'
        } else {
          speed  = Math.max(0, speed - coastDecel * dt)
          if (onePedal && speed < 2) speed = 0
          p.mode = speed > 0 ? (regenExtra > 0 ? 'REGEN' : 'DRIVING') : 'IDLE'
        }
      }

      p.speed = speed

      // Odometer — integrate speed over time (km/h × s / 3600 = km)
      p.odo += ((p.speed * dt) / 3600)
      setOdo(p.odo)

      const speedRatio = p.speed / MAX_SPEED_FWD

      if (p.speed === 0) {
        p.motorPower  = 0
        p.motorTorque = 0
        p.rpm         = 0
      } else if (p.mode === 'BRAKING') {
        p.motorPower  = -Math.round(speedRatio * 40)
        p.motorTorque = -Math.round(speedRatio * 100)
        p.rpm         = Math.round(p.speed * 8)
      } else if (p.mode === 'REGEN') {
        p.motorPower  = -Math.round(speedRatio * 20 * (regenExtra / 42))
        p.motorTorque = -Math.round(speedRatio * 60 * (regenExtra / 42))
        p.rpm         = Math.round(p.speed * 7)
      } else if (p.mode === 'DRIVING' && held.up) {
        p.motorPower  = Math.round(accelFrac * speedRatio * 150)
        p.motorTorque = Math.round(accelFrac * speedRatio * 400)
        p.rpm         = Math.round(p.speed * 9)
      } else {
        p.motorPower  = Math.round(speedRatio * 8)
        p.motorTorque = Math.round(speedRatio * 20)
        p.rpm         = Math.round(p.speed * 7)
      }

      setSpeed(Math.round(p.speed * 10) / 10)
      setAccelPct(Math.round(p.accelRaw))
      setBrakePct(Math.round(p.brakeRaw))
      setMotorPower(p.motorPower)
      setMotorTorque(p.motorTorque)
      setMode(p.mode)
      setRpm(p.rpm)

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup',   handleKeyUp)
      cancelAnimationFrame(animId)
    }
  }, [])

  return {
    speed, gear, setGear,
    driveMode, setDriveMode,
    accelPct, brakePct,
    motorPower, motorTorque,
    mode, rpm, odo
  }
}