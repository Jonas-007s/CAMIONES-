import { useEffect, useState } from 'react'
import i18n from '../i18n'

export default function LanguageToggle() {
  const [lang, setLang] = useState<string>(i18n.language || 'es')

  useEffect(() => {
    const handler = () => setLang(i18n.language)
    i18n.on('languageChanged', handler)
    return () => { i18n.off('languageChanged', handler) }
  }, [])

  const toggle = () => {
    const next = lang.startsWith('es') ? 'en' : 'es'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
    setLang(next)
  }

  return (
    <button
      onClick={toggle}
      className="mockup-icon-button"
      aria-label="Cambiar idioma"
      title={lang.startsWith('es') ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="text-sm font-semibold">{lang.startsWith('es') ? 'ES' : 'EN'}</span>
    </button>
  )
}