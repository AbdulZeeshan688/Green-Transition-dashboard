import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';

// Search box with suggestions. `search(query, signal)` returns places
// ({ id, name, detail, coords }); picking one calls onChange(place).
export default function PlaceSearch({ label, icon, iconClass, value, onChange, search, minChars, debounceMs }) {
  const [text, setText] = useState(value?.name ?? '');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const typed = useRef(false);
  const listId = useId();

  // Show the chosen place's name when it changes from outside (e.g. swap).
  useEffect(() => {
    typed.current = false;
    setText(value?.name ?? '');
  }, [value]);

  // Search shortly after the user stops typing.
  useEffect(() => {
    if (!typed.current) return undefined;
    const query = text.trim();
    if (query.length < minChars) {
      setResults([]);
      setStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus('loading');
      search(query, controller.signal)
        .then((places) => {
          setResults(places);
          setActive(places.length ? 0 : -1);
          setStatus('ready');
        })
        .catch((e) => e.name !== 'AbortError' && setStatus('error'));
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, search, minChars, debounceMs]);

  const pick = (place) => {
    onChange(place);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (results.length ? (i + step + results.length) % results.length : -1));
    } else if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && typed.current && text.trim().length >= minChars;

  return (
    <label className="place-search">
      {label}
      <span className="select-wrap">
        <Icon name={icon} size={18} className={iconClass} />
        <input
          type="search"
          value={text}
          placeholder="Search a place or address"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          onChange={(e) => {
            typed.current = true;
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
        />
      </span>
      {showList && (
        <ul className="place-results" id={listId} role="listbox">
          {status === 'loading' && <li className="place-note">Searching…</li>}
          {status === 'error' && <li className="place-note">Search is not available right now.</li>}
          {status === 'ready' && results.length === 0 && <li className="place-note">No places found.</li>}
          {status === 'ready' &&
            results.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : ''}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(p);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <strong>{p.name}</strong>
                {p.detail && <small>{p.detail}</small>}
              </li>
            ))}
        </ul>
      )}
    </label>
  );
}
