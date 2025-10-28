// API base configurable vía entorno. En desarrollo usamos "/api" con proxy.
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || '/api'
import { supabaseReady, loginSupabase, registerTruckSupabase, listTrucksSupabase, exitTruckSupabase, exportTrucksSupabase, getStatsSupabase, registerWaitingTruckSupabase, enterTruckSupabase, markNeverEnterSupabase, subscribeRealtimeSupabase } from './api.supabase'

export interface Truck {
  id: string
  plate: string
  driver: string
  transporter: string
  area: 'Inbound' | 'Outbound' | 'Otros'
  status: 'Ingreso' | 'Salida' | 'Espera' | 'NoIngreso'
  createdAt: string
  createdBy?: string
  exitAt?: string | null
  exitBy?: string | null
  photoUrl?: string | null
  entryTime?: string
  duration?: number | null
  notes?: string
  guardName?: string
  waitingAt?: string | null
  waitingBy?: string | null
  enteredAt?: string | null
  enteredBy?: string | null
  neverEnteredAt?: string | null
  neverEnteredBy?: string | null
  neverEnteredReason?: string | null
}

export interface TrucksResponse {
  trucks: Truck[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    inbound: number
    outbound: number
    byArea: {
      Inbound: number
      Outbound: number
      Otros: number
    }
  }
}

export interface ExportResponse {
  data: Record<string, unknown>[]
  metadata: {
    exportDate: string
    totalRecords: number
    filters: Record<string, unknown>
    exportedBy: string
  }
}

export interface FilterOptions {
  area?: string
  status?: 'all' | 'inside' | 'exited' | 'waiting' | 'never'
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Parse error responses safely, even if body is empty or not JSON
async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(async () => {
        const text = await response.text().catch(() => '')
        return text ? { error: text } : {}
      }) as unknown
      if (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) {
        const msg = (data as Record<string, unknown>).error
        if (typeof msg === 'string' && msg.trim().length > 0) return msg
      }
      const str = typeof data === 'string' ? data : JSON.stringify(data)
      return str && str !== '{}' ? str : `HTTP ${response.status} ${response.statusText}`.trim()
    } else {
      const text = await response.text().catch(() => '')
      if (text && text.trim().length > 0) return text.trim()
    }
  } catch {
    // swallow and fallback below
  }
  return `HTTP ${response.status} ${response.statusText}`.trim()
}

export async function login(email: string, role: string, displayName?: string) {
  if (supabaseReady) {
    return loginSupabase(email, role, displayName)
  }
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, displayName })
  })
  
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error en el login')
  }
  
  return response.json()
}

export async function registerTruck(data: {
  plate: string
  driver: string
  transporter: string
  area: Truck['area']
  photo?: File | null
}) {
  if (supabaseReady) {
    return registerTruckSupabase(data)
  }
  const formData = new FormData()
  formData.append('plate', data.plate)
  formData.append('driver', data.driver)
  formData.append('transporter', data.transporter)
  formData.append('area', data.area)
  
  if (data.photo) {
    formData.append('photo', data.photo)
  }
  
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE}/trucks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al registrar camión')
  }
  
  return response.json()
}

export async function listTrucks(filters: FilterOptions = {}): Promise<TrucksResponse> {
  if (supabaseReady) {
    return listTrucksSupabase(filters)
  }
  const params = new URLSearchParams()
  
  if (filters.area) params.append('area', filters.area)
  if (filters.status) params.append('status', filters.status)
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
  
  const response = await fetch(`${API_BASE}/trucks?${params}`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al obtener camiones')
  }
  
  return response.json()
}

export async function exitTruck(id: string, notes?: string) {
  if (supabaseReady) {
    return exitTruckSupabase(id, notes)
  }
  const response = await fetch(`${API_BASE}/trucks/${id}/exit`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes: notes || '' })
  })
  
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al marcar salida')
  }
  
  return response.json()
}

export async function exportTrucks(filters: FilterOptions = {}): Promise<ExportResponse> {
  if (supabaseReady) {
    return exportTrucksSupabase(filters)
  }
  const params = new URLSearchParams()
  
  if (filters.area) params.append('area', filters.area)
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  
  const response = await fetch(`${API_BASE}/trucks/export?${params}`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al exportar datos')
  }
  
  return response.json()
}

