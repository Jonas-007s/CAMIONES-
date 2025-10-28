import { supabase } from './supabaseClient'
import type { Truck, TrucksResponse, ExportResponse, FilterOptions } from './api'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export const supabaseReady = Boolean(
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) &&
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
)

type DbTruck = {
  id: string
  plate: string
  driver: string | null
  transporter: string | null
  area: 'Inbound' | 'Outbound' | 'Otros'
  status: 'Ingreso' | 'Salida' | 'Espera' | 'NoIngreso'
  created_at: string
  created_by: string | null
  exit_at: string | null
  exit_by: string | null
  photo_url: string | null
  entry_time: string | null
  duration: number | null
  notes: string | null
  guard_name: string | null
  waiting_at: string | null
  waiting_by: string | null
  entered_at: string | null
  entered_by: string | null
  never_entered_at: string | null
  never_entered_by: string | null
  never_entered_reason: string | null
}

function mapTruck(r: DbTruck): Truck {
  return {
    id: r.id,
    plate: r.plate,
    driver: r.driver || '',
    transporter: r.transporter || '',
    area: r.area,
    status: r.status,
    createdAt: r.created_at,
    createdBy: r.created_by || undefined,
    exitAt: r.exit_at,
    exitBy: r.exit_by || null,
    photoUrl: r.photo_url,
    entryTime: r.entry_time || undefined,
    duration: typeof r.duration === 'number' ? r.duration : null,
    notes: r.notes || undefined,
    guardName: r.guard_name || undefined,
    waitingAt: r.waiting_at,
    waitingBy: r.waiting_by || null,
    enteredAt: r.entered_at,
    enteredBy: r.entered_by || null,
    neverEnteredAt: r.never_entered_at,
    neverEnteredBy: r.never_entered_by || null,
    neverEnteredReason: r.never_entered_reason || null,
  }
}

