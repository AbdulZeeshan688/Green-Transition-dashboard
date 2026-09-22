const RHO = 1.225
const CRR = 0.012
const G   = 9.81

export function segmentEnergyWh(dH, segDist, mass, speedMs, CdA) {
  const grade  = dH / segDist
  const sinA   = Math.sin(Math.atan(grade))
  const cosA   = Math.cos(Math.atan(grade))
  const F_grav = mass * G * sinA
  const F_roll = mass * G * CRR * cosA
  const F_aero = 0.5 * RHO * CdA * speedMs * speedMs
  return ((F_grav + F_roll + F_aero) * segDist) / 3600
}

export function computeRouteEnergy(route, params) {
  const { mass, speedKmh, CdA, regenPct, battKWh } = params
  const speedMs  = speedKmh / 3.6
  const regenEff = regenPct / 100
  const n        = route.elev.length
  const segDist  = (route.distKm * 1000) / (n - 1)

  let totalWh = 0, regenWh = 0, climb = 0, descent = 0
  const elevArr  = []
  const whData   = []
  const gradeArr = []
  const cumWh    = []

  for (let i = 0; i < n; i++) {
    const elev = route.baseElev + route.elev[i] * route.elevRange
    elevArr.push(Math.round(elev))

    if (i === 0) {
      whData.push(0)
      gradeArr.push(0)
      cumWh.push(0)
      continue
    }

    const dH    = elevArr[i] - elevArr[i - 1]
    const wh    = segmentEnergyWh(dH, segDist, mass, speedMs, CdA)
    const grade = (dH / segDist) * 100

    gradeArr.push(parseFloat(grade.toFixed(2)))

    if (dH > 0) climb += dH
    else descent += Math.abs(dH)

    if (wh >= 0) {
      totalWh += wh
    } else {
      const recovered = Math.abs(wh) * regenEff
      regenWh  += recovered
      totalWh  -= recovered
    }

    whData.push(parseFloat(wh.toFixed(2)))
    cumWh.push(Math.round(totalWh))
  }

  const battWh  = battKWh * 1000
  // Wh/100km — total energy per 100 km driven
  const wh100   = route.distKm > 0 ? (totalWh / route.distKm) * 100 : 0
  // Remaining range after this route: (battery Wh − consumed Wh) ÷ Wh-per-km
  const whPerKm = route.distKm > 0 ? totalWh / route.distKm : 0
  const rangeKm = whPerKm > 0 ? Math.round((battWh - totalWh) / whPerKm) : 999

  return {
    elevArr,
    whData,
    gradeArr,
    cumWh,
    totalWh:  Math.round(totalWh),
    regenWh:  Math.round(regenWh),
    climb:    Math.round(climb),
    descent:  Math.round(descent),
    wh100:    Math.round(wh100),
    rangeKm:  Math.max(0, rangeKm),
    n,
    segDist
  }
}