export async function getStats(filters: { dateFrom?: string; dateTo?: string } = {}) {
  if (supabaseReady) {
    return getStatsSupabase()
  }
  const params = new URLSearchParams()
  
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  
  const response = await fetch(`${API_BASE}/stats?${params}`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al obtener estadísticas')
  }
  
  return response.json()
}

export async function registerWaitingTruck(data: {
  plate: string
  driver: string
  transporter: string
  area: Truck['area']
  photo?: File | null
}) {
  if (supabaseReady) {
    return registerWaitingTruckSupabase(data)
  }
  const formData = new FormData()
  formData.append('plate', data.plate)
  formData.append('driver', data.driver)
  formData.append('transporter', data.transporter)
  formData.append('area', data.area)
  if (data.photo) {
    formData.append('photo', data.photo)
  }

  // IMPORTANTE: no establecer 'Content-Type' manualmente con FormData.
  // Solo enviamos el header de autorización para permitir que el navegador
  // establezca automáticamente el 'multipart/form-data' correcto.
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE}/trucks/waiting`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al registrar camión en espera')
  }
  
  return response.json()
}

export async function enterTruck(id: string, area: Truck['area']) {
  if (supabaseReady) {
    return enterTruckSupabase(id, area)
  }
  const response = await fetch(`${API_BASE}/trucks/${id}/enter`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ area })
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al registrar ingreso desde espera')
  }
  return response.json()
}

export async function markNeverEnter(id: string, reason?: string) {
  if (supabaseReady) {
    return markNeverEnterSupabase(id, reason)
  }
  const response = await fetch(`${API_BASE}/trucks/${id}/never-enter`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  })
  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Error al marcar "Nunca entra"')
  }
  return response.json()
}

export function subscribeRealtime(
  onInitial: (trucks: Truck[]) => void,
  onNew: (truck: Truck) => void,
  onUpdate: (truck: Truck) => void,
  handlers?: {
    onWaitingInitial?: (trucks: Truck[]) => void,
    onWaitingNew?: (truck: Truck) => void,
    onWaitingUpdate?: (truck: Truck) => void,
    onConnectionChange?: (mode: 'sse' | 'polling') => void
  }
) {
  if (supabaseReady) {
    return subscribeRealtimeSupabase(onInitial, onNew, onUpdate, handlers)
  }
  const token = localStorage.getItem('token')
  const eventSource = new EventSource(`${API_BASE}/realtime?token=${encodeURIComponent(token || '')}`)
  // Fallback: si SSE falla, activamos sondeo periódico para mantener datos actualizados.
  let pollId: number | null = null
  let consecutiveErrors = 0

  const startPolling = () => {
    if (pollId) return
    handlers?.onConnectionChange?.('polling')
    pollId = window.setInterval(async () => {
      try {
        const inside = await listTrucks({ status: 'inside' })
        onInitial(inside.trucks)
      } catch {}
      try {
        const waiting = await listTrucks({ status: 'waiting' })
        handlers?.onWaitingInitial?.(waiting.trucks)
      } catch {}
    }, 5000)
  }

  const stopPolling = () => {
    if (pollId) {
      clearInterval(pollId)
      pollId = null
    }
  }
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      // Al recibir datos por SSE, detenemos el polling (si estaba activo)
      stopPolling()
      handlers?.onConnectionChange?.('sse')
      
      switch (data.type) {
        case 'initial':
          onInitial(data.data)
          break
        case 'waiting_initial':
          handlers?.onWaitingInitial?.(data.data)
          break
        case 'new':
          onNew(data.data)
          break
        case 'update':
          onUpdate(data.data)
          break
        case 'waiting_new':
          handlers?.onWaitingNew?.(data.data)
          break
        case 'waiting_update':
          handlers?.onWaitingUpdate?.(data.data)
          break
      }
    } catch (error) {
      console.error('Error parsing SSE data:', error)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('SSE Error:', error)
    consecutiveErrors++
    // Si ocurre al menos un error, iniciamos el polling de respaldo.
    // EventSource intentará reconectarse automáticamente; el polling asegura datos mientras tanto.
    if (consecutiveErrors >= 1) {
      startPolling()
    }
  }
  
  eventSource.onopen = () => {
    // Conexión establecida: limpiamos errores y detenemos polling.
    consecutiveErrors = 0
    stopPolling()
    handlers?.onConnectionChange?.('sse')
  }
  
  return eventSource
}