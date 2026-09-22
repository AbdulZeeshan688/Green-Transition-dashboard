import { memo } from 'react'
import './DashboardGrid.css'

function DashboardGrid({
  left,
  center,
  right,
  driver,
  driverLeft,
  driverRight
}) {
  return (
    <div className="grid-root">

      <div className="grid-main">

        {/* Left sidebar — main content + driver controls at bottom */}
        <aside className="grid-left">
          <div className="grid-left-content">{left}</div>
          <div className="grid-left-bottom">{driverLeft}</div>
        </aside>

        {/* Center — map top, wheel bottom */}
        <div className="grid-center">
          <div className="grid-map">{center}</div>
          <div className="grid-driver">{driver}</div>
        </div>

        {/* Right sidebar — main content + speed at bottom */}
        <aside className="grid-right">
          <div className="grid-right-content">{right}</div>
          <div className="grid-right-bottom">{driverRight}</div>
        </aside>

      </div>

    </div>
  )
}

export default memo(DashboardGrid)
