import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('✗ JWT_SECRET no definido.')
  process.exit(1)
}

import { sequelize } from './database.js'

// Modelos (importar en orden para respetar FK)
import './models/Usuario.js'
import './models/Sede.js'
import './models/Profesora.js'
import './models/Actividad.js'
import './models/Alumna.js'
import './models/AlumnaActividad.js'
import './models/Cuota.js'
import './models/Egreso.js'
import Usuario from './models/Usuario.js'

// Rutas
import authRouter        from './routes/auth.js'
import sedesRouter       from './routes/sedes.js'
import profesorasRouter  from './routes/profesoras.js'
import actividadesRouter from './routes/actividades.js'
import alumnasRouter     from './routes/alumnas.js'
import cuotasRouter      from './routes/cuotas.js'
import cajaRouter        from './routes/caja.js'
import dashboardRouter   from './routes/dashboard.js'
import usuariosRouter    from './routes/usuarios.js'
import sueldosRouter     from './routes/sueldos.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '*'
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true

app.set('trust proxy', 1)
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

app.use('/fotos',        express.static(join(__dirname, 'public/fotos')))
app.use('/comprobantes', express.static(join(__dirname, 'public/comprobantes')))

app.use('/api', rateLimit({
  windowMs: 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intentá en un minuto.' },
}))

// API
app.use('/api/auth',        authRouter)
app.use('/api/sedes',       sedesRouter)
app.use('/api/profesoras',  profesorasRouter)
app.use('/api/actividades', actividadesRouter)
app.use('/api/alumnas',     alumnasRouter)
app.use('/api/cuotas',      cuotasRouter)
app.use('/api/caja',        cajaRouter)
app.use('/api/dashboard',   dashboardRouter)
app.use('/api/usuarios',    usuariosRouter)
app.use('/api/sueldos',     sueldosRouter)

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Patín F.A. API 🛼' }))
app.get('/ping', (req, res) => res.send('pong'))

// Un solo servicio: en "/" la página pública de la escuela y el resto es el
// panel (Vue). Si no hay build del panel (desarrollo local), no se sirve nada.
const SITIO = join(__dirname, '../sitio')
const PANEL = join(__dirname, '../frontend/dist')
app.get('/', (req, res) => res.sendFile(join(SITIO, 'index.html')))
app.use(express.static(SITIO, { index: false }))
app.use(express.static(PANEL, { index: false }))
app.get(/^\/(?!api\/|fotos\/|comprobantes\/).*/, (req, res, next) =>
  res.sendFile(join(PANEL, 'index.html'), err => err && next()))


// Solo cambios de ESTRUCTURA. Nada de tocar datos acá.
//
// Antes esta función también reasignaba profesoras, sedes, nombres de grupos y
// borraba filas de alumna_actividades. Como corre en cada arranque del servidor,
// pisaba en silencio todo lo que se cambiaba desde el panel: cada reinicio de
// Render devolvía los datos a los valores fijos del código. Esos arreglos eran
// de una sola vez y ya están aplicados en la base, así que se sacaron.
//
// Si hace falta corregir datos, se hace una vez con un script y no se deja acá.
async function migrar() {
  const colsMigrations = [
    { tabla: 'cuotas',      col: 'tipo',           sql: "ALTER TABLE cuotas ADD COLUMN tipo ENUM('cuota','inscripcion') NOT NULL DEFAULT 'cuota' AFTER anio" },
    { tabla: 'alumnas',     col: 'direccion',      sql: "ALTER TABLE alumnas ADD COLUMN direccion VARCHAR(255) NULL AFTER apellido" },
    { tabla: 'actividades', col: 'profesora_id_2', sql: "ALTER TABLE actividades ADD COLUMN profesora_id_2 INT NULL AFTER profesora_id" },
    { tabla: 'cuotas',      col: 'comprobante',    sql: "ALTER TABLE cuotas ADD COLUMN comprobante VARCHAR(500) NULL" },
    { tabla: 'cuotas',      col: 'actividad_id',   sql: "ALTER TABLE cuotas ADD COLUMN actividad_id INT NULL" },
  ]
  for (const m of colsMigrations) {
    const [[existe]] = await sequelize.query(`SHOW COLUMNS FROM ${m.tabla} LIKE '${m.col}'`)
    if (!existe) {
      await sequelize.query(m.sql)
      console.log(`✓ Migración columna: ${m.tabla}.${m.col}`)
    }
  }
}


async function start() {
  try {
    await sequelize.authenticate()
    console.log('✓ MySQL conectado')
    await sequelize.sync()
    console.log('✓ Tablas sincronizadas')

    await migrar()

    // Crear el admin solo si no existe Y si la contraseña viene por variable de
    // entorno. Antes estaba escrita en el código ('admin123'), o sea que quedaba
    // en el repositorio y en todo el historial de git.
    const existe = await Usuario.findOne({ where: { email: 'admin@patinfa.com' } })
    if (!existe) {
      if (process.env.ADMIN_PASSWORD) {
        const hash = await Usuario.hashPassword(process.env.ADMIN_PASSWORD)
        await Usuario.create({ nombre: 'Administrador', email: 'admin@patinfa.com', password: hash, rol: 'admin' })
        console.log('✓ Usuario admin creado con la contraseña de ADMIN_PASSWORD')
      } else {
        console.warn('⚠ No hay usuario admin y ADMIN_PASSWORD no está definida: no se creó ninguno.')
      }
    }

    app.listen(PORT, () => console.log(`🛼 Patín F.A. API en http://localhost:${PORT}`))
  } catch (err) {
    console.error('✗ Error al iniciar:', err.message)
    process.exit(1)
  }
}

// Heartbeat DB
setInterval(async () => {
  try { await sequelize.query('SELECT 1') } catch {}
}, 4 * 60 * 1000)

start()
