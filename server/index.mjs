import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = 3000
const JWT_SECRET = 'mi-secreto-super-seguro-2024'

// Configuración de almacenamiento persistente
const DATA_FILE = path.join(process.cwd(), 'data', 'trucks.json')
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')


// Chequeo de Supabase en arranque
function parseEnv(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const lines = raw.split(/\r?\n/)
    const env = {}
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\'')) || (val.startsWith('`') && val.endsWith('`'))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
    return env
  } catch (e) {
    return {}
  }
}

async function supabaseStartupCheck() {
  const envPath = path.join(process.cwd(), '.env.development')
  const env = fs.existsSync(envPath) ? parseEnv(envPath) : {}
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.log('⚠️ Supabase: No configurado (VITE_SUPABASE_URL/ANON_KEY)')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
    const { error } = await supabase.from('trucks').select('id').limit(1)
    if (error) {
      if ((error.message && /relation .* does not exist/i.test(error.message)) || error.code === '42P01') {
        console.log('🔌 Supabase: Conectado, pero falta aplicar schema (tabla public.trucks)')
      } else {
        console.log(`❌ Supabase: ${error.message}`)
      }
    } else {
      console.log('🔌 Supabase: Conectado')
    }
  } catch (e) {
    console.log(`❌ Supabase: Error de conexión: ${e.message}`)
  }
}

// Crear directorios si no existen
if (!fs.existsSync('data')) {
  fs.mkdirSync('data')
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR)
}


// Funciones de almacenamiento persistente
function loadTrucks() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading trucks:', error)
  }
  return []
}

function saveTrucks(trucks) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(trucks, null, 2))
    return true
  } catch (error) {
    console.error('Error saving trucks:', error)
    return false
  }
}

// Cargar datos al iniciar
let trucks = loadTrucks()

// Middleware
app.use(cors())
// Aumentar límite de json por si alguna ruta recibe payloads grandes
app.use(express.json({ limit: '50mb' }))
// Soporte adicional para formularios URL-encoded
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use('/uploads', express.static(UPLOADS_DIR))

// Servir la build de producción (dist) como estática
const DIST_DIR = path.join(process.cwd(), 'dist')
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4().replace(/-/g, '')
    const extByMime = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    }
    const originalExt = path.extname(file.originalname || '')
    const finalExt = originalExt || extByMime[file.mimetype] || ''
    cb(null, finalExt ? `${uniqueName}${finalExt}` : uniqueName)
  }
})

const upload = multer({ 
  storage,
  // Aumentar límite de archivo a 25MB para fotos de alta resolución
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos de imagen'))
    }
  }
})

// Middleware de autenticación
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' })
  }
}

// Middleware de roles
function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' })
    }
    next()
  }
}

// Rutas

// Login
app.post('/api/login', (req, res) => {
  const { email, role, displayName } = req.body

  if (!email || !role) {
    return res.status(400).json({ error: 'Email y rol son requeridos' })
  }
  const safeName = displayName && typeof displayName === 'string' && displayName.trim().length > 0
    ? displayName.trim()
    : (email.split('@')[0] || '').replace('.', ' ').trim()

  const token = jwt.sign({ email, role, name: safeName }, JWT_SECRET, { expiresIn: '12h' })

  res.json({ token, role, name: safeName })
})

// Registrar camión
app.post('/api/trucks', requireAuth, requireRole(['Guardia']), upload.single('photo'), (req, res) => {
  const body = req.body || {}
  const { plate, driver, transporter, area } = body
  
  if (!plate || !driver || !transporter || !area) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }
  
  const truck = {
    id: uuidv4(),
    plate: plate.toUpperCase(),
    driver,
    transporter,
    area,
    status: 'Ingreso',
    createdAt: new Date().toISOString(),
    createdBy: req.user.email,
    exitAt: null,
    exitBy: null,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
    // Datos adicionales para el historial
    entryTime: new Date().toISOString(),
    duration: null,
    notes: '',
    guardName: req.user.email.split('@')[0].replace('.', ' ')
  }
  
  trucks.push(truck)
  
  // Guardar en archivo
  if (saveTrucks(trucks)) {
    // Notificar a clientes SSE
    notifyClients('new', truck)
    
    res.status(201).json(truck)
  } else {
    res.status(500).json({ error: 'Error al guardar el registro' })
  }
})

