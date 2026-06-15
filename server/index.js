import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'
import pg from 'pg'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const { Pool } = pg

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id', 'Authorization']
}))
app.use(express.json({ limit: '100mb' }))

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_y4O3WKQGIxhC@ep-bold-king-ahp3zu9v-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'corazon',
    verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(100),
    verification_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`)
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false`)
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100)`)
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS love_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corazon_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flecha_name VARCHAR(100),
    corazon_name VARCHAR(100),
    page_slug VARCHAR(100) UNIQUE NOT NULL,
    hero_title VARCHAR(255) DEFAULT 'Mi Amor',
    hero_subtitle VARCHAR(255),
    hero_date_text VARCHAR(255),
    counter_start_date DATE,
    status VARCHAR(20) DEFAULT 'draft',
    is_public BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS page_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES love_pages(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    date_label VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50)
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS page_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES love_pages(id) ON DELETE CASCADE,
    image_data TEXT NOT NULL,
    thumbnail_data TEXT,
    order_index INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 6000,
    transition_type VARCHAR(50) DEFAULT 'fade'
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS page_letter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES love_pages(id) ON DELETE CASCADE UNIQUE,
    content TEXT,
    signature_text VARCHAR(255),
    greeting VARCHAR(100) DEFAULT 'Mi amor,'
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS page_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES love_pages(id) ON DELETE CASCADE,
    corazon_id UUID REFERENCES users(id),
    output_data TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS animations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}',
    duration_ms INTEGER DEFAULT 1000
  )
`)

await pool.query(`
  CREATE TABLE IF NOT EXISTS page_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES love_pages(id) ON DELETE CASCADE UNIQUE,
    theme_colors JSONB DEFAULT '{"primary": "#e74c3c", "secondary": "#f39c12", "background": "#0a0a0f"}',
    fonts JSONB DEFAULT '{"heading": "Playfair Display", "body": "Inter", "script": "Great Vibes"}',
    custom_css TEXT,
    celebration_enabled BOOLEAN DEFAULT true,
    particle_effects BOOLEAN DEFAULT true,
    background_audio TEXT
  )
`)

await pool.query(`ALTER TABLE page_settings ADD COLUMN IF NOT EXISTS background_audio TEXT`)

await pool.query(`CREATE INDEX IF NOT EXISTS idx_pages_slug ON love_pages(page_slug)`)
await pool.query(`CREATE INDEX IF NOT EXISTS idx_pages_corazon ON love_pages(corazon_id)`)
await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)

const defaultAnimations = [
  { name: 'Fade In', type: 'fade_in', config: { from: 0, to: 1 }, duration_ms: 1000 },
  { name: 'Fade Out', type: 'fade_out', config: { from: 1, to: 0 }, duration_ms: 1000 },
  { name: 'Slide Left', type: 'slide', config: { direction: 'left' }, duration_ms: 800 },
  { name: 'Slide Right', type: 'slide', config: { direction: 'right' }, duration_ms: 800 },
  { name: 'Zoom In', type: 'zoom', config: { from: 1, to: 1.3 }, duration_ms: 1500 },
  { name: 'Cross Dissolve', type: 'crossdissolve', config: {}, duration_ms: 1500 },
]

for (const anim of defaultAnimations) {
  try {
    await pool.query(
      'INSERT INTO animations (name, type, config, duration_ms) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [anim.name, anim.type, JSON.stringify(anim.config), anim.duration_ms]
    )
  } catch (e) {}
}

const EMAIL_USER = process.env.EMAIL_USER || ''
const EMAIL_PASS = process.env.EMAIL_PASS || ''

