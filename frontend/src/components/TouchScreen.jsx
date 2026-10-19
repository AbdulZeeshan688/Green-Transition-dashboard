import { useEffect, useState } from 'react';
import Icon from './Icon';
import { CarImage } from './Graphics';
import { fmt } from '../lib/format';
import { LevelDots } from './CabinPanels';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// `panel` is the open touchscreen view ('home' or one of TOUCHSCREEN_PANELS);
// `children` is that panel's content. Every bottom-bar and status-bar icon is a
// working control; cabin state comes from lib/cabin.js.
export default function TouchScreen({
  ui,
  vehicle,
  rangeKm,
  cabin,
  cabinCfg,
  climate,
  onTemp,
  onSeatHeat,
  onToggleLock,
  onOpenTab,
  panel,
  onOpenPanel,
  children,
}) {
  const time = useClock();
  const { sideNav, tiles } = ui.touchscreen;
  const open = (item) => (item.opensPanel ? onOpenPanel(item.opensPanel) : onOpenTab(item.opensTab));
  const isLink = (item) => Boolean(item.opensPanel || item.opensTab);
  const c = cabin.climate;
  const volume = cabin.audio.muted ? 0 : cabin.audio.volume;
  const seatLevels = cabinCfg.climate.seatHeatLevels;

  return (
    <section className="screen-wrap">
      <h2 className="card-title">Center Touchscreen / Side Panel</h2>
      <div className="screen-frame">
        <div className="screen">
          <div className="status-bar">
            <span>{time}</span>
            <span className="status-icons">
              <span
                className={cabin.phone.bluetooth ? '' : 'off'}
                title={cabin.phone.bluetooth ? 'Bluetooth on' : 'Bluetooth off'}
              >
                <Icon name="bluetooth" size={18} />
              </span>
              <Icon name="signal" size={18} />
              <button
                className="status-btn"
                onClick={onToggleLock}
                aria-label={cabin.body.locked ? 'Unlock doors' : 'Lock doors'}
                title={cabin.body.locked ? 'Doors locked' : 'Doors unlocked'}
              >
                <Icon name={cabin.body.locked ? 'lock' : 'unlock'} size={18} />
              </button>
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
            <button
              className={`bar-btn ${c.seatHeat.driver ? 'on' : ''}`}
              onClick={() => onSeatHeat('driver')}
              aria-label="Driver seat heating"
            >
              <Icon name="seat" size={26} />
              <LevelDots level={c.seatHeat.driver} max={seatLevels} />
            </button>
            <div className="temp-control">
              <button
                className="bar-back"
                aria-label="Back to home"
                onClick={() => onOpenPanel('home')}
                disabled={panel === 'home'}
              >
                <Icon name="chevronLeft" size={20} />
              </button>
              <button
                aria-label="Lower temperature"
                onClick={() => onTemp(-climate.climateStepC)}
                disabled={c.driverTempC <= climate.climateMinC}
              >
                −
              </button>
              <span className="temp">
                {fmt(c.driverTempC, Number.isInteger(c.driverTempC) ? 0 : 1)}
                {ui.units.temperature}
              </span>
              <button
                aria-label="Raise temperature"
                onClick={() => onTemp(climate.climateStepC)}
                disabled={c.driverTempC >= climate.climateMaxC}
              >
                +
              </button>
            </div>
            <button
              className={`bar-btn fan ${panel === 'climate' ? 'on' : ''}`}
              onClick={() => onOpenPanel('climate')}
              aria-label="Climate"
            >
              <Icon name="fan" size={24} />
              {c.fanAuto ? 'Auto' : `Fan ${c.fanLevel}`}
            </button>
            <button
              className={`bar-btn ${c.seatHeat.passenger ? 'on' : ''}`}
              onClick={() => onSeatHeat('passenger')}
              aria-label="Passenger seat heating"
            >
              <Icon name="seatHeat" size={26} />
              <LevelDots level={c.seatHeat.passenger} max={seatLevels} />
            </button>
            <button
              className={`bar-btn ${cabin.phone.call ? 'on call' : ''}`}
              onClick={() => onOpenPanel('phone')}
              aria-label="Phone"
            >
              <Icon name="phone" size={24} />
            </button>
            <button
              className={`bar-btn ${panel === 'audio' ? 'on' : ''}`}
              onClick={() => onOpenPanel('audio')}
              aria-label="Audio"
            >
              <Icon name={volume === 0 ? 'volumeOff' : 'volume'} size={24} />
              <small>{volume}</small>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
