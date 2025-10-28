import { useThemeContext } from '../context/ThemeContext'

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeContext()

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label="Tema claro"
        title="Tema claro"
        className={`mockup-icon-button theme-toggle-icon ${resolvedTheme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
      >
        <SunIcon className="w-[22px] h-[22px]" />
      </button>

      <button
        aria-label="Tema oscuro"
        title="Tema oscuro"
        className={`mockup-icon-button theme-toggle-icon ${resolvedTheme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
      >
        <MoonIcon className="w-[22px] h-[22px]" />
      </button>
    </div>
  )
}