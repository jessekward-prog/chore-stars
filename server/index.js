import express from 'express'
import session from 'express-session'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, mkdirSync } from 'fs'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const { Pool } = pg
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'chorechart',
  user: process.env.DB_USER || 'chorechart',
  password: process.env.DB_PASSWORD || 'chorechart',
})

async function initDB() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  await pool.query(schema)

  const { rows: [kc] } = await pool.query('SELECT COUNT(*)::int AS c FROM kids')
  if (kc.c === 0) {
    await pool.query(`
      INSERT INTO kids (name, color_from, color_to, tab_from, tab_to, sort_order) VALUES
      ('Peyton', '#f472b6', '#a855f7', '#e879f9', '#9333ea', 0),
      ('Jude',   '#3b82f6', '#06b6d4', '#3b82f6', '#06b6d4', 1)
    `)
  }

  const { rows: [cc] } = await pool.query('SELECT COUNT(*)::int AS c FROM chores')
  if (cc.c === 0) {
    await pool.query(`
      INSERT INTO chores (emoji, label, color_from, color_to, checked_from, checked_to, check_color, sort_order) VALUES
      ('🌞', 'Wake Up & Stretch', '#facc15', '#f97316', '#b45309', '#c2410c', '#ea580c', 0),
      ('👕', 'Get Dressed',       '#a78bfa', '#e879f9', '#6d28d9', '#a21caf', '#7c3aed', 1),
      ('🥣', 'Eat Breakfast',     '#34d399', '#2dd4bf', '#065f46', '#134e4a', '#047857', 2),
      ('🦷', 'Brush Teeth',       '#38bdf8', '#67e8f9', '#075985', '#164e63', '#0369a1', 3),
      ('🛏️', 'Make Your Bed',     '#f472b6', '#fb7185', '#9d174d', '#9f1239', '#be185d', 4),
      ('🎒', 'Pack Your Bag',     '#fb923c', '#f87171', '#c2410c', '#b91c1c', '#b91c1c', 5)
    `)
  }

  const { rows: [pc] } = await pool.query('SELECT COUNT(*)::int AS c FROM prizes')
  if (pc.c === 0) {
    await pool.query(`
      INSERT INTO prizes (label, color, dark_color, sort_order) VALUES
      ('???', '#FF6B6B', '#c0392b', 0),
      ('???', '#FFD93D', '#d4a017', 1),
      ('???', '#6BCB77', '#27ae60', 2),
      ('???', '#4D96FF', '#1a6fc4', 3),
      ('???', '#C77DFF', '#8e44ad', 4)
    `)
  }

  const { rows: [sc] } = await pool.query("SELECT COUNT(*)::int AS c FROM settings WHERE key = 'parent_password'")
  if (sc.c === 0) {
    const hash = await bcrypt.hash('stars123', 10)
    await pool.query("INSERT INTO settings (key, value) VALUES ('parent_password', $1)", [hash])
  }
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon.toISOString().split('T')[0]
}

const app = express()
const PORT = Number(process.env.PORT) || 3001

