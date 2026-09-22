import { memo, useEffect, useRef } from 'react'
import './ElevationChart.css'

// Sample data so the chart still renders before a route is selected.
// routeData.elevArr replaces this once the route comes back.
const TEST_ELEV = [
  120, 135, 160, 180, 210, 240, 225, 200, 180,
  160, 140, 130, 120, 115, 125, 145, 170, 195,
  220, 240, 230, 210, 185, 160, 140, 120, 105,
  95,  90,  95, 110, 130, 155, 175, 190, 180,
  165, 145, 125, 110
]

// routeData provides elevArr, climb, descent, distKm for the profile.
function ElevationChart({ routeData }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  const elevArr = routeData?.elevArr || TEST_ELEV
  // For real routes, x-axis labels are route-distance based (km).
  const distKm  = routeData?.distKm || 0

  useEffect(() => {
    if (!canvasRef.current) return

    import('chart.js').then(({ Chart, registerables }) => {
      // Re-check canvas ref — it may have unmounted while import was loading
      if (!canvasRef.current) return

      Chart.register(...registerables)

      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }

      const ctx  = canvasRef.current
      const min  = Math.min(...elevArr)
      const max  = Math.max(...elevArr)

      const labels = elevArr.map((_, i) =>
        distKm
          ? ((i / (elevArr.length - 1)) * distKm).toFixed(0)
          : i
      )

      const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200)
      gradient.addColorStop(0,   'rgba(34, 197, 94, 0.4)')
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.2)')
      gradient.addColorStop(1,   'rgba(34, 197, 94, 0.0)')

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data:            elevArr,
            fill:            true,
            backgroundColor: gradient,
            borderColor:     '#22c55e',
            borderWidth:     1.5,
            pointRadius:     0,
            tension:         0.4,
            segment: {
              borderColor: ctx => {
                const i  = ctx.p1DataIndex
                const dH = elevArr[i] - elevArr[i - 1]
                if (dH > 5)  return '#ef4444'
                if (dH > 0)  return '#f59e0b'
                return '#22c55e'
              }
            }
          }]
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          animation:           { duration: 600 },
          interaction:         { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111827',
              borderColor:     '#1e2d45',
              borderWidth:     1,
              titleColor:      '#4b5e7a',
              bodyColor:       '#e8eaf0',
              callbacks: {
                title:  items => distKm ? `km ${items[0].label}` : `point ${items[0].label}`,
                label:  item  => `${Math.round(item.raw)} m`
              }
            }
          },
          scales: {
            x: {
              display: true,
              ticks: {
                maxTicksLimit: 6,
                font:  { size: 9 },
                color: '#4b5e7a',
                autoSkip: true
              },
              grid:   { display: false },
              border: { display: false }
            },
            y: {
              display: true,
              min:     Math.max(0, min - 20),
              max:     max + 20,
              ticks: {
                maxTicksLimit: 4,
                font:  { size: 9 },
                color: '#4b5e7a',
                callback: v => `${v}m`
              },
              grid: {
                color: 'rgba(255,255,255,0.04)'
              },
              border: { display: false }
            }
          }
        }
      })
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [elevArr, distKm])

  return (
    <div className="elev-wrap">
      <div className="elev-header">
        <span className="elev-title">Elevation Profile</span>
        {routeData && (
          <span className="elev-stats">
            <span className="elev-stat up">↑ {routeData.climb}m</span>
            <span className="elev-stat down">↓ {routeData.descent}m</span>
          </span>
        )}
      </div>
      <div className="elev-chart-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

export default memo(ElevationChart)
