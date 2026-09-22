import { useState, useEffect } from 'react'

const THEMES = [
  { name: 'dark-slate',  className: '',                label: 'Dark' },
  { name: 'light',       className: 'theme-light',      label: 'Light' },
]

const STORAGE_KEY = 'ev-dashboard-theme'

// Read theme from body class, then saved preference, then default.
function getInitialIndex() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      const idx = THEMES.findIndex(t => t.name === saved)
      if (idx >= 0) return idx
    }
  } catch {
    // localStorage unavailable (private mode etc.) — fall through
  }
  if (document.body.classList.contains('theme-light')) return 1
  return 0
}

export default function useTheme() {
  const [themeIndex, setThemeIndex] = useState(getInitialIndex)

  useEffect(() => {
    THEMES.forEach((t, i) => {
      if (i === themeIndex) {
        if (t.className) document.body.classList.add(t.className)
      } else {
        if (t.className) document.body.classList.remove(t.className)
      }
    })
    try {
      localStorage.setItem(STORAGE_KEY, THEMES[themeIndex].name)
    } catch {
      // localStorage unavailable — theme still applies for this session
    }
  }, [themeIndex])

  function cycle() {
    setThemeIndex(prev => (prev + 1) % THEMES.length)
  }

  return {
    themeIndex,
    theme: THEMES[themeIndex],
    cycle,
    isDark: themeIndex !== 1,
  }
}