// Listar camiones con filtros avanzados
app.get('/api/trucks', requireAuth, (req, res) => {
  const { 
    area, 
    status, 
    dateFrom, 
    dateTo, 
    page = 1, 
    limit = 50,
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query
  
  let filteredTrucks = [...trucks]
  
  // Filtro por área
  if (area && area !== '') {
    filteredTrucks = filteredTrucks.filter(t => t.area === area)
  }
  
  // Filtro por estado
  if (status === 'inside') {
    filteredTrucks = filteredTrucks.filter(t => !t.exitAt && t.status === 'Ingreso')
  } else if (status === 'exited') {
    filteredTrucks = filteredTrucks.filter(t => t.exitAt)
  } else if (status === 'waiting') {
    filteredTrucks = filteredTrucks.filter(t => !t.exitAt && t.status === 'Espera')
  } else if (status === 'never') {
    filteredTrucks = filteredTrucks.filter(t => t.status === 'NoIngreso')
  }
  
  // Filtro por fecha
  if (dateFrom) {
    const fromDate = new Date(dateFrom)
    filteredTrucks = filteredTrucks.filter(t => new Date(t.createdAt) >= fromDate)
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo)
    toDate.setHours(23, 59, 59, 999) // Incluir todo el día
    filteredTrucks = filteredTrucks.filter(t => new Date(t.createdAt) <= toDate)
  }
  
  // Búsqueda por texto
  if (search) {
    const searchLower = search.toLowerCase()
    filteredTrucks = filteredTrucks.filter(t => 
      t.plate.toLowerCase().includes(searchLower) ||
      t.driver.toLowerCase().includes(searchLower) ||
      t.transporter.toLowerCase().includes(searchLower)
    )
  }
  
  // Ordenamiento
  filteredTrucks.sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    const order = sortOrder === 'desc' ? -1 : 1
    
    if (aVal < bVal) return -1 * order
    if (aVal > bVal) return 1 * order
    return 0
  })
  
  // Paginación
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const paginatedTrucks = filteredTrucks.slice(startIndex, endIndex)
  
  // Calcular estadísticas
  const stats = {
    total: filteredTrucks.length,
    inside: filteredTrucks.filter(t => !t.exitAt).length,
    exited: filteredTrucks.filter(t => t.exitAt).length,
    byArea: {
      Inbound: filteredTrucks.filter(t => t.area === 'Inbound').length,
      Outbound: filteredTrucks.filter(t => t.area === 'Outbound').length,
      Otros: filteredTrucks.filter(t => t.area === 'Otros').length
    }
  }
  
  res.json({
    trucks: paginatedTrucks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredTrucks.length,
      totalPages: Math.ceil(filteredTrucks.length / limit)
    },
    stats
  })
})

// Registrar camión en espera (afuera)
app.post('/api/trucks/waiting', requireAuth, requireRole(['Guardia']), upload.single('photo'), (req, res) => {
  const body = req.body || {}
  const { plate, driver, transporter, area } = body
  
  if (!plate || !driver || !transporter || !area) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }
  
  const now = new Date().toISOString()
  const truck = {
    id: uuidv4(),
    plate: plate.toUpperCase(),
    driver,
    transporter,
    area,
    status: 'Espera',
    createdAt: now,
    createdBy: req.user.email,
    exitAt: null,
    exitBy: null,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
    entryTime: null,
    duration: null,
    notes: '',
    guardName: req.user.email.split('@')[0].replace('.', ' '),
    waitingAt: now,
    waitingBy: req.user.email
  }
  
  trucks.push(truck)
  
  if (saveTrucks(trucks)) {
    // Notificar a clientes SSE de espera
    notifyClients('waiting_new', truck)
    res.status(201).json(truck)
  } else {
    res.status(500).json({ error: 'Error al guardar el registro en espera' })
  }
})