const uploadsDir = join(__dirname, '..', 'uploads')
mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase()
    cb(null, `kid-${req.params.id}-${Date.now()}.${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

app.use(express.json())
app.use('/uploads', express.static(uploadsDir))
app.use(session({
  secret: process.env.SESSION_SECRET || 'chore-stars-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}))

const requireParent = (req, res, next) => {
  if (req.session.isParent) return next()
  res.status(401).json({ error: 'Not authorized' })
}

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body
    const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'parent_password'")
    if (!rows[0]) return res.status(500).json({ error: 'No password configured' })
    const ok = await bcrypt.compare(String(password), rows[0].value)
    if (!ok) return res.status(401).json({ error: 'Wrong password' })
    req.session.isParent = true
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy()
  res.json({ ok: true })
})

app.get('/api/auth/status', (req, res) => {
  res.json({ isParent: !!req.session.isParent })
})

app.post('/api/auth/change-password', requireParent, async (req, res) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' })
    const hash = await bcrypt.hash(String(newPassword), 10)
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('parent_password', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [hash]
    )
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── App state ─────────────────────────────────────────────────────────────────
app.get('/api/state', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const weekStart = getWeekStart()

    const [kids, chores, prizes, checks, days, spin] = await Promise.all([
      pool.query('SELECT * FROM kids ORDER BY sort_order, id'),
      pool.query('SELECT * FROM chores WHERE active = TRUE ORDER BY sort_order, id'),
      pool.query('SELECT * FROM prizes ORDER BY sort_order, id'),
      pool.query('SELECT kid_id, chore_id FROM daily_checks WHERE check_date = $1', [today]),
      pool.query('SELECT day_key FROM completed_days WHERE week_start = $1', [weekStart]),
      pool.query('SELECT id FROM wheel_spins WHERE week_start = $1', [weekStart]),
    ])

    const checked = {}
    for (const row of checks.rows) {
      if (!checked[row.kid_id]) checked[row.kid_id] = []
      checked[row.kid_id].push(row.chore_id)
    }

    res.json({
      kids: kids.rows,
      chores: chores.rows,
      prizes: prizes.rows,
      checked,
      completedDays: days.rows.map(r => r.day_key),
      wheelSpun: spin.rows.length > 0,
      weekStart,
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Chore toggle ──────────────────────────────────────────────────────────────
app.post('/api/toggle', async (req, res) => {
  try {
    const { kidId, choreId } = req.body
    const today = new Date().toISOString().split('T')[0]
    const { rows } = await pool.query(
      'SELECT id FROM daily_checks WHERE kid_id=$1 AND chore_id=$2 AND check_date=$3',
      [kidId, choreId, today]
    )
    if (rows.length > 0) {
      await pool.query(
        'DELETE FROM daily_checks WHERE kid_id=$1 AND chore_id=$2 AND check_date=$3',
        [kidId, choreId, today]
      )
    } else {
      await pool.query(
        'INSERT INTO daily_checks (kid_id, chore_id, check_date) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [kidId, choreId, today]
      )
    }
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Day complete ──────────────────────────────────────────────────────────────
app.post('/api/day-complete', async (req, res) => {
  try {
    const { dayKey } = req.body
    await pool.query(
      'INSERT INTO completed_days (day_key, week_start) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [dayKey, getWeekStart()]
    )
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Wheel spun ────────────────────────────────────────────────────────────────
app.post('/api/wheel-spun', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO wheel_spins (week_start) VALUES ($1) ON CONFLICT DO NOTHING',
      [getWeekStart()]
    )
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Day reset ─────────────────────────────────────────────────────────────────
app.post('/api/day-reset', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    await pool.query('DELETE FROM daily_checks WHERE check_date=$1', [today])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Kids ──────────────────────────────────────────────────────────────────────
app.get('/api/kids', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM kids ORDER BY sort_order, id')
  res.json(rows)
})

app.post('/api/kids', requireParent, async (req, res) => {
  try {
    const { name, colorFrom, colorTo, tabFrom, tabTo } = req.body
    const { rows: [{ max }] } = await pool.query('SELECT MAX(sort_order) AS max FROM kids')
    const { rows } = await pool.query(
      'INSERT INTO kids (name, color_from, color_to, tab_from, tab_to, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, colorFrom || '#f472b6', colorTo || '#a855f7', tabFrom || '#e879f9', tabTo || '#9333ea', (max ?? -1) + 1]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/kids/:id', requireParent, async (req, res) => {
  try {
    const { name, colorFrom, colorTo, tabFrom, tabTo } = req.body
    const { rows } = await pool.query(
      'UPDATE kids SET name=$1, color_from=$2, color_to=$3, tab_from=$4, tab_to=$5 WHERE id=$6 RETURNING *',
      [name, colorFrom, colorTo, tabFrom, tabTo, req.params.id]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/kids/:id', requireParent, async (req, res) => {
  try {
    await pool.query('DELETE FROM kids WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/kids/:id/avatar', requireParent, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = `/uploads/${req.file.filename}`
    const { rows } = await pool.query(
      'UPDATE kids SET avatar_url=$1 WHERE id=$2 RETURNING *',
      [avatarUrl, req.params.id]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Chores ────────────────────────────────────────────────────────────────────
app.get('/api/chores', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM chores ORDER BY sort_order, id')
  res.json(rows)
})

app.post('/api/chores', requireParent, async (req, res) => {
  try {
    const { emoji, label, colorFrom, colorTo, checkedFrom, checkedTo, checkColor } = req.body
    const { rows: [{ max }] } = await pool.query('SELECT MAX(sort_order) AS max FROM chores')
    const { rows } = await pool.query(
      `INSERT INTO chores (emoji, label, color_from, color_to, checked_from, checked_to, check_color, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [emoji || '⭐', label, colorFrom || '#facc15', colorTo || '#f97316',
       checkedFrom || '#b45309', checkedTo || '#c2410c', checkColor || '#ea580c', (max ?? -1) + 1]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/chores/:id', requireParent, async (req, res) => {
  try {
    const { emoji, label, colorFrom, colorTo, checkedFrom, checkedTo, checkColor, active } = req.body
    const { rows } = await pool.query(
      `UPDATE chores SET emoji=$1, label=$2, color_from=$3, color_to=$4,
       checked_from=$5, checked_to=$6, check_color=$7, active=$8 WHERE id=$9 RETURNING *`,
      [emoji, label, colorFrom, colorTo, checkedFrom, checkedTo, checkColor, active, req.params.id]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/chores/:id', requireParent, async (req, res) => {
  try {
    await pool.query('DELETE FROM chores WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Prizes ────────────────────────────────────────────────────────────────────
app.get('/api/prizes', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM prizes ORDER BY sort_order, id')
  res.json(rows)
})

app.put('/api/prizes/:id', requireParent, async (req, res) => {
  try {
    const { label, color, darkColor } = req.body
    const { rows } = await pool.query(
      'UPDATE prizes SET label=$1, color=$2, dark_color=$3 WHERE id=$4 RETURNING *',
      [label, color, darkColor, req.params.id]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.use(express.static(join(__dirname, '..', 'dist')))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'))
})

// ── Start ─────────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Chore Stars running at http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('DB init failed:', err)
    process.exit(1)
  })