async function uploadPhotoToSupabase(plate: string, photo?: File | null): Promise<string | null> {
  if (!supabaseReady || !photo) return null
  const tryExt = photo.name.split('.').pop()?.toLowerCase()
  const ext = tryExt && tryExt.length <= 5 ? tryExt : (photo.type.split('/')[1] || 'jpg')
  const filename = `${plate}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase
    .storage
    .from('uploads')
    .upload(filename, photo, { upsert: false, contentType: photo.type || 'image/jpeg' })
  if (error) throw new Error(error.message)
  const pub = supabase.storage.from('uploads').getPublicUrl(data?.path || filename)
  return pub.data.publicUrl
}

export async function loginSupabase(email: string, role: string, displayName?: string) {
  const name = displayName || email
  localStorage.setItem('token', 'supabase')
  localStorage.setItem('role', role)
  localStorage.setItem('guardName', name)
  return { token: 'supabase', role, name }
}

export async function registerTruckSupabase(data: {
  plate: string
  driver: string
  transporter: string
  area: Truck['area']
  photo?: File | null
}): Promise<Truck> {
  const guardName = (typeof window !== 'undefined' && localStorage.getItem('guardName')) || 'anon'
  const photoUrl = await uploadPhotoToSupabase(data.plate.trim().toUpperCase(), data.photo)
  const now = new Date().toISOString()
  const insert = {
    plate: data.plate.trim().toUpperCase(),
    driver: data.driver.trim(),
    transporter: data.transporter.trim(),
    area: data.area,
    status: 'Ingreso' as const,
    created_at: now,
    created_by: guardName,
    photo_url: photoUrl,
    entry_time: now,
    guard_name: guardName,
  }
  const { data: row, error } = await supabase
    .from('trucks')
    .insert(insert)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapTruck(row as DbTruck)
}

export async function listTrucksSupabase(filters: FilterOptions = {}): Promise<TrucksResponse> {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const offset = (page - 1) * limit
  let query = supabase
    .from('trucks')
    .select('*', { count: 'exact' })

  if (filters.area) query = query.eq('area', filters.area)
  if (filters.status && filters.status !== 'all') {
    switch (filters.status) {
      case 'inside':
        query = query.eq('status', 'Ingreso').is('exit_at', null)
        break
      case 'waiting':
        query = query.eq('status', 'Espera')
        break
      case 'exited':
        query = query.eq('status', 'Salida')
        break
      case 'never':
        query = query.eq('status', 'NoIngreso')
        break
    }
  }
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  if (filters.search) {
    const like = `%${filters.search}%`
    query = query.or(`plate.ilike.${like},driver.ilike.${like},transporter.ilike.${like}`)
  }
  const sortCol = (() => {
    switch (filters.sortBy) {
      case 'plate': return 'plate'
      case 'driver': return 'driver'
      case 'transporter': return 'transporter'
      case 'status': return 'status'
      case 'area': return 'area'
      case 'exitAt': return 'exit_at'
      default: return 'created_at'
    }
  })()
  const ascending = filters.sortOrder === 'asc'
  query = query.order(sortCol, { ascending, nullsFirst: false })
               .range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) throw new Error(error.message)
  const trucks: Truck[] = ((data || []) as DbTruck[]).map(mapTruck)
  const total = count ?? trucks.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const byArea: { Inbound: number; Outbound: number; Otros: number } = trucks.reduce(
    (
      acc: { Inbound: number; Outbound: number; Otros: number },
      t: Truck
    ) => {
      acc[t.area] = (acc[t.area] || 0) + 1
      return acc
    },
    { Inbound: 0, Outbound: 0, Otros: 0 }
  )

  return {
    trucks,
    pagination: { page, limit, total, totalPages },
    stats: { total, inbound: byArea.Inbound, outbound: byArea.Outbound, byArea }
  }
}

export async function exitTruckSupabase(id: string, notes?: string): Promise<Truck> {
  const guardName = (typeof window !== 'undefined' && localStorage.getItem('guardName')) || 'anon'
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('trucks')
    .update({ status: 'Salida', exit_at: now, exit_by: guardName, notes: notes || '' })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapTruck(data as DbTruck)
}

export async function exportTrucksSupabase(filters: FilterOptions = {}): Promise<ExportResponse> {
  let query = supabase.from('trucks').select('*')
  if (filters.area) query = query.eq('area', filters.area)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo)
  query = query.order('created_at', { ascending: false }).limit(5000)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  const rows = ((data || []) as DbTruck[])
    .map(mapTruck)
    .map((t: Truck) => ({
      id: t.id,
      plate: t.plate,
      driver: t.driver,
      transporter: t.transporter,
      area: t.area,
      status: t.status,
      createdAt: t.createdAt,
      exitAt: t.exitAt || null,
      duration: t.duration ?? null,
      waitingAt: t.waitingAt || null,
      enteredAt: t.enteredAt || null,
      neverEnteredAt: t.neverEnteredAt || null,
      neverEnteredReason: t.neverEnteredReason || null,
      guardName: t.guardName || null,
      photoUrl: t.photoUrl || null,
      notes: t.notes || null,
    }))
  return {
    data: rows,
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: rows.length,
      filters: { area: filters.area || '', dateFrom: filters.dateFrom || '', dateTo: filters.dateTo || '' },
      exportedBy: (typeof window !== 'undefined' && localStorage.getItem('guardName')) || 'anon'
    }
  }
}

export async function getStatsSupabase() {
  const { data, error } = await supabase.from('trucks_stats').select('*').single()
  if (error) throw new Error(error.message)
  return data
}

export async function registerWaitingTruckSupabase(data: {
  plate: string
  driver: string
  transporter: string
  area: Truck['area']
  photo?: File | null
}): Promise<Truck> {
  const guardName = (typeof window !== 'undefined' && localStorage.getItem('guardName')) || 'anon'
  const photoUrl = await uploadPhotoToSupabase(data.plate.trim().toUpperCase(), data.photo)
  const now = new Date().toISOString()
  const insert = {
    plate: data.plate.trim().toUpperCase(),
    driver: data.driver.trim(),
    transporter: data.transporter.trim(),
    area: data.area,
    status: 'Espera' as const,
    created_at: now,
    created_by: guardName,
    photo_url: photoUrl,
    waiting_at: now,
    waiting_by: guardName,
    guard_name: guardName,
  }
  const { data: row, error } = await supabase
    .from('trucks')
    .insert(insert)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapTruck(row as DbTruck)
}

export async function enterTruckSupabase(id: string, area: Truck['area']): Promise<Truck> {
  const guardName = (typeof window !== 'undefined' && localStorage.getItem('guardName')) || 'anon'
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('trucks')
    .update({
      status: 'Ingreso',
      area,
      entered_at: now,
      entered_by: guardName,
      created_at: now,
      entry_time: now,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapTruck(data as DbTruck)
}

export async function markNeverEnterSupabase(id: string, reason?: string): Promise<Truck> {
  const guardName = (typeof window !== 'undefined' && localStorage.getItem('guardName')) || 'anon'
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('trucks')
    .update({
      status: 'NoIngreso',
      never_entered_at: now,
      never_entered_by: guardName,
      never_entered_reason: reason || null,
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapTruck(data as DbTruck)
}

export function subscribeRealtimeSupabase(
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
  // Cargar estado inicial
  listTrucksSupabase({ status: 'inside' }).then(res => onInitial(res.trucks)).catch(() => {})
  listTrucksSupabase({ status: 'waiting' }).then(res => handlers?.onWaitingInitial?.(res.trucks)).catch(() => {})
  handlers?.onConnectionChange?.('sse')

  const channel = supabase
    .channel('trucks_realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'trucks' },
      (payload: RealtimePostgresChangesPayload<DbTruck>) => {
        const t = mapTruck(payload.new as DbTruck)
        if (t.status === 'Espera') handlers?.onWaitingNew?.(t)
        else onNew(t)
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'trucks' },
      (payload: RealtimePostgresChangesPayload<DbTruck>) => {
        const t = mapTruck(payload.new as DbTruck)
        if (t.status === 'Espera') handlers?.onWaitingUpdate?.(t)
        else onUpdate(t)
      }
    )
    .subscribe()

  return { close: () => { supabase.removeChannel(channel) } } as unknown as EventSource
}