// Marcar ingreso (desde espera)
app.patch('/api/trucks/:id/enter', requireAuth, requireRole(['Guardia']), (req, res) => {
  const { id } = req.params
  const { area } = req.body
  
  const truck = trucks.find(t => t.id === id)
  if (!truck) {
    return res.status(404).json({ error: 'Camión no encontrado' })
  }
  if (truck.status !== 'Espera') {
    return res.status(400).json({ error: 'El camión no está en espera' })
  }
  if (!area) {
    return res.status(400).json({ error: 'Área requerida para ingreso' })
  }
  
  const enterTime = new Date().toISOString()
  truck.status = 'Ingreso'
  truck.area = area
  truck.createdAt = enterTime
  truck.entryTime = enterTime
  truck.enteredAt = enterTime
  truck.enteredBy = req.user.email
  
  if (saveTrucks(trucks)) {
    // Notificar a dashboards (nuevo dentro) y a lista de espera (actualización)
    notifyClients('new', truck)
    notifyClients('waiting_update', truck)
    res.json(truck)
  } else {
    res.status(500).json({ error: 'Error al registrar el ingreso' })
  }
})

// Marcar como nunca ingresa
app.patch('/api/trucks/:id/never-enter', requireAuth, requireRole(['Guardia']), (req, res) => {
  const { id } = req.params
  const { reason = '' } = req.body
  
  const truck = trucks.find(t => t.id === id)
  if (!truck) {
    return res.status(404).json({ error: 'Camión no encontrado' })
  }
  if (truck.exitAt) {
    return res.status(400).json({ error: 'El camión ya tiene salida registrada' })
  }
  
  truck.status = 'NoIngreso'
  truck.neverEnteredAt = new Date().toISOString()
  truck.neverEnteredBy = req.user.email
  truck.neverEnteredReason = reason
  
  if (saveTrucks(trucks)) {
    notifyClients('waiting_update', truck)
    res.json(truck)
  } else {
    res.status(500).json({ error: 'Error al marcar como no ingreso' })
  }
})

// Marcar salida
app.patch('/api/trucks/:id/exit', requireAuth, requireRole(['Guardia']), (req, res) => {
  const { id } = req.params
  const { notes = '' } = req.body
  
  const truck = trucks.find(t => t.id === id)
  if (!truck) {
    return res.status(404).json({ error: 'Camión no encontrado' })
  }
  
  if (truck.exitAt) {
    return res.status(400).json({ error: 'El camión ya tiene salida registrada' })
  }
  
  const exitTime = new Date().toISOString()
  const entryTime = new Date(truck.createdAt)
  const duration = Math.round((new Date(exitTime) - entryTime) / (1000 * 60)) // minutos
  
  truck.status = 'Salida'
  truck.exitAt = exitTime
  truck.exitBy = req.user.email
  truck.duration = duration
  truck.notes = notes
  
  // Guardar en archivo
  if (saveTrucks(trucks)) {
    // Notificar a clientes SSE
    notifyClients('update', truck)
    
    res.json(truck)
  } else {
    res.status(500).json({ error: 'Error al guardar la salida' })
  }
})

// Exportar datos completos para Excel
app.get('/api/trucks/export', requireAuth, requireRole(['Operador', 'Admin']), (req, res) => {
  const { dateFrom, dateTo, area, format = 'json' } = req.query
  
  let exportTrucks = [...trucks]
  
  // Aplicar filtros
  if (area && area !== '') {
    exportTrucks = exportTrucks.filter(t => t.area === area)
  }
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom)
    exportTrucks = exportTrucks.filter(t => new Date(t.createdAt) >= fromDate)
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo)
    toDate.setHours(23, 59, 59, 999)
    exportTrucks = exportTrucks.filter(t => new Date(t.createdAt) <= toDate)
  }
  
  // Formatear datos para exportación
  const exportData = exportTrucks.map(truck => ({
    ID: truck.id,
    Patente: truck.plate,
    Conductor: truck.driver,
    Empresa: truck.transporter,
    Area: truck.area,
    Estado: truck.status,
    'Fecha Ingreso': new Date(truck.createdAt).toLocaleString('es-ES'),
    'Hora Ingreso': new Date(truck.createdAt).toLocaleTimeString('es-ES'),
    'Fecha Salida': truck.exitAt ? new Date(truck.exitAt).toLocaleString('es-ES') : '',
    'Hora Salida': truck.exitAt ? new Date(truck.exitAt).toLocaleTimeString('es-ES') : '',
    'Duración (min)': truck.duration || '',
    'Registrado por': truck.createdBy || '',
    'Salida por': truck.exitBy || '',
    'Guardia': truck.guardName || '',
    'Notas': truck.notes || '',
    'Tiene Foto': truck.photoUrl ? 'Sí' : 'No'
  }))

  res.json({
    data: exportData,
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: exportData.length,
      filters: { dateFrom, dateTo, area },
      exportedBy: req.user.email
    }
  })
})

