import { useEffect, useState, useCallback } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'theme'

const getSystemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const applyTheme = (pref: ThemePreference) => {
  const resolved = pref === 'system' ? getSystemTheme() : pref
  const root = document.documentElement
  root.dataset.theme = resolved
  root.classList.toggle('dark', resolved === 'dark')
}

export function useTheme(initial?: ThemePreference) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
    return saved ?? initial ?? 'system'
  })
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    theme === 'system' ? getSystemTheme() : theme
  )

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    setResolvedTheme(theme === 'system' ? getSystemTheme() : theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system')
        setResolvedTheme(getSystemTheme())
      }
    }
    mq?.addEventListener?.('change', handler as any)
    return () => mq?.removeEventListener?.('change', handler as any)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, resolvedTheme, setTheme, toggle }
}