let transporter = null
if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  })
  console.log('Email configurado con Gmail')
} else {
  console.log('Email NO configurado. Los tokens se mostraran en consola.')
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'amor-secret-key').digest('hex')
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function sendVerificationEmail(email, token, name) {
  const verificationUrl = `http://localhost:5173/verify/${token}`
  
  console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║                                                                ║
  ║   TOKEN DE VERIFICACION para ${email}
  ║                                                                ║
  ║   URL: ${verificationUrl}
  ║                                                                ║
  ╚════════════════════════════════════════════════════════════════╝
  `)
  
  if (!transporter) {
    return { sent: false, url: verificationUrl }
  }
  
  const mailOptions = {
    from: `"Cupido" <${EMAIL_USER}>`,
    to: email,
    subject: 'Verifica tu cuenta de amor',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #f5e6d3;">
        <div style="text-align: center; padding: 20px;">
          <h1 style="color: #e74c3c; font-size: 2.5em; margin: 0;">❤️</h1>
          <h2 style="color: #e74c3c; margin: 10px 0;">Verifica tu cuenta</h2>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 20px; padding: 30px; border: 1px solid rgba(231,76,60,0.3);">
          <p style="font-size: 1.1em;">Hola <strong>${name}</strong>,</p>
          <p>Gracias por registrarte en Nuestro Amor. Para activar tu cuenta, haz click en el siguiente boton:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; text-decoration: none; border-radius: 50px; font-size: 1.1em; font-weight: bold;">Verificar Cuenta</a>
          </div>
          <p style="color: #888; font-size: 0.9em;">Si no puedes hacer click, copia y pega este enlace en tu navegador:</p>
          <p style="color: #e74c3c; font-size: 0.85em; word-break: break-all;">${verificationUrl}</p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
          <p style="color: #666; font-size: 0.8em;">Este enlace expira en 24 horas.</p>
        </div>
      </div>
    `
  }
  
  try {
    await transporter.sendMail(mailOptions)
    console.log(`Email de verificacion enviado a ${email}`)
    return { sent: true, url: verificationUrl }
  } catch (err) {
    console.error('Error enviando email:', err.message)
    return { sent: false, url: verificationUrl, error: err.message }
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' })
    }
    
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este email ya esta registrado' })
    }
    
    const token = generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const passwordHash = hashPassword(password)
    
    await pool.query(
      'INSERT INTO users (email, password_hash, name, verification_token, verification_expires) VALUES ($1, $2, $3, $4, $5)',
      [email, passwordHash, name, token, expires]
    )
    
    const emailResult = await sendVerificationEmail(email, token, name)
    
    res.json({ 
      success: true, 
      message: 'Cuenta creada. Revisa tu correo para verificar tu cuenta.',
      email,
      verification_url: emailResult.url,
      email_sent: emailResult.sent
    })
  } catch (err) {
    console.error('Error en registro:', err)
    res.status(500).json({ error: 'Error al registrar: ' + err.message })
  }
})

app.get('/api/auth/verify/:token', async (req, res) => {
  try {
    const { token } = req.params
    
    if (!token) {
      return res.status(400).json({ error: 'Token requerido' })
    }
    
    console.log(`Verificando token: ${token}`)
    
    const result = await pool.query(
      'SELECT * FROM users WHERE verification_token = $1 AND verification_expires > NOW()',
      [token]
    )
    
    console.log(`Token encontrado: ${result.rows.length > 0}`)
    
    if (result.rows.length === 0) {
      // Buscar si el token existe pero está expirado
      const expiredCheck = await pool.query(
        'SELECT * FROM users WHERE verification_token = $1',
        [token]
      )
      
      if (expiredCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Token expirado. Solicita uno nuevo.' })
      }
      return res.status(400).json({ error: 'Token invalido' })
    }
    
    await pool.query(
      'UPDATE users SET verified = true, verification_token = NULL, verification_expires = NULL WHERE id = $1',
      [result.rows[0].id]
    )
    
    console.log(`Usuario verificado: ${result.rows[0].email}`)
    res.json({ success: true, message: 'Cuenta verificada correctamente' })
  } catch (err) {
    console.error('Error en verificacion:', err.message)
    res.status(500).json({ error: 'Error al verificar: ' + err.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contrasena requeridos' })
    }
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email o contrasena incorrectos' })
    }
    
    const user = result.rows[0]
    const passwordHash = hashPassword(password)
    
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Email o contrasena incorrectos' })
    }
    
    if (!user.verified) {
      return res.status(401).json({ error: 'Cuenta no verificada. Revisa tu correo electronico.' })
    }
    
    const { password_hash, verification_token, verification_expires, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesion' })
  }
})

