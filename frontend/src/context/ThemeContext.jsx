import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('visioniq-theme')
      // By default light mode should open in (as requested by user)
      if (savedTheme === 'dark') {
        localStorage.setItem('visioniq-theme', 'light')
        return 'light'
      }
      if (savedTheme === 'light') {
        return 'light'
      }
    } catch {
      // ignore
    }
    return 'light'
  })

  useEffect(() => {
    try {
      localStorage.setItem('visioniq-theme', theme)
    } catch {
      // ignore
    }

    const root = document.documentElement
    const body = document.body

    root.setAttribute('data-theme', theme)
    root.style.colorScheme = theme

    if (theme === 'dark') {
      body.classList.remove('light-theme')
      body.classList.add('dark-theme')
    } else {
      body.classList.remove('dark-theme')
      body.classList.add('light-theme')
    }
  }, [theme])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setTheme = (nextTheme) => {
    if (nextTheme === 'dark' || nextTheme === 'light') {
      setThemeState(nextTheme)
    }
  }

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
