import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
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

const DEMO_KIDS = [
  { name: 'Child One', accentColor: '#a855f7' },
  { name: 'Child Two', accentColor: '#3b82f6' },
]

const DEMO_CHORES = [
  { emoji: '🦷', label: 'Brush Teeth',   colorFrom: '#38bdf8', colorTo: '#67e8f9', checkedFrom: '#075985', checkedTo: '#164e63', checkColor: '#0369a1', timeOfDay: 'morning' },
  { emoji: '🛏️', label: 'Make Your Bed', colorFrom: '#f472b6', colorTo: '#fb7185', checkedFrom: '#9d174d', checkedTo: '#9f1239', checkColor: '#be185d', timeOfDay: 'morning' },
  { emoji: '🎒', label: 'Pack Your Bag', colorFrom: '#fb923c', colorTo: '#f87171', checkedFrom: '#c2410c', checkedTo: '#b91c1c', checkColor: '#b91c1c', timeOfDay: 'evening' },
  { emoji: '📚', label: 'Read a Book',   colorFrom: '#fde68a', colorTo: '#fca5a5', checkedFrom: '#92400e', checkedTo: '#991b1b', checkColor: '#b45309', timeOfDay: 'evening' },
]

const DEMO_PRIZES = [
  ['???', '#FF6B6B', '#c0392b'],
  ['???', '#FFD93D', '#d4a017'],
  ['???', '#6BCB77', '#27ae60'],
  ['???', '#4D96FF', '#1a6fc4'],
  ['???', '#C77DFF', '#8e44ad'],
]