app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.get('/api/cupido/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at,
        (SELECT COUNT(*) FROM love_pages WHERE corazon_id = u.id) as pages_count,
        (SELECT COALESCE(SUM(view_count), 0) FROM love_pages WHERE corazon_id = u.id) as total_views
      FROM users u WHERE u.role != 'cupido' ORDER BY u.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.get('/api/corazon/pages', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) return res.status(401).json({ error: 'No autorizado' })
    
    const result = await pool.query(`
      SELECT lp.*, 
        (SELECT COUNT(*) FROM page_photos WHERE page_id = lp.id) as photos_count,
        (SELECT COUNT(*) FROM page_videos WHERE page_id = lp.id AND status = 'completed') as videos_count
      FROM love_pages lp WHERE lp.corazon_id = $1 ORDER BY lp.updated_at DESC
    `, [userId])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.post('/api/corazon/pages', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) return res.status(401).json({ error: 'No autorizado' })
    
    const { flechaName, corazonName, hero_title, hero_subtitle, hero_date_text, counter_start_date } = req.body
    const slug = `${uuidv4().slice(0, 8)}-${Date.now().toString(36)}`
    
    const result = await pool.query(`
      INSERT INTO love_pages (corazon_id, flecha_name, corazon_name, page_slug, hero_title, hero_subtitle, hero_date_text, counter_start_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      userId,
      flechaName || 'Mi Amor',
      corazonName || 'Tu Corazon',
      slug,
      hero_title || flechaName || 'Mi Amor',
      hero_subtitle || 'Para el amor de mi vida',
      hero_date_text || 'Cada dia a tu lado es un regalo',
      counter_start_date || null
    ])
    
    const page = result.rows[0]
    
    const defaultTimeline = [
      { date_label: 'El Inicio', title: 'Donde todo comenzo', description: 'El dia en que nuestras vidas se cruzaron y el universo nos regalo la oportunidad de encontrarnos.', icon: 'heart', color: 'from-rose-500 to-pink-600' },
      { date_label: 'Nuestra Cancion', title: 'La banda sonora de nuestro amor', description: 'Esa cancion que siempre nos recuerda el uno al otro y que nunca dejaremos de bailar.', icon: 'music', color: 'from-violet-500 to-purple-600' },
      { date_label: 'Momentos', title: 'Risas, suenos y complicidad', description: 'Cada sonrisa, cada mirada, cada abrazo. Todos los pequenos momentos que construyen esta historia.', icon: 'sparkles', color: 'from-amber-500 to-orange-600' },
      { date_label: 'Siempre', title: 'Nuestro futuro juntos', description: 'Esto es solo el comienzo. Quiero vivir cada capitulo de esta historia a tu lado, porque contigo todo es mejor.', icon: 'infinity', color: 'from-cyan-500 to-blue-600' }
    ]
    
    for (let i = 0; i < defaultTimeline.length; i++) {
      const item = defaultTimeline[i]
      await pool.query(`
        INSERT INTO page_timeline (page_id, order_index, date_label, title, description, icon, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [page.id, i, item.date_label, item.title, item.description, item.icon, item.color])
    }
    
    const defaultLetter = `Cada dia que pasa me doy cuenta de lo afortunado que soy de tenerte en mi vida. Eres la luz que ilumina mis mananas, la calma en mis tormentas y la razon de mis sonrisas mas sinceras.

Desde que llegaste, todo tiene mas color, mas sentido. Contigo aprendi que el amor no solo se siente, se vive, se respira, se comparte en cada mirada, en cada abrazo, en cada silencio complice.

Gracias por cada momento, por cada risa, por cada sueno compartido. Esto es solo el comienzo de una historia que quiero escribir a tu lado para siempre.`
    
    await pool.query(`
      INSERT INTO page_letter (page_id, content, signature_text, greeting)
      VALUES ($1, $2, $3, $4)
    `, [page.id, defaultLetter, 'Con todo mi amor, tu Corazon', 'Mi amor,'])
    
    await pool.query(`
      INSERT INTO page_settings (page_id, theme_colors, fonts, celebration_enabled, particle_effects)
      VALUES ($1, $2, $3, $4, $5)
    `, [page.id, JSON.stringify({ primary: '#e74c3c', secondary: '#f39c12', background: '#0a0a0f' }), JSON.stringify({ heading: 'Playfair Display', body: 'Inter', script: 'Great Vibes' }), true, true])
    
    res.json(page)
  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: 'Error al crear pagina: ' + err.message })
  }
})

