/**
 * Utilidades compartidas para la aplicación
 */

/**
 * Formatea una duración en milisegundos a un formato corto (Xh Ym o Ym Zs)
 */
export const formatDurationShort = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return '-'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

/**
 * Construye la URL completa para una foto
 */
export const buildPhotoSrc = (url: string | null) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  
  const backendOrigin = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_ORIGIN) || ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  
  if (url.startsWith('/uploads/')) {
    return backendOrigin ? `${backendOrigin}${url}` : url
  }
  return `${origin}${url}`
}