// Estadísticas del sistema
app.get('/api/stats', requireAuth, (req, res) => {
  const { dateFrom, dateTo } = req.query
  
  let statsTrucks = [...trucks]
  
  if (dateFrom) {
    const fromDate = new Date(dateFrom)
    statsTrucks = statsTrucks.filter(t => new Date(t.createdAt) >= fromDate)
  }
  
  if (dateTo) {
    const toDate = new Date(dateTo)
    toDate.setHours(23, 59, 59, 999)
    statsTrucks = statsTrucks.filter(t => new Date(t.createdAt) <= toDate)
  }
  
  const stats = {
    total: statsTrucks.length,
    inbound: statsTrucks.filter(t => t.area === 'Inbound').length,
    outbound: statsTrucks.filter(t => t.area === 'Outbound').length,
    byArea: {
      Inbound: statsTrucks.filter(t => t.area === 'Inbound').length,
      Outbound: statsTrucks.filter(t => t.area === 'Outbound').length,
      Otros: statsTrucks.filter(t => t.area === 'Otros').length
    },
    byStatus: {
      Ingreso: statsTrucks.filter(t => t.status === 'Ingreso').length,
      Salida: statsTrucks.filter(t => t.status === 'Salida').length
    },
    averageDuration: statsTrucks
      .filter(t => t.duration)
      .reduce((acc, t) => acc + t.duration, 0) / statsTrucks.filter(t => t.duration).length || 0,
    todayEntries: statsTrucks.filter(t => {
      const today = new Date()
      const truckDate = new Date(t.createdAt)
      return truckDate.toDateString() === today.toDateString()
    }).length
  }
  
  res.json(stats)
})

// Fallback SPA: enviar index.html para rutas no-API (cuando existe dist)
if (fs.existsSync(DIST_DIR)) {
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}
// Server-Sent Events para tiempo real
const clients = new Set()

function notifyClients(type, data) {
  const message = JSON.stringify({ type, data })
  clients.forEach(client => {
    try {
      client.write(`data: ${message}\n\n`)
    } catch (error) {
      clients.delete(client)
    }
  })
}

app.get('/api/realtime', requireAuth, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })
  
  // Enviar datos iniciales
  const currentInside = trucks.filter(t => !t.exitAt && t.status === 'Ingreso')
  const currentWaiting = trucks.filter(t => !t.exitAt && t.status === 'Espera')
  res.write(`data: ${JSON.stringify({ type: 'initial', data: currentInside })}\n\n`)
  res.write(`data: ${JSON.stringify({ type: 'waiting_initial', data: currentWaiting })}\n\n`)
  
  clients.add(res)
  
  req.on('close', () => {
    clients.delete(res)
  })
})

// Backup automático cada hora
setInterval(() => {
  const backupFile = path.join(process.cwd(), 'data', `backup_${Date.now()}.json`)
  try {
    fs.writeFileSync(backupFile, JSON.stringify(trucks, null, 2))
    console.log(`Backup creado: ${backupFile}`)
    
    // Mantener solo los últimos 24 backups
    const backupDir = path.join(process.cwd(), 'data')
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup_'))
      .sort()
    
    if (backupFiles.length > 24) {
      const filesToDelete = backupFiles.slice(0, backupFiles.length - 24)
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file))
      })
    }
  } catch (error) {
    console.error('Error creating backup:', error)
  }
}, 60 * 60 * 1000) // 1 hora

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error)
  const status = error?.statusCode || error?.status || 500
  const message = (typeof error === 'string')
    ? error
    : (error?.message || 'Error interno del servidor')
  res.status(status).json({ error: message })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
  console.log(`📊 Registros cargados: ${trucks.length}`)
  console.log(`💾 Almacenamiento: ${DATA_FILE}`)
  if (fs.existsSync(DIST_DIR)) {
    console.log(`🗂️ Sirviendo estáticos desde: ${DIST_DIR}`)
  } else {
    console.log('⚠️ Carpeta dist no encontrada. Ejecuta "npm run build" para generar la build de producción.')
  }
  // Mostrar estado de Supabase al iniciar
  supabaseStartupCheck()
})