app.get('/api/corazon/pages/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    
    const page = await pool.query('SELECT * FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (page.rows.length === 0) return res.status(404).json({ error: 'Pagina no encontrada' })
    
    const timeline = await pool.query('SELECT * FROM page_timeline WHERE page_id = $1 ORDER BY order_index', [pageId])
    const photos = await pool.query(`
      SELECT id,
        CASE WHEN image_data LIKE 'data:%' THEN image_data ELSE 'data:image/jpeg;base64,' || image_data END as image_data,
        CASE WHEN thumbnail_data LIKE 'data:%' THEN thumbnail_data ELSE 'data:image/jpeg;base64,' || thumbnail_data END as thumbnail_data,
        order_index, duration_ms, transition_type
      FROM page_photos WHERE page_id = $1 ORDER BY order_index
    `, [pageId])
    const letter = await pool.query('SELECT * FROM page_letter WHERE page_id = $1', [pageId])
    const settings = await pool.query(`
      SELECT id, page_id, theme_colors, fonts, custom_css, celebration_enabled, particle_effects,
        CASE WHEN background_audio LIKE 'data:%' OR background_audio IS NULL THEN background_audio ELSE 'data:audio/mpeg;base64,' || background_audio END as background_audio
      FROM page_settings WHERE page_id = $1
    `, [pageId])
    const videos = await pool.query('SELECT * FROM page_videos WHERE page_id = $1 ORDER BY created_at DESC', [pageId])
    
    res.json({
      ...page.rows[0],
      timeline: timeline.rows,
      photos: photos.rows,
      letter: letter.rows[0],
      settings: settings.rows[0],
      videos: videos.rows
    })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.patch('/api/corazon/pages/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const { hero_title, hero_subtitle, hero_date_text, counter_start_date, flecha_name, corazon_name, is_public, status } = req.body
    
    const updates = []
    const values = []
    let idx = 1
    
    if (hero_title !== undefined) { updates.push(`hero_title = $${idx++}`); values.push(hero_title) }
    if (hero_subtitle !== undefined) { updates.push(`hero_subtitle = $${idx++}`); values.push(hero_subtitle) }
    if (hero_date_text !== undefined) { updates.push(`hero_date_text = $${idx++}`); values.push(hero_date_text) }
    if (counter_start_date !== undefined) { updates.push(`counter_start_date = $${idx++}`); values.push(counter_start_date) }
    if (flecha_name !== undefined) { updates.push(`flecha_name = $${idx++}`); values.push(flecha_name) }
    if (corazon_name !== undefined) { updates.push(`corazon_name = $${idx++}`); values.push(corazon_name) }
    if (is_public !== undefined) { updates.push(`is_public = $${idx++}`); values.push(is_public) }
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status) }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(pageId, userId)
    
    const result = await pool.query(
      `UPDATE love_pages SET ${updates.join(', ')} WHERE id = $${idx++} AND corazon_id = $${idx} RETURNING *`,
      values
    )
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

app.delete('/api/corazon/pages/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const result = await pool.query('DELETE FROM love_pages WHERE id = $1 AND corazon_id = $2 RETURNING id', [req.params.id, userId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.get('/api/page/:slug', async (req, res) => {
  try {
    const page = await pool.query('SELECT * FROM love_pages WHERE page_slug = $1', [req.params.slug])
    if (page.rows.length === 0) return res.status(404).json({ error: 'Pagina no encontrada' })
    
    if (page.rows[0].status !== 'published' && page.rows[0].status !== 'draft') {
      return res.status(404).json({ error: 'Pagina no disponible' })
    }
    
    await pool.query('UPDATE love_pages SET view_count = view_count + 1 WHERE id = $1', [page.rows[0].id])
    
    const timeline = await pool.query('SELECT * FROM page_timeline WHERE page_id = $1 ORDER BY order_index', [page.rows[0].id])
    const photos = await pool.query(`
      SELECT id,
        CASE WHEN image_data LIKE 'data:%' THEN image_data ELSE 'data:image/jpeg;base64,' || image_data END as image_data,
        CASE WHEN thumbnail_data LIKE 'data:%' THEN thumbnail_data ELSE 'data:image/jpeg;base64,' || thumbnail_data END as thumbnail_data,
        order_index, duration_ms, transition_type
      FROM page_photos WHERE page_id = $1 ORDER BY order_index
    `, [page.rows[0].id])
    const letter = await pool.query('SELECT * FROM page_letter WHERE page_id = $1', [page.rows[0].id])
    const settings = await pool.query(`
      SELECT id, page_id, theme_colors, fonts, custom_css, celebration_enabled, particle_effects,
        CASE WHEN background_audio LIKE 'data:%' OR background_audio IS NULL THEN background_audio ELSE 'data:audio/mpeg;base64,' || background_audio END as background_audio
      FROM page_settings WHERE page_id = $1
    `, [page.rows[0].id])
    const videos = await pool.query(`
      SELECT id, page_id, corazon_id, status, progress, title, created_at, completed_at
      FROM page_videos WHERE page_id = $1 AND status = 'completed' ORDER BY created_at DESC
    `, [page.rows[0].id])

    res.json({
      ...page.rows[0],
      timeline: timeline.rows,
      photos: photos.rows,
      letter: letter.rows[0],
      settings: settings.rows[0],
      videos: videos.rows,
      is_viewer: true
    })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.get('/api/page/:slug/full', async (req, res) => {
  try {
    const page = await pool.query('SELECT * FROM love_pages WHERE page_slug = $1', [req.params.slug])
    if (page.rows.length === 0) return res.status(404).json({ error: 'Pagina no encontrada' })
    
    const timeline = await pool.query('SELECT * FROM page_timeline WHERE page_id = $1 ORDER BY order_index', [page.rows[0].id])
    const photos = await pool.query(`
      SELECT id,
        CASE WHEN image_data LIKE 'data:%' THEN image_data ELSE 'data:image/jpeg;base64,' || image_data END as image_data,
        CASE WHEN thumbnail_data LIKE 'data:%' THEN thumbnail_data ELSE 'data:image/jpeg;base64,' || thumbnail_data END as thumbnail_data,
        order_index, duration_ms, transition_type
      FROM page_photos WHERE page_id = $1 ORDER BY order_index
    `, [page.rows[0].id])
    const letter = await pool.query('SELECT * FROM page_letter WHERE page_id = $1', [page.rows[0].id])
    const settings = await pool.query(`
      SELECT id, page_id, theme_colors, fonts, custom_css, celebration_enabled, particle_effects,
        CASE WHEN background_audio LIKE 'data:%' OR background_audio IS NULL THEN background_audio ELSE 'data:audio/mpeg;base64,' || background_audio END as background_audio
      FROM page_settings WHERE page_id = $1
    `, [page.rows[0].id])
    const videos = await pool.query(`
      SELECT pv.*, pv.id as video_id FROM page_videos pv WHERE pv.page_id = $1 AND pv.status = 'completed'
    `, [page.rows[0].id])
    
    res.json({
      ...page.rows[0],
      timeline: timeline.rows,
      photos: photos.rows,
      letter: letter.rows[0],
      settings: settings.rows[0],
      videos: videos.rows
    })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.patch('/api/corazon/pages/:id/timeline', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const { items } = req.body
    
    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    
    await pool.query('DELETE FROM page_timeline WHERE page_id = $1', [pageId])
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await pool.query(`
        INSERT INTO page_timeline (page_id, order_index, date_label, title, description, icon, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [pageId, i, item.date_label, item.title, item.description, item.icon, item.color])
    }
    
    const result = await pool.query('SELECT * FROM page_timeline WHERE page_id = $1 ORDER BY order_index', [pageId])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.patch('/api/corazon/pages/:id/photos', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const { photos } = req.body

    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: 'El campo photos debe ser un array' })
    }

    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    await pool.query('DELETE FROM page_photos WHERE page_id = $1', [pageId])

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      if (!photo || !photo.image_data) {
        console.error(`Foto en indice ${i} sin image_data`)
        continue
      }
      const imageData = String(photo.image_data).includes(',') ? String(photo.image_data).split(',')[1] : photo.image_data
      const thumbSource = photo.thumbnail_data || photo.image_data
      const thumbData = String(thumbSource).includes(',') ? String(thumbSource).split(',')[1] : thumbSource
      await pool.query(`
        INSERT INTO page_photos (page_id, image_data, thumbnail_data, order_index, duration_ms, transition_type)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [pageId, imageData, thumbData, i, photo.duration_ms || 6000, photo.transition_type || 'fade'])
    }

    const result = await pool.query(`
      SELECT id,
        CASE WHEN image_data LIKE 'data:%' THEN image_data ELSE 'data:image/jpeg;base64,' || image_data END as image_data,
        CASE WHEN thumbnail_data LIKE 'data:%' THEN thumbnail_data ELSE 'data:image/jpeg;base64,' || thumbnail_data END as thumbnail_data,
        order_index, duration_ms, transition_type
      FROM page_photos WHERE page_id = $1 ORDER BY order_index
    `, [pageId])
    res.json(result.rows)
  } catch (err) {
    console.error('Error guardando fotos:', err)
    res.status(500).json({ error: 'Error al guardar fotos: ' + err.message })
  }
})

app.post('/api/corazon/pages/:id/photos', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const { image_data, thumbnail_data, duration_ms, transition_type } = req.body

    if (!image_data) {
      return res.status(400).json({ error: 'image_data es requerido' })
    }

    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    const imageData = String(image_data).includes(',') ? String(image_data).split(',')[1] : image_data
    const thumbSource = thumbnail_data || image_data
    const thumbData = String(thumbSource).includes(',') ? String(thumbSource).split(',')[1] : thumbSource

    const countResult = await pool.query('SELECT COUNT(*) as count FROM page_photos WHERE page_id = $1', [pageId])
    const orderIndex = parseInt(countResult.rows[0].count)

    const result = await pool.query(`
      INSERT INTO page_photos (page_id, image_data, thumbnail_data, order_index, duration_ms, transition_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, page_id, order_index, duration_ms, transition_type
    `, [pageId, imageData, thumbData, orderIndex, duration_ms || 6000, transition_type || 'fade'])

    const photo = result.rows[0]
    photo.image_data = image_data
    photo.thumbnail_data = thumbnail_data || image_data
    res.json(photo)
  } catch (err) {
    console.error('Error agregando foto:', err)
    res.status(500).json({ error: 'Error al agregar foto: ' + err.message })
  }
})

app.delete('/api/corazon/pages/:id/photos/:photoId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const photoId = req.params.photoId

    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    await pool.query('DELETE FROM page_photos WHERE id = $1 AND page_id = $2', [photoId, pageId])

    const remaining = await pool.query('SELECT id FROM page_photos WHERE page_id = $1 ORDER BY order_index', [pageId])
    for (let i = 0; i < remaining.rows.length; i++) {
      await pool.query('UPDATE page_photos SET order_index = $1 WHERE id = $2', [i, remaining.rows[i].id])
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error eliminando foto:', err)
    res.status(500).json({ error: 'Error al eliminar foto: ' + err.message })
  }
})

