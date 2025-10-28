import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { login as apiLogin, listTrucks, exitTruck, subscribeRealtime, exportTrucks, type Truck, type FilterOptions, type TrucksResponse, enterTruck, markNeverEnter, registerTruck, registerWaitingTruck } from './api'
import { useBranding } from './components/BrandingConfig'
import ThemeToggle from './components/ThemeToggle'
import { formatDurationShort, buildPhotoSrc } from './utils'
import { supabaseReady } from './api.supabase'

// Iconos SVG
const CheckIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
)

// Eliminado: TruckIcon (no usado)


const PhotoIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className || "w-5 h-5"} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)



const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h5a2 2 0 012 2v2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16v2a2 2 0 01-2 2H7" />
  </svg>
)


const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const DownloadIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)



// El componente PhotoModal ha sido eliminado

// Modal de detalles del camión
function TruckDetailsModal({ truck, onClose }: { truck: Truck; onClose: () => void }) {
  const photoSrc = buildPhotoSrc(truck.photoUrl ?? null)
  return createPortal(
    <div className="fixed inset-0 bg-slate-900/85 flex items-center justify-center z-[210] p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-slate-800/60 border border-slate-600/40 rounded-xl p-6 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        <button className="absolute right-4 top-4 text-white/90 hover:text-white" onClick={onClose} title="Cerrar">
          <CloseIcon />
        </button>
        <div className="flex items-start gap-6">
          {photoSrc ? (
            <img src={photoSrc} alt="Foto del camión" className="w-40 h-40 object-cover rounded-lg border border-slate-500/40" />
          ) : (
            <div className="w-40 h-40 rounded-lg border border-slate-500/40 bg-slate-900/40 grid place-items-center text-slate-300">Sin foto</div>
          )}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              {/* Primera fila */}
              <div className="truck-detail-field">
                <div className="text-slate-400 text-sm mb-1">Patente</div>
                <div className="text-slate-200 font-bold text-lg">{truck.plate}</div>
              </div>
              <div className="truck-detail-field">
                <div className="text-slate-400 text-sm mb-1">Conductor</div>
                <div className="text-slate-200 font-semibold">{truck.driver || 'N/D'}</div>
              </div>
              
              {/* Segunda fila */}
              <div className="truck-detail-field">
                <div className="text-slate-400 text-sm mb-1">Empresa</div>
                <div className="text-slate-200 font-semibold">{truck.transporter || 'N/D'}</div>
              </div>
              <div className="truck-detail-field">
                <div className="text-slate-400 text-sm mb-1">Área</div>
                <div className="text-slate-200 font-semibold">{truck.area}</div>
              </div>
              
              {/* Tercera fila */}
              <div className="truck-detail-field">
                <div className="text-slate-400 text-sm mb-1">Estado</div>
                <div className="text-slate-200 font-semibold">{truck.status}</div>
              </div>
              <div className="truck-detail-field">
                <div className="text-slate-400 text-sm mb-1">Registrado</div>
                <div className="text-slate-200 font-semibold">{new Date(truck.createdAt).toLocaleString('es-ES')}</div>
              </div>
              
              {/* Cuarta fila */}
              <div className="truck-detail-field col-span-2">
                <div className="text-slate-400 text-sm mb-1">Registrado por</div>
                <div className="text-slate-200 font-semibold">{truck.guardName || (truck.waitingBy ? truck.waitingBy.split('@')[0].replace('.', ' ') : 'N/D')}</div>
              </div>
              
              {/* Notas si existen */}
              {truck.notes && (
                <div className="truck-detail-field col-span-2">
                  <div className="text-slate-400 text-sm mb-1">Notas</div>
                  <div className="text-slate-200">{truck.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Modal de archivo por patente
function PlateArchiveModal({ plate, onClose, onPhoto }: { plate: string; onClose: () => void; onPhoto?: (url: string) => void }) {
  const [records, setRecords] = useState<Truck[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    listTrucks({
      status: 'all',
      search: plate,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
      .then((res) => { setRecords(res.trucks) })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error al cargar archivo'))
      .finally(() => setLoading(false))
  }, [plate])

  const statusClass = (s: string) => (s === 'Ingreso' ? 'ingreso' : s === 'Salida' ? 'salida' : 'espera')
  const areaClass = (a: string) => a.toLowerCase()

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[220] p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl bg-slate-800/60 border border-slate-600/40 rounded-xl p-6 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        <button className="absolute right-4 top-4 text-white/90 hover:text-white" onClick={onClose} title="Cerrar">
          <CloseIcon />
        </button>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-slate-200 font-bold text-xl">Archivo de patente</div>
            <div className="text-cyan-400 font-extrabold text-2xl tracking-widest">{plate}</div>
          </div>
          <div className="area-badge otros">{records.length} registros</div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-300">Cargando archivo...</div>
        ) : error ? (
          <div className="modern-error-message">
            <span>⚠️</span>
            <div>
              <div className="font-semibold text-slate-200">No se pudo cargar el archivo</div>
              <div className="text-slate-400 text-sm">{error}</div>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Sin registros para esta patente</div>
            <div className="empty-subtitle">Prueba con otra búsqueda o verifica filtros.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {records.map((t) => (
              <div key={t.id} className="dashboard-truck-card p-4 rounded-lg border border-slate-600/30 bg-slate-900/30">
                <div className="flex items-center gap-3 mb-3">
                  {t.photoUrl ? (
                    <button className="photo-thumb-premium" onClick={() => onPhoto?.(buildPhotoSrc(t.photoUrl ?? null))} title="Ver foto">
                      <img className="w-12 h-12 rounded-md object-cover" src={buildPhotoSrc(t.photoUrl ?? null)} alt="Foto" />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-md border border-slate-500/40 bg-slate-900/40 grid place-items-center text-slate-300">Sin foto</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="truck-plate-premium">{t.plate}</span>
                      <span className={`status-badge ${statusClass(t.status)}`}>{t.status}</span>
                      <span className={`area-badge ${areaClass(t.area)}`}>{t.area}</span>
                    </div>
                    <div className="text-slate-300 text-sm">{new Date(t.createdAt).toLocaleString('es-ES')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div><span className="text-slate-400">Conductor: </span><span>{t.driver || 'N/D'}</span></div>
                  <div><span className="text-slate-400">Empresa: </span><span>{t.transporter || 'N/D'}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Login() {
  const navigate = useNavigate()
  const [guardName, setGuardName] = useState('')
  const [guardLastName, setGuardLastName] = useState('')
  const [role, setRole] = useState<'Guardia' | 'Operador' | 'Admin'>('Guardia')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { branding } = useBranding()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const email = `${guardName.toLowerCase()}.${guardLastName.toLowerCase()}@empresa.com`
      const displayName = `${guardName} ${guardLastName}`.trim()
      const { token, role: r, name } = await apiLogin(email, role, displayName)
      localStorage.setItem('token', token)
      localStorage.setItem('role', r)
      localStorage.setItem('guardName', name || displayName)
      // Redirigir al formulario principal para Guardia
      if (r === 'Guardia') navigate('/formulario')
      else navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mockup-page mockup-animate-in login-premium-container">
      <div className="mockup-card login-premium-card">
        {/* Icono Check - Estilo Premium */}
        <div className="mockup-check-icon login-premium-icon">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain login-premium-logo" />
          ) : (
            <CheckIcon />
          )}
        </div>
        
        {/* Título y Subtítulo - Estilo Premium */}
        <h1 className="mockup-title login-premium-title">{branding.companyName}</h1>
        <p className="mockup-subtitle login-premium-subtitle">Ingrese sus datos para continuar</p>
        
        {/* Formulario - Estilo Premium */}
        <form onSubmit={handleSubmit} className="login-premium-form">
          <input 
            className="mockup-input login-premium-input" 
            placeholder="Nombre" 
            value={guardName} 
            onChange={(e) => setGuardName(e.target.value)}
            required
          />
          
          <input 
            className="mockup-input login-premium-input" 
            placeholder="Apellido" 
            value={guardLastName} 
            onChange={(e) => setGuardLastName(e.target.value)}
            required
          />
          
          <select 
            className="mockup-select login-premium-select" 
            value={role} 
            onChange={(e) => setRole(e.target.value as 'Guardia' | 'Operador' | 'Admin')}
          >
            <option value="Guardia">👮‍♂️ Guardia</option>
            <option value="Operador">👷‍♂️ Operador</option>
            <option value="Admin">👨‍💼 Administración</option>
          </select>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4 login-premium-error">
              {error}
            </div>
          )}
          
          <button 
            disabled={loading || !guardName || !guardLastName} 
            className={`mockup-button login-premium-button ${loading ? 'mockup-loading' : ''}`}
          >
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>
        
        <p className="text-xs text-center mt-6 text-gray-500 login-premium-footer">
          Sistema de gestión de transporte nefab
        </p>
      </div>
    </div>
  )
}

// Formulario principal de Guardia (registro de ingreso)
function GuardiaRegistro() {
  const [plate, setPlate] = useState('')
  const [driver, setDriver] = useState('')
  const [transporter, setTransporter] = useState('')
  const [area, setArea] = useState<Truck['area']>('Inbound')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [regType, setRegType] = useState<'Ingreso' | 'Espera'>('Ingreso')
  const [msg, setMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  const { branding } = useBranding()
  
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  // Auto-ocultar banner de mensaje después de 3 segundos
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [msg])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!plate.trim() || !driver.trim() || !transporter.trim()) {
      setMsg('❌ Complete patente, conductor y empresa')
      return
    }
    setLoading(true)
    try {
      const payload = { plate: plate.trim().toUpperCase(), driver: driver.trim(), transporter: transporter.trim(), area, photo }
      if (regType === 'Ingreso') {
        await registerTruck(payload)
        setMsg('✅ Ingreso registrado correctamente')
      } else {
        await registerWaitingTruck(payload)
        setMsg('✅ Registro en espera creado correctamente')
      }
      setPlate('')
      setDriver('')
      setTransporter('')
      setArea('Inbound')
      setPhoto(null)
      setRegType('Ingreso')
    } catch (error: unknown) {
      setMsg(`❌ ${error instanceof Error ? error.message : 'Error al registrar ingreso'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mockup-page mockup-animate-in login-premium-container">
      <div className="mockup-card login-premium-card">
        {/* Icono Check - Estilo Premium */}
        <div className="mockup-check-icon login-premium-icon">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain login-premium-logo" />
          ) : (
            <CheckIcon />
          )}
        </div>
        
        {/* Título y Subtítulo - Estilo Premium */}
        <h1 className="mockup-title login-premium-title">
          {regType === 'Ingreso' ? 'Formulario de Ingreso' : 'Registrar en Espera'}
        </h1>
        <p className="mockup-subtitle login-premium-subtitle">
          {regType === 'Ingreso' ? 'Complete los datos del camión para registrar el ingreso' : 'Complete los datos para registrar en espera'}
        </p>
        
        {/* Formulario - Estilo Premium */}
        <form onSubmit={handleSubmit} className="login-premium-form">
          <input 
            className="mockup-input login-premium-input" 
            placeholder="Patente" 
            value={plate} 
            onChange={(e) => setPlate(e.target.value)}
            required
          />
          
          <input 
            className="mockup-input login-premium-input" 
            placeholder="Conductor" 
            value={driver} 
            onChange={(e) => setDriver(e.target.value)}
            required
          />
          
          <input 
            className="mockup-input login-premium-input" 
            placeholder="Empresa" 
            value={transporter} 
            onChange={(e) => setTransporter(e.target.value)}
            required
          />
          
          <select 
            className="mockup-select login-premium-select" 
            value={regType} 
            onChange={(e) => setRegType(e.target.value as 'Ingreso' | 'Espera')}
          >
            <option value="Ingreso">🚛 Ingreso</option>
            <option value="Espera">⏳ En espera</option>
          </select>
          
          <select 
            className="mockup-select login-premium-select" 
            value={area} 
            onChange={(e) => setArea(e.target.value as Truck['area'])}
          >
            <option value="Inbound">📥 Inbound</option>
            <option value="Outbound">📤 Outbound</option>
            <option value="Otros">📋 Otros</option>
          </select>
          
          {/* Botón de foto */}
          <div className="flex items-center gap-4 flex-wrap">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            <button type="button" className="mockup-button photo-button-compact" onClick={() => fileInputRef.current?.click()} title="Adjuntar fotografía">
              <PhotoIcon className="w-5 h-5 mr-2" style={{color: '#ffffff !important', width: '20px !important', height: '20px !important', minWidth: '20px !important', minHeight: '20px !important', flexShrink: '0 !important'}} />
              <span className="text-white font-medium">Foto</span>
            </button>
            {photo && previewUrl && (
              <div className="photo-preview-compact shadow-md rounded-lg overflow-hidden">
                <img src={previewUrl} alt="Previsualización" className="w-full h-full object-cover" />
                <button type="button" className="photo-remove-btn hover:bg-red-600 transition-colors duration-200" onClick={() => setPhoto(null)} title="Quitar foto">
                  <CloseIcon />
                </button>
              </div>
            )}
          </div>
          
          {msg && (
            <div className={`p-3 border rounded-lg text-sm mb-4 ${msg.includes('✅') ? 'bg-green-50 border-green-200 text-green-700 login-premium-success' : 'bg-red-50 border-red-200 text-red-700 login-premium-error'}`}>
              {msg}
            </div>
          )}
          
          <button 
            disabled={loading || !plate || !driver || !transporter} 
            className={`mockup-button login-premium-button ${loading ? 'mockup-loading' : ''}`}
          >
            {loading ? 'Registrando...' : (regType === 'Ingreso' ? 'Registrar Ingreso' : 'Registrar en Espera')}
          </button>
        </form>
        
        <p className="text-xs text-center mt-6 text-gray-500 login-premium-footer">
          Sistema de gestión de transporte nefab
        </p>
      </div>
    </div>
  )
}


function Dashboard() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [waiting, setWaiting] = useState<Truck[]>([])
  // Estado selectedPhoto eliminado
  const [selectedPlateArchive, setSelectedPlateArchive] = useState<string | null>(null)
  const [selectedDashboardTruckId, setSelectedDashboardTruckId] = useState<string | null>(null)

  const [exitingTrucks, setExitingTrucks] = useState<Set<string>>(new Set())
  const [exitMessage, setExitMessage] = useState<string | null>(null)
  const [collapsedAreas, setCollapsedAreas] = useState<Record<string, boolean>>({ Inbound: false, Outbound: false, Otros: false })
  const [nowTs, setNowTs] = useState<number>(Date.now())
  const [connectionMode, setConnectionMode] = useState<'sse' | 'polling' | null>(null)
  const cardRefsDash = useRef<Record<string, HTMLDivElement | null>>({})
  const areaContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [areaScrollVisible, setAreaScrollVisible] = useState<Record<string, boolean>>({})
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : 'Operador'

  

  // Registrar cambios del modo de conexión para evitar variable sin uso y facilitar depuración
  useEffect(() => {
    if (connectionMode) {
      console.debug('[Modo de conexión]', connectionMode)
    }
  }, [connectionMode])



   const handleAreaScroll = (area: string, e: React.UIEvent<HTMLDivElement>) => {
     const el = e.currentTarget
     setAreaScrollVisible(prev => ({ ...prev, [area]: el.scrollTop > 120 }))
   }

   const scrollAreaToTop = (area: string) => {
     const el = areaContainerRefs.current[area]
     if (el) {
       el.scrollTo({ top: 0, behavior: 'smooth' })
     } else {
       window.scrollTo({ top: 0, behavior: 'smooth' })
     }
   }

  useEffect(() => {
    let mounted = true
    listTrucks({ status: 'inside' }).then((data) => {
      if (mounted) setTrucks(data.trucks)
    }).catch(() => {})
    // Cargar camiones en espera
    listTrucks({ status: 'waiting' }).then((data) => {
      if (mounted) setWaiting(data.trucks)
    }).catch(() => {})
    
    const es = subscribeRealtime(
      (initial) => setTrucks(initial),
      (t) => setTrucks((prev) => [t, ...prev]),
      (t) => setTrucks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
      {
        onWaitingInitial: (initial) => setWaiting(initial),
        onWaitingNew: (t) => setWaiting((prev) => [t, ...prev]),
        onWaitingUpdate: (t) => setWaiting((prev) => prev.map((x) => (x.id === t.id ? t : x))),
        onConnectionChange: (mode) => setConnectionMode(mode)
      }
    )
    return () => {
      mounted = false
      es.close()
    }
  }, [])

  // Actualizar cada segundo para cronómetros de espera/tiempo en planta
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Limpiar mensaje después de 3 segundos
  useEffect(() => {
    if (exitMessage) {
      const timer = setTimeout(() => setExitMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [exitMessage])

  const insideByArea = useMemo(() => {
    const map: Record<string, Truck[]> = { Inbound: [], Outbound: [], Otros: [] }
    for (const t of trucks) {
      const isInside = !t.exitAt
      if (isInside) map[t.area]?.push(t)
    }
    return map
  }, [trucks])

  const waitingByArea = useMemo(() => {
    const map: Record<string, Truck[]> = { Inbound: [], Outbound: [], Otros: [] }
    for (const t of waiting) {
      map[t.area]?.push(t)
    }
    return map
  }, [waiting])

  const handleExit = async (id: string) => {
    if (exitingTrucks.has(id)) return // Prevenir doble clic
    
    setExitingTrucks(prev => new Set(prev).add(id))
    
    try {
      await exitTruck(id)
      setExitMessage('✅ Salida registrada correctamente')
      
      // Actualizar la lista local inmediatamente para mejor UX
      setTrucks(prev => prev.map(truck => 
        truck.id === id 
          ? { ...truck, status: 'Salida' as const, exitAt: new Date().toISOString() }
          : truck
      ))
    } catch (error: unknown) {
      setExitMessage(`❌ Error: ${error instanceof Error ? error.message : 'No se pudo registrar la salida'}`)
    } finally {
      setExitingTrucks(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  // Eliminado: función de exportación por área (ya no se usa)

  const toggleCollapseArea = (area: string) => {
    setCollapsedAreas(prev => ({ ...prev, [area]: !prev[area] }))
  }

  const toggleSelectDashboardTruck = (truckId: string) => {
    setSelectedDashboardTruckId(prev => prev === truckId ? null : truckId)
  }

  const getAreaConfig = (area: string) => {
    switch (area) {
      case 'Inbound':
        return {
          icon: (
            <div className="area-icon-container">
              <svg className="area-icon-svg" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="inboundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <path 
                  d="M12 2L2 7L12 12L22 7L12 2Z" 
                  fill="url(#inboundGradient)" 
                  className="icon-path-primary"
                />
                <path 
                  d="M2 17L12 22L22 17" 
                  stroke="url(#inboundGradient)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="icon-path-secondary"
                />
                <path 
                  d="M2 12L12 17L22 12" 
                  stroke="url(#inboundGradient)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="icon-path-accent"
                />
              </svg>
              <div className="area-icon-pulse inbound"></div>
            </div>
          ),
          title: 'Inbound',
          subtitle: 'Entrada de vehículos',
          gradient: 'from-blue-500/20 via-cyan-500/15 to-blue-600/20',
          borderColor: 'border-blue-400/40',
          accentColor: 'text-blue-300',
          glowColor: 'shadow-blue-500/20'
        }
      case 'Outbound':
        return {
          icon: (
            <div className="area-icon-container">
              <svg className="area-icon-svg" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="outboundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                <path 
                  d="M9 17H7A2 2 0 0 1 5 15V7A2 2 0 0 1 7 5H17A2 2 0 0 1 19 7V10" 
                  stroke="url(#outboundGradient)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="icon-path-primary"
                />
                <path 
                  d="M14 15L17 18L20 15" 
                  stroke="url(#outboundGradient)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="icon-path-accent"
                />
                <path 
                  d="M17 18V12" 
                  stroke="url(#outboundGradient)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  className="icon-path-secondary"
                />
              </svg>
              <div className="area-icon-pulse outbound"></div>
            </div>
          ),
          title: 'Outbound',
          subtitle: 'Salida de vehículos',
          gradient: 'from-orange-500/20 via-red-500/15 to-orange-600/20',
          borderColor: 'border-orange-400/40',
          accentColor: 'text-orange-300',
          glowColor: 'shadow-orange-500/20'
        }
      default:
        return {
          icon: (
            <div className="area-icon-container">
              <svg className="area-icon-svg" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="otrosGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <rect 
                  x="3" y="3" width="18" height="18" rx="2" 
                  stroke="url(#otrosGradient)" 
                  strokeWidth="2"
                  className="icon-path-primary"
                />
                <path 
                  d="M9 9H15V15H9V9Z" 
                  fill="url(#otrosGradient)" 
                  className="icon-path-secondary"
                />
                <circle 
                  cx="12" cy="12" r="2" 
                  fill="white" 
                  className="icon-path-accent"
                />
              </svg>
              <div className="area-icon-pulse otros"></div>
            </div>
          ),
          title: 'Otros',
          subtitle: 'Área Otros',
          gradient: 'from-purple-500/20 via-pink-500/15 to-purple-600/20',
          borderColor: 'border-purple-400/40',
          accentColor: 'text-purple-300',
          glowColor: 'shadow-purple-500/20'
        }
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header Premium con efectos visuales avanzados */}
        <div className="dashboard-premium-header">
          <div className="dashboard-header-background"></div>
          <div className="dashboard-header-content">
            <div className="dashboard-title-container">
              <div className="dashboard-title-icon">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="dashboardIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="25%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="75%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="dashboardIconGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    stroke="url(#dashboardIconGradient)"
                    filter="url(#dashboardIconGlow)"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                </svg>
              </div>
              <div className="dashboard-title-text">
                <h1 className="dashboard-premium-title">Centro de Control Logístico Nefab</h1>
                <p className="dashboard-premium-subtitle">Monitoreo avanzado en tiempo real</p>
              </div>
            </div>
            
            {/* Indicadores de estado premium */}
            <div className="dashboard-status-indicators">
              <div className="status-indicator active">
                <div className="status-dot">
                  <svg className="w-3 h-3" viewBox="0 0 12 12">
                    <defs>
                      <radialGradient id="activeDotGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </radialGradient>
                    </defs>
                    <circle cx="6" cy="6" r="6" fill="url(#activeDotGradient)" />
                </svg>
              </div>
              <span>Ingresados</span>
              </div>
              <div className="status-indicator waiting">
                <div className="status-pulse waiting">
                  <svg className="w-3 h-3" viewBox="0 0 12 12">
                    <defs>
                      <linearGradient id="waitingDotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <circle cx="6" cy="6" r="6" fill="url(#waitingDotGradient)" />
                  </svg>
                </div>
                <span>En espera</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de feedback */}
        {exitMessage && (
          <div className={`modern-message ${exitMessage.includes('✅') ? 'success' : 'error'}`}>
            {exitMessage}
          </div>
        )}

        <div className="dashboard-grid">
          {(['Inbound','Outbound','Otros'] as const).map((area) => {
            const config = getAreaConfig(area)

            return (
              <div key={area} className={`premium-dashboard-card ${config.glowColor} ${collapsedAreas[area] ? 'collapsed' : ''}`}>
                <div className="card-header-premium">
                  <div className="area-header-container">
                    <div className="area-icon-wrapper">
                      {config.icon}
                    </div>
                    <div className="area-title-section">
                      <h3 className="area-title-premium">
                        {config.title}
                      </h3>
                      <p className="area-subtitle-premium">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="area-controls">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleCollapseArea(area) }}
                      className="expand-button"
                      title={collapsedAreas[area] ? "Expandir área" : "Colapsar área"}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '16px',
                        transform: collapsedAreas[area] ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.2s ease'
                      }}
                      aria-expanded={!collapsedAreas[area]}
                      aria-controls={`area-${area}-content`}
                    >
                      ▼
                    </button>
                  </div>
                </div>
                
                {!collapsedAreas[area] && (
                <div 
                  id={`area-${area}-content`}
                  className="trucks-container-premium"
                  onScroll={(e) => handleAreaScroll(area, e)}
                  ref={(el) => { areaContainerRefs.current[area] = el }}
                >
                  {waitingByArea[area].map((t) => (
                    <div 
                      key={t.id} 
                      className={`truck-card-premium ${selectedDashboardTruckId === t.id ? 'expanded' : 'collapsed'}`}
                      ref={(el) => { cardRefsDash.current[t.id] = el }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.exit-button-premium') || target.closest('.photo-thumb-premium')) return
                        toggleSelectDashboardTruck(t.id)
                      }}
                    >
                      <div className="truck-card-header">
                        <button 
                          className="truck-plate-premium"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectDashboardTruck(t.id)
                            setSelectedPlateArchive(t.plate)
                          }}
                        >
                          {t.plate.replace(/\s/g, '').split('').map((ch, i) => (
                            <span key={i} className="dashboard-plate-char">{ch}</span>
                          ))}
                        </button>
                        <div className="truck-status-indicator waiting"></div>
                      </div>
                      <div className="truck-details-grid">
                        <div className="detail-item">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Conductor</span>
                            <span className="detail-value">{t.driver || '-'}</span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Empresa</span>
                            <span className="detail-value">{t.transporter || '-'}</span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Espera desde</span>
                            <span className="detail-value">
                              {new Date(t.waitingAt || t.createdAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="detail-item highlight">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Tiempo en espera</span>
                            <span className="detail-value-highlight">
                              {formatDurationShort(nowTs - new Date(t.waitingAt || t.createdAt).getTime())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {insideByArea[area].map((t) => (
                    <div 
                      key={t.id} 
                      className={`truck-card-premium ${selectedDashboardTruckId === t.id ? 'expanded' : 'collapsed'}`}
                      ref={(el) => { cardRefsDash.current[t.id] = el }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.exit-button-premium') || target.closest('.photo-thumb-premium')) return
                        toggleSelectDashboardTruck(t.id)
                      }}
                    >
                      <div className="truck-card-header">
                        <button 
                          className="truck-plate-premium"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelectDashboardTruck(t.id)
                            setSelectedPlateArchive(t.plate)
                          }}
                        >
                          {t.plate.replace(/\s/g, '').split('').map((ch, i) => (
                            <span key={i} className="dashboard-plate-char">{ch}</span>
                          ))}
                        </button>
                        <div className="truck-status-indicator active"></div>
                      </div>
                      
                      <div className="truck-details-grid">
                        <div className="detail-item">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Conductor</span>
                            <span className="detail-value">{t.driver}</span>
                          </div>
                        </div>
                        
                        <div className="detail-item">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Empresa</span>
                            <span className="detail-value">{t.transporter}</span>
                          </div>
                        </div>
                        
                        <div className="detail-item">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Ingreso</span>
                            <span className="detail-value">
                              {new Date(t.createdAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="detail-item highlight">
                          <div className="detail-icon">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="detail-content">
                            <span className="detail-label">Tiempo en planta</span>
                            <span className="detail-value-highlight">
                              {(() => {
                                const entry = new Date(t.createdAt)
                                const diffMs = nowTs - entry.getTime()
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                                return `${diffHours}h ${diffMinutes}m`
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="truck-actions-premium">
                        {t.photoUrl && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation() } }
                            className="photo-thumb-premium"
                            title="Ver fotografía del vehículo"
                          >
                            <img
                              src={t.photoUrl && t.photoUrl.startsWith('/uploads/') ? (import.meta.env?.VITE_BACKEND_ORIGIN ? `${import.meta.env.VITE_BACKEND_ORIGIN}${t.photoUrl}` : t.photoUrl) : (t.photoUrl || '')}
                              alt="Fotografía del vehículo"
                              loading="lazy"
                              className="photo-thumb-img"
                            />
                          </button>
                        )}
                        
                        {(role === 'Guardia') ? (
                          <button 
                            onClick={() => handleExit(t.id)} 
                            className={`exit-button-premium ${exitingTrucks.has(t.id) ? 'loading' : ''}`}
                            disabled={exitingTrucks.has(t.id)}
                            title="Registrar salida del vehículo"
                          >
                            {exitingTrucks.has(t.id) ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                <span>Registrando...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Registrar Salida</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="readonly-indicator">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Solo lectura</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Eliminado: botón 'Ver más' / 'Mostrar menos' para simplificar controles del área */}
                  
                  {insideByArea[area].length === 0 && (
                    <div className="empty-state-premium">
                      <div className="empty-icon">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div className="empty-title">Área disponible</div>
                      <div className="empty-subtitle">Los vehículos aparecerán aquí cuando ingresen a esta zona</div>
                    </div>
                  )}
                </div>
                )}

                {!collapsedAreas[area] && areaScrollVisible[area] && (
                  <button 
                    className="area-scroll-top-btn" 
                    onClick={() => scrollAreaToTop(area)} 
                    title="Ir arriba"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Vista de foto eliminada */}
      {selectedPlateArchive && (
        <PlateArchiveModal 
          plate={selectedPlateArchive} 
          onClose={() => setSelectedPlateArchive(null)}
          /* onPhoto eliminado */
        />
      )}
    </div>
  )
}

function EsperaAfuera() {
  const [waiting, setWaiting] = useState<Truck[]>([])
  const [inside, setInside] = useState<Truck[]>([])
  const [cardAreas, setCardAreas] = useState<Record<string, Truck['area']>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
  const [nowTs, setNowTs] = useState<number>(Date.now())
  const COMPACT_COUNT = 6
  const FULL_COUNT = Number.MAX_SAFE_INTEGER
  const [showCount, setShowCount] = useState<Record<Truck['area'], number>>({ Inbound: FULL_COUNT, Outbound: FULL_COUNT, Otros: FULL_COUNT })
  const [collapsed, setCollapsed] = useState<Record<Truck['area'], boolean>>({ Inbound: false, Outbound: false, Otros: false })
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null)
  // Estado selectedPhoto eliminado
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [showScrollTop, setShowScrollTop] = useState(false)

  const toggleSelectedTruck = (truck: Truck) => {
    setSelectedTruck(prev => (prev?.id === truck.id ? null : truck))
    // Desplazar la tarjeta seleccionada al inicio de la vista
    requestAnimationFrame(() => {
      const el = cardRefs.current[truck.id]
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-ocultar banner de mensaje después de 3 segundos
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [msg])

  // Usando la función formatDurationShort importada desde utils.ts

  useEffect(() => {
    let mounted = true
    listTrucks({ status: 'waiting' }).then((data) => {
      if (mounted) setWaiting(data.trucks)
    }).catch(() => {})
    // Cargar camiones activos para contadores
    listTrucks({ status: 'inside' }).then((data) => {
      if (mounted) setInside(data.trucks)
    }).catch(() => {})
    const es = subscribeRealtime(
      // Eventos tiempo real de camiones activos (inside)
      (initial) => setInside(initial),
      (t) => setInside(prev => [t, ...prev]),
      (t) => setInside(prev => prev.map(x => x.id === t.id ? t : x).filter(x => (x as any).status === 'inside')),
      {
        onWaitingInitial: (initial) => setWaiting(initial),
        onWaitingNew: (t) => setWaiting(prev => [t, ...prev]),
        onWaitingUpdate: (t) => setWaiting(prev => prev.map(x => x.id === t.id ? t : x))
      }
    )
    return () => { mounted = false; es.close() }
  }, [])

  const handleEnter = async (id: string, targetArea: Truck['area']) => {
    try {
      await enterTruck(id, targetArea)
      setMsg('✅ Camión ingresó correctamente')
      setWaiting(prev => prev.filter(x => x.id !== id))
    } catch (error: unknown) {
      setMsg(`❌ Error: ${error instanceof Error ? error.message : 'No se pudo ingresar'}`)
    }
  }

  const [showReasonInput, setShowReasonInput] = useState<Record<string, boolean>>({})
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({})

  const handleNeverEnterClick = (id: string) => {
    setShowReasonInput(prev => ({ ...prev, [id]: true }))
  }

  const handleNeverEnter = async (id: string) => {
    const reason = reasonInputs[id] || ''
    try {
      await markNeverEnter(id, reason)
      setMsg('✅ Marcado como "No ingresa"')
      setWaiting(prev => prev.filter(x => x.id !== id))
      // Limpiar el estado después de completar
      setShowReasonInput(prev => ({ ...prev, [id]: false }))
      setReasonInputs(prev => ({ ...prev, [id]: '' }))
    } catch (error: unknown) {
      setMsg(`❌ Error: ${error instanceof Error ? error.message : 'No se pudo marcar'}`)
    }
  }


  const toggleCollapse = (area: Truck['area']) => {
    setCollapsed(prev => ({ ...prev, [area]: !prev[area] }))
  }

  // Agrupar por área y ordenar por mayor tiempo en espera primero
  const waitingByArea = useMemo(() => {
    const map: Record<Truck['area'], Truck[]> = { Inbound: [], Outbound: [], Otros: [] }
    for (const t of waiting) {
      map[t.area].push(t)
    }
    const sortByWaiting = (a: Truck, b: Truck) => {
      const aStart = new Date(a.waitingAt || a.createdAt).getTime()
      const bStart = new Date(b.waitingAt || b.createdAt).getTime()
      return aStart - bStart
    }
    map.Inbound.sort(sortByWaiting)
    map.Outbound.sort(sortByWaiting)
    map.Otros.sort(sortByWaiting)
    return map
  }, [waiting])

  // Contadores eliminados del header de área

  // getAreaIcon eliminado: no mostramos íconos en el header de área

  return (
    <div className="espera-dashboard-container">
      {/* Header Premium */}
      <div className="espera-header">
        <div className="espera-header-content">
          <div className="espera-title-container">
            <div className="espera-title-text">
              <h1 className="espera-main-title">En Espera</h1>
              <p className="espera-subtitle">Gestión de camiones en espera por área</p>
            </div>
          </div>
          <div className="espera-stats-summary">
            <div className="espera-stat-item">
              <span className="espera-stat-number">{waiting.length}</span>
              <span className="espera-stat-label">Total en espera</span>
            </div>
            <div className="espera-stat-item">
              <span className="espera-stat-number">{inside.length}</span>
              <span className="espera-stat-label">Total activos</span>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`espera-message-banner ${msg.includes('✅') ? 'success' : 'error'}`}>{msg}</div>
      )}

      {/* Areas Grid */}
      <div className="espera-areas-grid">
        {(['Inbound','Outbound','Otros'] as const).map((areaKey) => (
          <div key={areaKey} className="espera-area-card">
            {/* Area Header */}
            <div className="espera-area-header">
              <div className="espera-area-title-section">
                <div className="espera-area-info">
                  <h3 className="espera-area-title">{areaKey}</h3>
                  <p className="espera-area-subtitle">Área {areaKey}</p>
                </div>
              </div>
              <div className="espera-header-bottom">
                <div className="espera-header-actions">
                  <button
                    className="espera-text-btn"
                    onClick={() => toggleCollapse(areaKey)}
                    title={collapsed[areaKey] ? `Expandir ${areaKey}` : `Colapsar ${areaKey}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '16px',
                      transform: collapsed[areaKey] ? 'rotate(0deg)' : 'rotate(180deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>

            {/* Trucks List */}
            {!collapsed[areaKey] && (
              <div className="espera-trucks-container">
              {waitingByArea[areaKey].length === 0 ? (
                <div className="espera-empty-state">
                  <h4 className="espera-empty-title">Área disponible</h4>
                  <p className="espera-empty-subtitle">No hay camiones esperando en esta área</p>
                </div>
              ) : (
                <>
                  {waitingByArea[areaKey].slice(0, showCount[areaKey]).map((truck) => (
                    <div
                      key={truck.id}
                      className={`espera-truck-card ${selectedTruck?.id === truck.id ? 'expanded' : 'collapsed'}`}
                      ref={(el) => { cardRefs.current[truck.id] = el }}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.espera-action-btn') || target.closest('.espera-area-select')) return
                        toggleSelectedTruck(truck)
                      }}
                    >
                      <div className="espera-truck-header">
                        <button className="espera-truck-plate cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleSelectedTruck(truck) }} title="Ver detalles">
                          {truck.plate.replace(/\s/g, '').split('').map((ch, i) => (
                            <span key={i} className="espera-plate-char">{ch}</span>
                          ))}
                        </button>
                        <div className="espera-truck-status">
                          <span className="espera-status-text">En espera</span>
                        </div>
                      </div>
                      
                      <div className="espera-truck-details">
                        <div className="espera-detail-row">
                          <span className="espera-detail-label">Conductor:</span>
                          <span className="espera-detail-value">{truck.driver?.toUpperCase()}</span>
                        </div>
                        <div className="espera-detail-row">
                          <span className="espera-detail-label">Empresa:</span>
                          <span className="espera-detail-value">{truck.transporter}</span>
                        </div>
                        <div className="espera-detail-row">
                          <span className="espera-detail-label">Tiempo esperando:</span>
                          <span className="espera-detail-value espera-time">
                            {formatDurationShort(nowTs - new Date(truck.waitingAt || truck.createdAt).getTime())}
                          </span>
                        </div>
                        {truck.waitingAt && (
                          <div className="espera-detail-row">
                            <span className="espera-detail-label">Desde:</span>
                            <span className="espera-detail-value">
                              {new Date(truck.waitingAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {truck.photoUrl && (
                        <div className="espera-truck-photo">
                          <img 
                            src={truck.photoUrl} 
                            alt="Foto del camión" 
                            className="espera-photo-img"
                            title="Doble clic para ver foto grande"
                            onDoubleClick={(e) => { e.stopPropagation() }}
                          />
                        </div>
                      )}

                      {role === 'Guardia' ? (
                        <div className="espera-truck-actions">
                          <select
                            value={cardAreas[truck.id] || truck.area}
                            className="espera-area-select"
                            onChange={(e) => setCardAreas(prev => ({ ...prev, [truck.id]: e.target.value as Truck['area'] }))}
                          >
                            <option value="Inbound">Inbound</option>
                            <option value="Outbound">Outbound</option>
                            <option value="Otros">Otros</option>
                          </select>
                          <div className="espera-buttons-row">
                            <button 
                              className="espera-action-btn secondary"
                              onClick={() => handleNeverEnterClick(truck.id)}
                            >
                              No ingresa
                            </button>
                            <button 
                              className="espera-action-btn primary"
                              onClick={() => handleEnter(truck.id, cardAreas[truck.id] || truck.area)}
                            >
                              Ingresar
                            </button>
                          </div>
                          {showReasonInput[truck.id] && (
                            <div className="espera-reason-input-container" style={{ marginTop: '10px' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                className="espera-reason-input"
                                placeholder="Ingrese el motivo de no ingreso"
                                value={reasonInputs[truck.id] || ''}
                                onChange={(e) => setReasonInputs(prev => ({ ...prev, [truck.id]: e.target.value }))}
                                onClick={(e) => e.stopPropagation()}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px', 
                                  borderRadius: '4px',
                                  border: '1px solid #ccc',
                                  marginBottom: '8px'
                                }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  className="espera-action-btn secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowReasonInput(prev => ({ ...prev, [truck.id]: false }));
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '14px' }}
                                >
                                  Cancelar
                                </button>
                                <button
                                  className="espera-action-btn primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNeverEnter(truck.id);
                                  }}
                                  style={{ padding: '4px 8px', fontSize: '14px' }}
                                >
                                  Confirmar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="espera-truck-info">
                          <div className="espera-info-row">
                            <span className="espera-info-label">Registrado por:</span>
                            <span className="espera-info-value">{truck.guardName || (truck.waitingBy ? truck.waitingBy.split('@')[0].replace('.', ' ') : 'N/D')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {waitingByArea[areaKey].length > showCount[areaKey] && (
                    <button 
                      className="espera-view-more-btn"
                      onClick={() => setShowCount(prev => ({ ...prev, [areaKey]: prev[areaKey] + COMPACT_COUNT }))}
                    >
                      Ver más ({waitingByArea[areaKey].length - showCount[areaKey]} restantes)
                    </button>
                  )}

                  {waitingByArea[areaKey].length > showCount[areaKey] && (
                    <button
                      className="espera-show-all-btn"
                      onClick={() => setShowCount(prev => ({ ...prev, [areaKey]: waitingByArea[areaKey].length }))}
                    >
                      Ver todos
                    </button>
                  )}

                  {/* Eliminado: botón 'Mostrar menos' para simplificar controles del listado */}
                </>
              )}
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedTruck && (
        <TruckDetailsModal truck={selectedTruck} onClose={() => setSelectedTruck(null)} />
      )}
      {/* Bloque de foto eliminado */}

      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Ir arriba"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

    </div>
  )
}

 function Historial() {
  const [data, setData] = useState<TrucksResponse>({ 
    trucks: [], 
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, 
    stats: { total: 0, inbound: 0, outbound: 0, byArea: { Inbound: 0, Outbound: 0, Otros: 0 } } 
  })
  const [exporting, setExporting] = useState(false)

  // Estado para ver foto grande
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedPhoto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedPhoto(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPhoto])
  
  // Filtros
  const [filters, setFilters] = useState<FilterOptions>({
    area: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    listTrucks(filters)
      .then((response) => setData(response))
      .catch((error) => console.error('Error loading trucks:', error))
  }, [filters])

  // Ordenar por fecha descendente para asegurar consistencia visual
  const trucksSorted = useMemo(() => {
    return [...data.trucks].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return bTime - aTime
    })
  }, [data.trucks])



  // Exportar a Excel con filtros aplicados
  const exportExcel = async () => {
    setExporting(true)
    try {
      const exportData = await exportTrucks({
        area: filters.area,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(exportData.data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Historial Completo')
      
      // Generar nombre de archivo con filtros
      const dateStr = new Date().toISOString().split('T')[0]
      let fileName = `historial_camiones_${dateStr}`
      if (filters.dateFrom || filters.dateTo) {
        fileName += `_${filters.dateFrom || 'inicio'}_${filters.dateTo || 'fin'}`
      }
      if (filters.area) {
        fileName += `_${filters.area}`
      }
      fileName += '.xlsx'
      
      XLSX.writeFile(wb, fileName)
      
      // Mostrar información de la exportación
      alert(`✅ Exportación completada!\n\n📊 Registros exportados: ${exportData.metadata.totalRecords}\n📅 Fecha: ${new Date(exportData.metadata.exportDate).toLocaleString()}\n👤 Exportado por: ${exportData.metadata.exportedBy}`)
    } catch (error: unknown) {
      alert(`❌ Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setExporting(false)
    }
  }



  // Cambiar página
  const changePage = (newPage: number) => {
    setFilters((prev: FilterOptions) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="mockup-page mockup-animate-in">
      <div className="mockup-card historial-card">
        
        {/* Header Elegante */}
        <div className="text-center mb-6">
          <h1 className="mockup-title">Historial Completo de Registros</h1>
          <p className="mockup-subtitle">Consulta, filtra y exporta todos los registros históricos</p>
        </div>

        {/* Panel de Filtros Compacto y Elegante */}
        <div className="modern-filters-panel mb-6">
          <div className="filters-header">
            <div className="flex items-center gap-3">
              <div className="filter-icon">
                <SearchIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Filtros de Búsqueda</h3>
            </div>
            <div className="filters-actions">
              {data.stats && (
                <div className="stats-summary">
                  <div className="stat-item">
                    <span className="stat-number">{data.stats.total}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{data.stats.inbound}</span>
                    <span className="stat-label">Dentro</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{data.stats.outbound}</span>
                    <span className="stat-label">Salieron</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="modern-action-button"
                onClick={exportExcel}
                disabled={exporting}
                title="Exportar Excel"
              >
                {exporting ? (
                  <svg className="spinner w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <DownloadIcon className="w-5 h-5" />
                )}
                <span>{exporting ? 'Exportando…' : 'Exportar Excel'}</span>
              </button>

            </div>
          </div>
          
          {/* Filtros en una sola fila compacta */}
          <div className="filters-row">
            {/* Búsqueda */}
            <div className="filter-group search min-w-0">
              <label className="filter-label">Buscar</label>
              <div className="filter-input-wrapper min-w-0">
                <SearchIcon className="filter-input-icon" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="modern-filter-input w-full min-w-0"
                />
              </div>
            </div>

            {/* Área */}
            <div className="filter-group small min-w-0">
              <label className="filter-label">Área</label>
              <select 
                value={filters.area}
                onChange={(e) => setFilters((prev) => ({ ...prev, area: e.target.value }))}
                className="modern-filter-select w-full min-w-0"
              >
                <option value="">Todas</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            {/* Estado */}
            <div className="filter-group small min-w-0">
              <label className="filter-label">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as 'all' | 'inside' | 'exited' | 'waiting' }))}
                className="modern-filter-select w-full min-w-0"
              >
                <option value="all">Todos</option>
                <option value="inside">Ingreso</option>
                <option value="waiting">En espera</option>
                <option value="exited">Salida</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div className="filter-group date min-w-0">
              <label className="filter-label">Desde</label>
              <div className="filter-input-wrapper min-w-0">
                <CalendarIcon className="filter-input-icon" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  className="modern-filter-input w-full min-w-0"
                />
              </div>
            </div>
            
            {/* Fecha Hasta */}
            <div className="filter-group date min-w-0">
              <label className="filter-label">Hasta</label>
              <div className="filter-input-wrapper min-w-0">
                <CalendarIcon className="filter-input-icon" />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  className="modern-filter-input w-full min-w-0"
                />
              </div>
            </div>

            {/* Registros por página */}
            <div className="filter-group show min-w-0">
              <label className="filter-label">Mostrar</label>
              <div className="filter-input-wrapper min-w-0">
                <select 
                  value={filters.limit}
                  onChange={(e) => setFilters((prev) => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="modern-filter-select w-full min-w-0"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla elegante */}
        <div className="modern-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th className="table-header">Foto</th>
                <th className="table-header">Patente</th>
                <th className="table-header">Área</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Entrada</th>
                <th className="table-header">Salida</th>
                <th className="table-header">Duración</th>
                <th className="table-header">Tiempo Espera</th>
                <th className="table-header">Motivo No Ingreso</th>
                <th className="table-header">Guardia</th>
              </tr>
            </thead>
            <tbody>
              {trucksSorted.map((truck, index) => (
                <tr key={truck.id} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                  <td className="table-cell photo-cell">
                    {truck.photoUrl ? (
                      <button
                        type="button"
                        className="photo-thumb photo-thumb-with-img"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedPhoto(buildPhotoSrc(truck.photoUrl ?? null));
                        }}
                        title="Ver foto"
                      >
                        <img src={buildPhotoSrc(truck.photoUrl ?? null) || ''} alt={`Foto ${truck.plate}`} className="photo-thumb-img" />
                      </button>
                    ) : (
                      <div className="photo-thumb photo-thumb-disabled" title="Sin foto disponible">
                        <PhotoIcon className="w-5 h-5 opacity-50" />
                      </div>
                    )}
                  </td>
                  <td className="table-cell plate-cell">
                    <span className="plate-text">{truck.plate}</span>
                  </td>
                  <td className="table-cell area-cell">
                    <span className="area-text">{truck.area}</span>
                  </td>
                  <td className="table-cell status-cell">
                    <span className={`status-badge ${truck.status === 'Ingreso' ? 'ingreso' : truck.status === 'Espera' ? 'espera' : 'salida'}`}>
                      {truck.status === 'Ingreso' ? '🟢' : truck.status === 'Espera' ? '🟠' : '🔴'} {truck.status}
                    </span>
                  </td>
                  <td className="table-cell date-cell">
                    <div className="date-time">
                      <span className="date">{new Date(truck.createdAt).toLocaleDateString()}</span>
                      <span className="time">{new Date(truck.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="table-cell date-cell">
                    {truck.exitAt ? (
                      <div className="date-time">
                        <span className="date">{new Date(truck.exitAt).toLocaleDateString()}</span>
                        <span className="time">{new Date(truck.exitAt).toLocaleTimeString()}</span>
                      </div>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td className="table-cell duration-cell">
                    {truck.duration ? (
                      <span className="duration-text">{truck.duration} min</span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td className="table-cell waiting-time-cell">
                    {truck.waitingAt ? (
                      <span className="waiting-time-text">
                        {truck.enteredAt 
                          ? Math.round((new Date(truck.enteredAt).getTime() - new Date(truck.waitingAt).getTime()) / 60000)
                          : truck.status === 'Espera'
                            ? Math.round((Date.now() - new Date(truck.waitingAt).getTime()) / 60000)
                            : truck.status === 'NoIngreso'
                              ? Math.round((new Date(truck.neverEnteredAt || truck.createdAt).getTime() - new Date(truck.waitingAt).getTime()) / 60000)
                              : '-'
                        } min
                      </span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td className="table-cell reason-cell">
                    {truck.status === 'NoIngreso' ? (
                      <span className="reason-text">{truck.neverEnteredReason || "-"}</span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td className="table-cell guard-cell">
                    {truck.guardName ? (
                      <span className="guard-text">{truck.guardName}</span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.trucks.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No hay registros</div>
              <div className="empty-subtitle">No se encontraron registros con los filtros aplicados</div>
            </div>
          )}
        </div>
        
        {/* Paginación Moderna */}
        {data.pagination && data.pagination.totalPages > 1 && (
          <div className="modern-pagination">
            <button
              onClick={() => changePage(data.pagination.page - 1)}
              disabled={data.pagination.page <= 1}
              className="pagination-button prev"
            >
              ← Anterior
            </button>
            
            <div className="pagination-info">
              <span className="page-numbers">
                Página {data.pagination.page} de {data.pagination.totalPages}
              </span>
              <span className="total-records">
                {data.pagination.total} registros
              </span>
            </div>
            
            <button
              onClick={() => changePage(data.pagination.page + 1)}
              disabled={data.pagination.page >= data.pagination.totalPages}
              className="pagination-button next"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Bloque de foto eliminado */}
      {/* Lightbox de foto grande */}
      {selectedPhoto && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Foto grande" className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <button className="absolute right-3 top-3 bg-black/40 hover:bg-black/60 text-white rounded-md p-2" onClick={() => setSelectedPhoto(null)} title="Cerrar">
              <CloseIcon />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// Navegación con Pestañas - Estilo Mockup
const HamburgerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

// Íconos SVG profesionales para la barra de navegación (outline estilo Heroicons)
const HomeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 9.75V20h14V9.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.75 20v-5.5h4.5V20" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ClipboardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <rect x="6.5" y="5" width="11" height="15" rx="2"/>
    <path d="M9 5.5h6" strokeLinecap="round"/>
    <path d="M8.5 9.75h7" strokeLinecap="round"/>
    <path d="M8.5 13h7" strokeLinecap="round"/>
    <path d="M8.5 16.25h5" strokeLinecap="round"/>
  </svg>
)

// PencilIcon eliminado

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M4 20h16" strokeLinecap="round"/>
    <rect x="6" y="11" width="3" height="7" rx="0.75"/>
    <rect x="11" y="8" width="3" height="10" rx="0.75"/>
    <rect x="16" y="5" width="3" height="13" rx="0.75"/>
  </svg>
)
function MockupNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const guardName = typeof window !== 'undefined' ? localStorage.getItem('guardName') : null
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
  const [mobileOpen, setMobileOpen] = useState(false)
  const toggleMobile = () => setMobileOpen((v) => !v)
  const { branding } = useBranding()



  const onLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('guardName')
    navigate('/')
  }

  // Navegación: "Inicio" lleva siempre al login
  const inicioPath = '/'
  const navItems = [
    { path: inicioPath, label: 'Inicio', icon: <HomeIcon />, show: true },
    { path: '/formulario', label: 'Formulario', icon: <ClipboardIcon />, show: role === 'Guardia' },
    { path: '/espera', label: 'En espera', icon: <ClipboardIcon />, show: true },
    { path: '/historial', label: 'Historial', icon: <ClipboardIcon />, show: role !== 'Guardia' },
    { path: '/dashboard', label: 'Dashboard', icon: <ChartIcon />, show: true },
  ]

  return (
    <>
      <nav className="mockup-nav">
        <div className="mockup-nav-container">
          <div className="flex items-center space-x-4">
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
            )}
            <span className="text-sm font-semibold text-slate-100 hidden md:inline-block">
              {branding.companyName || 'Control de Transporte'}
            </span>
            <div className="mockup-nav-tabs flex">
              {navItems.map((item) => (
                item.show && (
                  <Link
                    key={`${item.path}-${item.label}`}
                    to={item.path}
                    className={`mockup-nav-tab ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleMobile}
              className="mockup-icon-button md:hidden hamburger-button"
              aria-label="Abrir menú de navegación"
              aria-controls="primary-navigation"
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon />
            </button>

            {guardName && (
              <span className="mockup-nav-tab hidden md:inline-flex items-center gap-1">
                👤 {guardName}
              </span>
            )}

            {/* Estado de conexión */}
            <span
              className="mockup-nav-tab hidden md:inline-flex items-center gap-2"
              title={supabaseReady ? 'Usando Supabase' : 'Usando backend local'}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${supabaseReady ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
              <span>{supabaseReady ? 'Supabase' : 'Backend local'}</span>
            </span>
            
            {/* Eliminado botón de configuración */}
            
            <div className="inline-flex">
              <ThemeToggle />
            </div>
            
            <button 
              onClick={onLogout} 
              className="mockup-icon-button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Panel móvil con animación suave */}
        <div
          id="primary-navigation"
          className={`${mobileOpen ? 'md:hidden opacity-100' : 'md:hidden opacity-0 pointer-events-none'} mobile-menu-backdrop`}
          aria-hidden={!mobileOpen}
        >
          <div className="mobile-menu-panel">
            {guardName && (
              <div className="mockup-nav-tab w-full">
                👤 {guardName}
              </div>
            )}
            {/* Estado de conexión en móvil */}
            <div className="mockup-nav-tab w-full">
              <span className={`inline-block w-2 h-2 rounded-full ${supabaseReady ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
              <span className="ml-2">{supabaseReady ? 'Supabase' : 'Backend local'}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <ThemeToggle />
            </div>
            {navItems.map((item) => (
              item.show && (
                <Link
                  key={`m-${item.path}-${item.label}`}
                  to={item.path}
                  className={`mockup-nav-tab ${location.pathname === item.path ? 'active' : ''} w-full`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              )
            ))}
          </div>
        </div>
      </nav>

      {/* Eliminado BrandingConfigModal */}
    </>
  )
}

function RequireRole({ children, allow }: { children: React.ReactElement; allow: Array<'Guardia'|'Operador'|'Admin'> }) {
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
  if (!role || !allow.includes(role as 'Guardia' | 'Operador' | 'Admin')) return <Navigate to="/" replace />
  return children
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/'

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-gray-900 dark:text-slate-100">
      {/* Theme Toggle visible en login; en páginas internas va en el navbar */}
      {isLoginPage ? (
        <div className="fixed top-3 right-3 z-50">
          <ThemeToggle />
        </div>
      ) : null}
      {!isLoginPage && <MockupNavigation />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/formulario" element={<RequireAuth><RequireRole allow={["Guardia"]}><GuardiaRegistro /></RequireRole></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><RequireRole allow={["Operador","Admin","Guardia"]}><Dashboard /></RequireRole></RequireAuth>} />
        <Route path="/espera" element={<RequireAuth><RequireRole allow={["Operador","Admin","Guardia"]}><EsperaAfuera /></RequireRole></RequireAuth>} />
        <Route path="/historial" element={<RequireAuth><RequireRole allow={["Guardia","Operador","Admin"]}><Historial /></RequireRole></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