async function seedDemoData(client, userId) {
  for (let i = 0; i < DEMO_KIDS.length; i++) {
    const k = DEMO_KIDS[i]
    await client.query(
      'INSERT INTO kids (name, accent_color, sort_order, user_id) VALUES ($1,$2,$3,$4)',
      [k.name, k.accentColor, i, userId]
    )
  }
  for (let i = 0; i < DEMO_CHORES.length; i++) {
    const c = DEMO_CHORES[i]
    await client.query(
      `INSERT INTO chores (emoji, label, color_from, color_to, checked_from, checked_to, check_color, time_of_day, sort_order, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [c.emoji, c.label, c.colorFrom, c.colorTo, c.checkedFrom, c.checkedTo, c.checkColor, c.timeOfDay, i, userId]
    )
  }
  for (let i = 0; i < DEMO_PRIZES.length; i++) {
    const [label, color, darkColor] = DEMO_PRIZES[i]
    await client.query(
      'INSERT INTO prizes (label, color, dark_color, sort_order, user_id) VALUES ($1,$2,$3,$4,$5)',
      [label, color, darkColor, i, userId]
    )
  }
}

async function initDB() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  await pool.query(schema)

  // One-time migration: attach pre-existing (pre-multi-tenant) data to a jesseward account
  const { rows: [{ c: userCount }] } = await pool.query('SELECT COUNT(*)::int AS c FROM users')
  if (userCount === 0) {
    const { rows: [{ c: orphanCount }] } = await pool.query('SELECT COUNT(*)::int AS c FROM kids WHERE user_id IS NULL')
    if (orphanCount > 0) {
      const hash = await bcrypt.hash('0891', 10)
      const { rows: [user] } = await pool.query(
        "INSERT INTO users (username, pin_hash) VALUES ('jesseward', $1) RETURNING id",
        [hash]
      )
      for (const table of ['kids', 'chores', 'prizes', 'daily_checks', 'completed_days', 'wheel_spins']) {
        await pool.query(`UPDATE ${table} SET user_id = $1 WHERE user_id IS NULL`, [user.id])
      }
    }
  }
}

function getServerTimeSlot() {
  return new Date().getHours() < 12 ? 'morning' : 'evening'
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

const PgSession = connectPgSimple(session)

app.use(express.json())
app.use('/uploads', express.static(uploadsDir))
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'chore-stars-dev-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { secure: false, maxAge: 365 * 24 * 60 * 60 * 1000 },
}))

const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' })
  next()
}

const requireParent = (req, res, next) => {
  if (req.session.isParent) return next()
  res.status(401).json({ error: 'Not authorized' })
}

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  const { username, pin } = req.body
  if (!username?.trim()) return res.status(400).json({ error: 'Username required' })
  if (!/^\d{4}$/.test(String(pin || ''))) return res.status(400).json({ error: 'PIN must be 4 digits' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const hash = await bcrypt.hash(String(pin), 10)
    const { rows: [user] } = await client.query(
      'INSERT INTO users (username, pin_hash) VALUES ($1, $2) RETURNING id',
      [username.trim(), hash]
    )
    await seedDemoData(client, user.id)
    await client.query('COMMIT')

    req.session.regenerate(err => {
      if (err) return res.status(500).json({ error: 'Session error' })
      req.session.userId = user.id
      res.json({ ok: true })
    })
  } catch (e) {
    await client.query('ROLLBACK')
    if (e.code === '23505') return res.status(409).json({ error: 'Username already taken' })
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, pin } = req.body
    const { rows } = await pool.query('SELECT id, pin_hash FROM users WHERE username = $1', [String(username || '').trim()])
    const ok = rows[0] && await bcrypt.compare(String(pin || ''), rows[0].pin_hash)
    if (!ok) return res.status(401).json({ error: 'Wrong username or PIN' })
    req.session.regenerate(err => {
      if (err) return res.status(500).json({ error: 'Session error' })
      req.session.userId = rows[0].id
      res.json({ ok: true })
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }))
})

app.get('/api/auth/status', async (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false })
  const { rows } = await pool.query('SELECT username, intro_seen FROM users WHERE id = $1', [req.session.userId])
  if (!rows[0]) return req.session.destroy(() => res.json({ loggedIn: false }))
  res.json({ loggedIn: true, username: rows[0].username, introSeen: rows[0].intro_seen, isParent: !!req.session.isParent })
})

app.post('/api/auth/verify-pin', requireLogin, async (req, res) => {
  try {
    const { pin } = req.body
    const { rows } = await pool.query('SELECT pin_hash FROM users WHERE id = $1', [req.session.userId])
    const ok = rows[0] && await bcrypt.compare(String(pin || ''), rows[0].pin_hash)
    if (!ok) return res.status(401).json({ error: 'Wrong PIN' })
    req.session.isParent = true
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/auth/seen-intro', requireLogin, async (req, res) => {
  await pool.query('UPDATE users SET intro_seen = TRUE WHERE id = $1', [req.session.userId])
  res.json({ ok: true })
})

app.post('/api/auth/change-pin', requireLogin, requireParent, async (req, res) => {
  try {
    const { newPin } = req.body
    if (!/^\d{4}$/.test(String(newPin || ''))) return res.status(400).json({ error: 'PIN must be 4 digits' })
    const hash = await bcrypt.hash(String(newPin), 10)
    await pool.query('UPDATE users SET pin_hash = $1 WHERE id = $2', [hash, req.session.userId])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next()
  requireLogin(req, res, next)
})

// ── App state ─────────────────────────────────────────────────────────────────
app.get('/api/state', async (req, res) => {
  try {
    const uid = req.session.userId
    const today = new Date().toISOString().split('T')[0]
    const weekStart = getWeekStart()

    const [kids, chores, prizes, checks, days, spin] = await Promise.all([
      pool.query('SELECT * FROM kids WHERE user_id = $1 ORDER BY sort_order, id', [uid]),
      pool.query('SELECT * FROM chores WHERE user_id = $1 AND active = TRUE ORDER BY sort_order, id', [uid]),
      pool.query('SELECT * FROM prizes WHERE user_id = $1 ORDER BY sort_order, id', [uid]),
      pool.query('SELECT kid_id, chore_id FROM daily_checks WHERE user_id = $1 AND check_date = $2 AND (check_slot = $3 OR check_slot = \'both\')', [uid, today, getServerTimeSlot()]),
      pool.query('SELECT day_key FROM completed_days WHERE user_id = $1 AND week_start = $2', [uid, weekStart]),
      pool.query('SELECT id FROM wheel_spins WHERE user_id = $1 AND week_start = $2', [uid, weekStart]),
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
    const uid = req.session.userId
    const { kidId, choreId, checkSlot } = req.body
    const slot = checkSlot || 'both'
    const today = new Date().toISOString().split('T')[0]
    const { rows } = await pool.query(
      'SELECT id FROM daily_checks WHERE kid_id=$1 AND chore_id=$2 AND check_date=$3 AND check_slot=$4 AND user_id=$5',
      [kidId, choreId, today, slot, uid]
    )
    if (rows.length > 0) {
      await pool.query('DELETE FROM daily_checks WHERE id=$1', [rows[0].id])
    } else {
      await pool.query(
        'INSERT INTO daily_checks (kid_id, chore_id, check_date, check_slot, user_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [kidId, choreId, today, slot, uid]
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
      'INSERT INTO completed_days (day_key, week_start, user_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [dayKey, getWeekStart(), req.session.userId]
    )
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Wheel spun ────────────────────────────────────────────────────────────────
app.post('/api/wheel-spun', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO wheel_spins (week_start, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [getWeekStart(), req.session.userId]
    )
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Day reset ─────────────────────────────────────────────────────────────────
app.post('/api/day-reset', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    await pool.query('DELETE FROM daily_checks WHERE check_date=$1 AND user_id=$2', [today, req.session.userId])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Kids ──────────────────────────────────────────────────────────────────────
app.get('/api/kids', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM kids WHERE user_id = $1 ORDER BY sort_order, id', [req.session.userId])
  res.json(rows)
})

app.post('/api/kids', requireParent, async (req, res) => {
  try {
    const uid = req.session.userId
    const { name, accentColor, pin } = req.body
    const { rows: [{ max }] } = await pool.query('SELECT MAX(sort_order) AS max FROM kids WHERE user_id = $1', [uid])
    const { rows } = await pool.query(
      'INSERT INTO kids (name, accent_color, pin, sort_order, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, accentColor || '#8b5cf6', pin || null, (max ?? -1) + 1, uid]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/kids/:id', requireParent, async (req, res) => {
  try {
    const { name, accentColor, pin } = req.body
    const { rows } = await pool.query(
      'UPDATE kids SET name=$1, accent_color=$2, pin=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
      [name, accentColor || '#8b5cf6', pin || null, req.params.id, req.session.userId]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/kids/:id', requireParent, async (req, res) => {
  try {
    await pool.query('DELETE FROM kids WHERE id=$1 AND user_id=$2', [req.params.id, req.session.userId])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/kids/:id/avatar', requireParent, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = `/uploads/${req.file.filename}`
    const { rows } = await pool.query(
      'UPDATE kids SET avatar_url=$1 WHERE id=$2 AND user_id=$3 RETURNING *',
      [avatarUrl, req.params.id, req.session.userId]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Chores ────────────────────────────────────────────────────────────────────
app.get('/api/chores', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM chores WHERE user_id = $1 ORDER BY sort_order, id', [req.session.userId])
  res.json(rows)
})

app.post('/api/chores', requireParent, async (req, res) => {
  try {
    const uid = req.session.userId
    const { emoji, label, colorFrom, colorTo, checkedFrom, checkedTo, checkColor, timeOfDay } = req.body
    const { rows: [{ max }] } = await pool.query('SELECT MAX(sort_order) AS max FROM chores WHERE user_id = $1', [uid])
    const { rows } = await pool.query(
      `INSERT INTO chores (emoji, label, color_from, color_to, checked_from, checked_to, check_color, time_of_day, sort_order, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [emoji || '⭐', label, colorFrom || '#facc15', colorTo || '#f97316',
       checkedFrom || '#b45309', checkedTo || '#c2410c', checkColor || '#ea580c',
       timeOfDay || 'both', (max ?? -1) + 1, uid]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/chores/:id', requireParent, async (req, res) => {
  try {
    const { emoji, label, colorFrom, colorTo, checkedFrom, checkedTo, checkColor, active, timeOfDay } = req.body
    const { rows } = await pool.query(
      `UPDATE chores SET emoji=$1, label=$2, color_from=$3, color_to=$4,
       checked_from=$5, checked_to=$6, check_color=$7, active=$8, time_of_day=$9 WHERE id=$10 AND user_id=$11 RETURNING *`,
      [emoji, label, colorFrom, colorTo, checkedFrom, checkedTo, checkColor, active, timeOfDay || 'both', req.params.id, req.session.userId]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/chores/:id', requireParent, async (req, res) => {
  try {
    await pool.query('DELETE FROM chores WHERE id=$1 AND user_id=$2', [req.params.id, req.session.userId])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Prizes ────────────────────────────────────────────────────────────────────
app.get('/api/prizes', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM prizes WHERE user_id = $1 ORDER BY sort_order, id', [req.session.userId])
  res.json(rows)
})

app.put('/api/prizes/:id', requireParent, async (req, res) => {
  try {
    const { label, color, darkColor } = req.body
    const { rows } = await pool.query(
      'UPDATE prizes SET label=$1, color=$2, dark_color=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
      [label, color, darkColor, req.params.id, req.session.userId]
    )
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── SPA fallback ──────────────────────────────────────────────────────────────
// Assets get long-lived cache (filenames include content hash); HTML never cached
app.use('/assets', express.static(join(__dirname, '..', 'dist', 'assets'), {
  maxAge: '1y', immutable: true,
}))
app.use(express.static(join(__dirname, '..', 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    }
  },
}))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
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