app.patch('/api/corazon/pages/:id/photos/:photoId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const photoId = req.params.photoId
    const { duration_ms, transition_type } = req.body

    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    const updates = []
    const values = []
    let idx = 1

    if (duration_ms !== undefined) { updates.push(`duration_ms = $${idx++}`); values.push(duration_ms) }
    if (transition_type !== undefined) { updates.push(`transition_type = $${idx++}`); values.push(transition_type) }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' })
    }

    values.push(photoId, pageId)
    const result = await pool.query(`
      UPDATE page_photos SET ${updates.join(', ')} WHERE id = $${idx++} AND page_id = $${idx}
      RETURNING id, order_index, duration_ms, transition_type
    `, values)

    if (result.rows.length === 0) return res.status(404).json({ error: 'Foto no encontrada' })
    res.json(result.rows[0])
  } catch (err) {
    console.error('Error actualizando foto:', err)
    res.status(500).json({ error: 'Error al actualizar foto: ' + err.message })
  }
})

app.patch('/api/corazon/pages/:id/letter', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const { content, signature_text, greeting } = req.body
    
    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    
    const result = await pool.query(`
      INSERT INTO page_letter (page_id, content, signature_text, greeting)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (page_id) DO UPDATE SET
        content = COALESCE($2, page_letter.content),
        signature_text = COALESCE($3, page_letter.signature_text),
        greeting = COALESCE($4, page_letter.greeting)
      RETURNING *
    `, [pageId, content, signature_text, greeting])
    
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.patch('/api/corazon/pages/:id/settings', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    const { theme_colors, fonts, custom_css, celebration_enabled, particle_effects, background_audio } = req.body

    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    const audioData = background_audio !== undefined
      ? (String(background_audio).includes(',') ? String(background_audio).split(',')[1] : background_audio)
      : undefined

    const result = await pool.query(`
      INSERT INTO page_settings (page_id, theme_colors, fonts, custom_css, celebration_enabled, particle_effects, background_audio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (page_id) DO UPDATE SET
        theme_colors = COALESCE($2, page_settings.theme_colors),
        fonts = COALESCE($3, page_settings.fonts),
        custom_css = COALESCE($4, page_settings.custom_css),
        celebration_enabled = COALESCE($5, page_settings.celebration_enabled),
        particle_effects = COALESCE($6, page_settings.particle_effects),
        background_audio = COALESCE($7, page_settings.background_audio)
      RETURNING *
    `, [pageId, JSON.stringify(theme_colors), JSON.stringify(fonts), custom_css, celebration_enabled, particle_effects, audioData || null])

    const row = result.rows[0]
    if (row.background_audio) {
      row.background_audio = `data:audio/mpeg;base64,${row.background_audio}`
    }
    res.json(row)
  } catch (err) {
    console.error('Error settings:', err)
    res.status(500).json({ error: 'Error' })
  }
})

