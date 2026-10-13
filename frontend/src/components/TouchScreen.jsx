import { useEffect, useState } from 'react';
import Icon from './Icon';
import { CarImage } from './Graphics';
import { fmt } from '../lib/format';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// `panel` is the open touchscreen view ('home' or one of TOUCHSCREEN_PANELS);
// `children` is that panel's content. Items without a link in ui.json stay
// visible but are not clickable.
export default function TouchScreen({
  ui,
  vehicle,
  rangeKm,
  cabinTempC,
  onTempChange,
  climate,
  onOpenTab,
  panel,
  onOpenPanel,
  children,
}) {
  const time = useClock();
  const { sideNav, tiles } = ui.touchscreen;
  const open = (item) => (item.opensPanel ? onOpenPanel(item.opensPanel) : onOpenTab(item.opensTab));
  const isLink = (item) => Boolean(item.opensPanel || item.opensTab);

  return (
    <section className="screen-wrap">
      <h2 className="card-title">Center Touchscreen / Side Panel</h2>
      <div className="screen-frame">
        <div className="screen">
          <div className="status-bar">
            <span>{time}</span>
            <span className="status-icons">
              <Icon name="bluetooth" size={18} />
              <Icon name="signal" size={18} />
              <Icon name="car" size={18} />
              <span>LTE</span>
              <Icon name="user" size={18} />
            </span>
          </div>

          <div className="screen-body">
            <nav className="side-nav" aria-label="Touchscreen">
              {sideNav.map((item) => (
                <button
                  key={item.id}
                  className={`side-item ${item.opensPanel === panel ? 'active' : ''}`}
                  onClick={isLink(item) ? () => open(item) : undefined}
                  disabled={!isLink(item)}
                >
                  <Icon name={item.icon} size={26} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="screen-content">
              {panel !== 'home' ? (
                children
              ) : (
                <>
                  <div className="vehicle-card">
                    <div>
                      <h3>
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="muted">{vehicle.variant}</p>
                      <p className="range-value">
                        {fmt(rangeKm)} {ui.units.distance}
                      </p>
                      <p className="muted">Range</p>
                    </div>
                    <CarImage vehicle={vehicle} />
                  </div>

                  <div className="tile-grid">
                    {tiles.map((tile) => {
                      const content = (
                        <>
                          <Icon name={tile.icon} size={28} />
                          <span>
                            <strong>{tile.title}</strong>
                            <small>{tile.subtitle}</small>
                          </span>
                        </>
                      );
                      const cls = `tile ${tile.wide ? 'wide' : ''}`;
                      return isLink(tile) ? (
                        <button key={tile.id} className={`${cls} link`} onClick={() => open(tile)}>
                          {content}
                        </button>
                      ) : (
                        <div key={tile.id} className={cls}>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="climate-bar">
            <Icon name="seat" size={26} />
            <div className="temp-control">
              <Icon name="chevronLeft" size={20} />
              <button
                aria-label="Lower temperature"
                onClick={() => onTempChange(-climate.climateStepC)}
                disabled={cabinTempC <= climate.climateMinC}
              >
                −
              </button>
              <span className="temp">
                {fmt(cabinTempC, Number.isInteger(cabinTempC) ? 0 : 1)}
                {ui.units.temperature}
              </span>
              <button
                aria-label="Raise temperature"
                onClick={() => onTempChange(climate.climateStepC)}
                disabled={cabinTempC >= climate.climateMaxC}
              >
                +
              </button>
            </div>
            <span className="fan">
              <Icon name="fan" size={24} />
              Auto
            </span>
            <Icon name="seatHeat" size={26} />
            <Icon name="phone" size={24} />
            <Icon name="volume" size={24} />
          </div>
        </div>
      </div>
    </section>
  );
}