app.post('/api/corazon/pages/:id/generate-video', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id

    const pageCheck = await pool.query('SELECT * FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })

    const photos = await pool.query('SELECT image_data, duration_ms, transition_type FROM page_photos WHERE page_id = $1 ORDER BY order_index', [pageId])
    if (photos.rows.length < 2) return res.status(400).json({ error: 'Necesitas al menos 2 fotos' })

    const videoResult = await pool.query(`
      INSERT INTO page_videos (page_id, corazon_id, status, progress, title)
      VALUES ($1, $2, 'processing', 0, $3)
      RETURNING *
    `, [pageId, userId, `Video para ${pageCheck.rows[0].flecha_name}`])
    const video = videoResult.rows[0]

    const framesDir = path.join(__dirname, 'frames', video.id)
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true })

    for (let i = 0; i < photos.rows.length; i++) {
      const photo = photos.rows[i]
      const rawImageData = String(photo.image_data).includes(',') ? String(photo.image_data).split(',')[1] : photo.image_data
      const buffer = Buffer.from(rawImageData, 'base64')
      const framePath = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.jpg`)
      fs.writeFileSync(framePath, buffer)
      await pool.query('UPDATE page_videos SET progress = $1 WHERE id = $2', [Math.floor(((i + 1) / photos.rows.length) * 40), video.id])
    }

    const outputPath = path.join(__dirname, 'videos', `${video.id}.mp4`)
    if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true })

    const transitionNameMap = {
      fade: 'fade',
      slide_left: 'slideright',
      slide_right: 'slideleft',
      zoom: 'zoomin',
      crossdissolve: 'dissolve'
    }

    const scaleFilter = 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p'

    const buildSimpleConcatVideo = () => {
      const concatFile = path.join(framesDir, 'concat.txt')
      const concatContent = photos.rows.map((photo, i) => {
        const durationSec = (photo.duration_ms || 6000) / 1000
        return `file 'frame_${String(i).padStart(4, '0')}.jpg'\nduration ${durationSec}`
      }).join('\n') + '\n'
      fs.writeFileSync(concatFile, concatContent)

      ffmpeg()
        .input(concatFile)
        .inputFormat('concat')
        .inputOptions(['-safe 0'])
        .outputOptions(['-c:v libx264', '-preset medium', '-crf 23', '-pix_fmt yuv420p', '-vf', scaleFilter, '-r', '30'])
        .output(outputPath)
        .on('progress', async (progress) => {
          await pool.query('UPDATE page_videos SET progress = $1 WHERE id = $2', [40 + Math.floor((progress.percent || 0) * 0.6), video.id])
        })
        .on('end', async () => {
          try {
            const videoData = fs.readFileSync(outputPath)
            await pool.query(
              "UPDATE page_videos SET status = 'completed', progress = 100, output_data = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2",
              [videoData.toString('base64'), video.id]
            )
          } catch (e) {
            console.error('Error saving video:', e)
            await pool.query("UPDATE page_videos SET status = 'error' WHERE id = $1", [video.id])
          }
          try {
            fs.unlinkSync(concatFile)
            fs.rmSync(framesDir, { recursive: true, force: true })
            fs.unlinkSync(outputPath)
          } catch (e) {}
        })
        .on('error', async (err) => {
          console.error('FFmpeg concat error:', err.message)
          await pool.query("UPDATE page_videos SET status = 'error' WHERE id = $1", [video.id])
        })
        .run()
    }

    const buildTransitionVideo = () => {
      const ffmpegCmd = ffmpeg()
      const complexFilter = []

      for (let i = 0; i < photos.rows.length; i++) {
        const photo = photos.rows[i]
        const durationSec = (photo.duration_ms || 6000) / 1000
        const framePath = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.jpg`)
        ffmpegCmd.input(framePath).inputOptions(['-loop 1', `-t ${durationSec}`])
        complexFilter.push(`[${i}:v]${scaleFilter}[s${i}]`)
      }

      let currentDuration = 0
      for (let i = 0; i < photos.rows.length; i++) {
        const durationSec = (photos.rows[i].duration_ms || 6000) / 1000
        if (i === 0) {
          currentDuration = durationSec
          continue
        }

        const prevDuration = (photos.rows[i - 1].duration_ms || 6000) / 1000
        const transitionDur = Math.min(0.8, durationSec / 2, prevDuration / 2)
        const transitionKey = photos.rows[i].transition_type || 'fade'
        const transitionName = transitionNameMap[transitionKey] || 'fade'
        const prevLabel = i === 1 ? 's0' : `x${i - 1}`
        const offset = Math.max(0, currentDuration - transitionDur)

        if (transitionDur <= 0) {
          complexFilter.push(`[${prevLabel}][s${i}]concat=n=2:v=1:a=0[x${i}]`)
          currentDuration = currentDuration + durationSec
        } else {
          complexFilter.push(`[${prevLabel}][s${i}]xfade=transition=${transitionName}:duration=${transitionDur}:offset=${offset}[x${i}]`)
          currentDuration = currentDuration + durationSec - transitionDur
        }
      }

      const finalLabel = photos.rows.length === 1 ? 's0' : `x${photos.rows.length - 1}`

      ffmpegCmd
        .complexFilter(complexFilter)
        .outputOptions(['-map', `[${finalLabel}]`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p'])
        .output(outputPath)
        .on('progress', async (progress) => {
          await pool.query('UPDATE page_videos SET progress = $1 WHERE id = $2', [40 + Math.floor((progress.percent || 0) * 0.6), video.id])
        })
        .on('end', async () => {
          try {
            const videoData = fs.readFileSync(outputPath)
            await pool.query(
              "UPDATE page_videos SET status = 'completed', progress = 100, output_data = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2",
              [videoData.toString('base64'), video.id]
            )
          } catch (e) {
            console.error('Error saving video:', e)
            await pool.query("UPDATE page_videos SET status = 'error' WHERE id = $1", [video.id])
          }
          try {
            fs.rmSync(framesDir, { recursive: true, force: true })
            fs.unlinkSync(outputPath)
          } catch (e) {}
        })
        .on('error', async (err) => {
          console.error('FFmpeg xfade error:', err.message)
          await pool.query("UPDATE page_videos SET status = 'error' WHERE id = $1", [video.id])
        })
        .run()
    }

    await pool.query('UPDATE page_videos SET progress = 42 WHERE id = $1', [video.id])

    buildTransitionVideo()

    res.json(video)
  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: 'Error: ' + err.message })
  }
})

app.get('/api/corazon/pages/:id/videos', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    const pageId = req.params.id
    
    const pageCheck = await pool.query('SELECT id FROM love_pages WHERE id = $1 AND corazon_id = $2', [pageId, userId])
    if (pageCheck.rows.length === 0) return res.status(404).json({ error: 'No encontrado' })
    
    const videos = await pool.query('SELECT * FROM page_videos WHERE page_id = $1 ORDER BY created_at DESC', [pageId])
    res.json(videos.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.get('/api/videos/:id/stream', async (req, res) => {
  try {
    const result = await pool.query('SELECT output_data FROM page_videos WHERE id = $1', [req.params.id])
    if (result.rows.length === 0 || !result.rows[0].output_data) return res.status(404).json({ error: 'Video no encontrado' })
    
    const videoData = Buffer.from(result.rows[0].output_data, 'base64')
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Length', videoData.length)
    res.send(videoData)
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.get('/api/animations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM animations ORDER BY name')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

app.get('/api/cupido/stats', async (req, res) => {
  try {
    const usersCount = await pool.query('SELECT COUNT(*) FROM users WHERE role != $1', ['cupido'])
    const pagesCount = await pool.query('SELECT COUNT(*) FROM love_pages')
    const totalViews = await pool.query('SELECT COALESCE(SUM(view_count), 0) as total FROM love_pages')
    const publishedPages = await pool.query("SELECT COUNT(*) FROM love_pages WHERE status = 'published'")
    
    res.json({
      total_users: parseInt(usersCount.rows[0].count),
      total_pages: parseInt(pagesCount.rows[0].count),
      published_pages: parseInt(publishedPages.rows[0].count),
      total_views: parseInt(totalViews.rows[0].total)
    })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

import serverless from 'serverless-http'

const handler = serverless(app)

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(3001, () => {
    console.log('')
    console.log('╔═══════════════════════════════════════════════════════════════╗')
    console.log('║                                                               ║')
    console.log('║    ❤️  Cupido Server corriendo en http://localhost:3001  ❤️    ║')
    console.log('║                                                               ║')
    console.log('╚═══════════════════════════════════════════════════════════════╝')
  })
}

export default handler
export { app }