import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as api from './api.js'

const PANEL_BG = 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)'
const CARD = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 16 }

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      {label && <span className="text-white/50 text-xs font-black uppercase tracking-wider">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl px-4 py-3 text-white text-base outline-none"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
      />
    </div>
  )
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-white/40 text-xs w-28 flex-shrink-0">{label}</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer border-2 border-white/20"
        style={{ background: 'none', padding: 2 }}
      />
      <span className="text-white/30 text-xs font-mono">{value}</span>
    </div>
  )
}

function Btn({ children, onClick, danger, disabled, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-xl font-black ${small ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-base'} ${disabled ? 'opacity-40' : ''}`}
      style={{
        background: danger ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.15)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.2)'}`,
        color: danger ? '#fca5a5' : 'white',
      }}
    >{children}</button>
  )
}

// ── Login prompt ───────────────────────────────────────────────────────────────
function LoginPrompt({ onSuccess }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!pw) return
    setLoading(true); setError('')
    try {
      await api.login(pw)
      onSuccess()
    } catch {
      setError('Wrong password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8"
      style={{ background: PANEL_BG, fontFamily: "'Nunito', sans-serif" }}>
      <motion.div className="text-5xl mb-4" animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity }}>
        🔒
      </motion.div>
      <div className="text-white text-2xl mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
        Grown-Ups Only
      </div>
      <div className="text-white/40 text-sm mb-8">Default password: <span className="text-yellow-300">stars123</span></div>
      <div className="w-full max-w-xs">
        <Input type="password" value={pw} onChange={setPw} placeholder="Enter password..." />
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
        <button onClick={submit} disabled={loading}
          className="w-full py-3 rounded-2xl text-white text-lg font-black"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontFamily: "'Fredoka One', cursive" }}
        >
          {loading ? 'Checking...' : '🔓 Unlock'}
        </button>
      </div>
    </div>
  )
}

// ── Kids tab ───────────────────────────────────────────────────────────────────
function KidsTab({ kids, onRefresh }) {
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(null)

  const startEdit = (kid) => {
    setAdding(false)
    setEditing(kid.id)
    setForm({ name: kid.name, colorFrom: kid.color_from, colorTo: kid.color_to, tabFrom: kid.tab_from, tabTo: kid.tab_to })
  }

  const startAdd = () => {
    setEditing(null)
    setAdding(true)
    setForm({ name: '', colorFrom: '#f472b6', colorTo: '#a855f7', tabFrom: '#e879f9', tabTo: '#9333ea' })
  }

  const cancel = () => { setEditing(null); setAdding(false) }

  const save = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    try {
      if (adding) await api.createKid(form)
      else await api.updateKid(editing, form)
      cancel(); onRefresh()
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Remove this kid?')) return
    await api.deleteKid(id); onRefresh()
  }

  const handleAvatar = async (kidId) => {
    fileRef.current.dataset.kid = kidId
    fileRef.current.click()
  }

  const onFileChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const kidId = fileRef.current.dataset.kid
    setUploading(Number(kidId))
    try { await api.uploadAvatar(kidId, file); onRefresh() }
    finally { setUploading(null); e.target.value = '' }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <div className="flex flex-col gap-3 mb-4">
        {kids.map(kid => (
          <div key={kid.id} style={CARD}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${kid.color_from}, ${kid.color_to})` }}>
                {kid.avatar_url
                  ? <img src={kid.avatar_url} alt={kid.name} className="w-full h-full object-cover" />
                  : kid.name[0]}
              </div>
              <div className="flex-1">
                <div className="text-white font-black text-base">{kid.name}</div>
                <div className="text-white/30 text-xs">{kid.color_from} → {kid.color_to}</div>
              </div>
              <div className="flex gap-2">
                <Btn small onClick={() => handleAvatar(kid.id)} disabled={uploading === kid.id}>
                  {uploading === kid.id ? '...' : '📷'}
                </Btn>
                <Btn small onClick={() => startEdit(kid)}>Edit</Btn>
                <Btn small danger onClick={() => del(kid.id)}>Del</Btn>
              </div>
            </div>

            {editing === kid.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                <div className="grid grid-cols-2 gap-x-4">
                  <ColorRow label="Card from"     value={form.colorFrom} onChange={v => setForm(f => ({ ...f, colorFrom: v }))} />
                  <ColorRow label="Card to"       value={form.colorTo}   onChange={v => setForm(f => ({ ...f, colorTo: v }))} />
                  <ColorRow label="Tab from"      value={form.tabFrom}   onChange={v => setForm(f => ({ ...f, tabFrom: v }))} />
                  <ColorRow label="Tab to"        value={form.tabTo}     onChange={v => setForm(f => ({ ...f, tabTo: v }))} />
                </div>
                <div className="flex gap-2 mt-2">
                  <Btn onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Btn>
                  <Btn onClick={cancel}>Cancel</Btn>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div style={CARD} className="mb-4">
          <div className="text-white font-black mb-3">New Kid</div>
          <Input label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Kid's name..." />
          <div className="grid grid-cols-2 gap-x-4">
            <ColorRow label="Card from" value={form.colorFrom} onChange={v => setForm(f => ({ ...f, colorFrom: v }))} />
            <ColorRow label="Card to"   value={form.colorTo}   onChange={v => setForm(f => ({ ...f, colorTo: v }))} />
            <ColorRow label="Tab from"  value={form.tabFrom}   onChange={v => setForm(f => ({ ...f, tabFrom: v }))} />
            <ColorRow label="Tab to"    value={form.tabTo}     onChange={v => setForm(f => ({ ...f, tabTo: v }))} />
          </div>
          <div className="flex gap-2 mt-2">
            <Btn onClick={save} disabled={saving || !form.name?.trim()}>{saving ? 'Adding...' : 'Add Kid'}</Btn>
            <Btn onClick={cancel}>Cancel</Btn>
          </div>
        </div>
      )}

      {!adding && <Btn onClick={startAdd}>+ Add Kid</Btn>}
    </div>
  )
}

// ── Chores tab ─────────────────────────────────────────────────────────────────
function ChoresTab({ chores, onRefresh }) {
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const EMPTY = { emoji: '⭐', label: '', colorFrom: '#facc15', colorTo: '#f97316', checkedFrom: '#b45309', checkedTo: '#c2410c', checkColor: '#ea580c' }

  const startEdit = (c) => {
    setAdding(false); setEditing(c.id)
    setForm({ emoji: c.emoji, label: c.label, colorFrom: c.color_from, colorTo: c.color_to, checkedFrom: c.checked_from, checkedTo: c.checked_to, checkColor: c.check_color, active: c.active })
  }
  const startAdd = () => { setEditing(null); setAdding(true); setForm(EMPTY) }
  const cancel = () => { setEditing(null); setAdding(false) }

  const save = async () => {
    if (!form.label?.trim()) return
    setSaving(true)
    try {
      if (adding) await api.createChore(form)
      else await api.updateChore(editing, form)
      cancel(); onRefresh()
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this chore?')) return
    await api.deleteChore(id); onRefresh()
  }

  const toggleActive = async (c) => {
    await api.updateChore(c.id, { emoji: c.emoji, label: c.label, colorFrom: c.color_from, colorTo: c.color_to, checkedFrom: c.checked_from, checkedTo: c.checked_to, checkColor: c.check_color, active: !c.active })
    onRefresh()
  }

  const ChoreForm = () => (
    <>
      <div className="flex gap-3">
        <div style={{ width: 60 }}>
          <Input label="Emoji" value={form.emoji} onChange={v => setForm(f => ({ ...f, emoji: v }))} placeholder="⭐" />
        </div>
        <div className="flex-1">
          <Input label="Label" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="Chore name..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4">
        <ColorRow label="Normal from"  value={form.colorFrom}   onChange={v => setForm(f => ({ ...f, colorFrom: v }))} />
        <ColorRow label="Normal to"    value={form.colorTo}     onChange={v => setForm(f => ({ ...f, colorTo: v }))} />
        <ColorRow label="Checked from" value={form.checkedFrom} onChange={v => setForm(f => ({ ...f, checkedFrom: v }))} />
        <ColorRow label="Checked to"   value={form.checkedTo}   onChange={v => setForm(f => ({ ...f, checkedTo: v }))} />
        <ColorRow label="Check mark"   value={form.checkColor}  onChange={v => setForm(f => ({ ...f, checkColor: v }))} />
      </div>
    </>
  )

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        {chores.map(c => (
          <div key={c.id} style={{ ...CARD, opacity: c.active ? 1 : 0.5 }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${c.color_from}, ${c.color_to})` }}>
                {c.emoji}
              </div>
              <div className="flex-1 text-white font-black">{c.label}</div>
              <div className="flex gap-2">
                <Btn small onClick={() => toggleActive(c)}>{c.active ? 'Hide' : 'Show'}</Btn>
                <Btn small onClick={() => startEdit(c)}>Edit</Btn>
                <Btn small danger onClick={() => del(c.id)}>Del</Btn>
              </div>
            </div>
            {editing === c.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                <ChoreForm />
                <div className="flex gap-2 mt-2">
                  <Btn onClick={save} disabled={saving || !form.label?.trim()}>{saving ? 'Saving...' : 'Save'}</Btn>
                  <Btn onClick={cancel}>Cancel</Btn>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div style={CARD} className="mb-4">
          <div className="text-white font-black mb-3">New Chore</div>
          <ChoreForm />
          <div className="flex gap-2 mt-2">
            <Btn onClick={save} disabled={saving || !form.label?.trim()}>{saving ? 'Adding...' : 'Add Chore'}</Btn>
            <Btn onClick={cancel}>Cancel</Btn>
          </div>
        </div>
      )}

      {!adding && <Btn onClick={startAdd}>+ Add Chore</Btn>}
    </div>
  )
}

// ── Prizes tab ─────────────────────────────────────────────────────────────────
function PrizesTab({ prizes, onRefresh }) {
  const [forms, setForms] = useState(() =>
    prizes.reduce((m, p) => ({ ...m, [p.id]: { label: p.label, color: p.color, darkColor: p.dark_color } }), {})
  )
  const [saving, setSaving] = useState(null)

  const save = async (id) => {
    setSaving(id)
    try { await api.updatePrize(id, forms[id]); onRefresh() }
    finally { setSaving(null) }
  }

  return (
    <div className="flex flex-col gap-3">
      {prizes.map((p, i) => (
        <div key={p.id} style={CARD}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: forms[p.id]?.color }} />
            <div className="text-white font-black">Slot {i + 1}</div>
          </div>
          <Input label="Prize Label" value={forms[p.id]?.label || ''}
            onChange={v => setForms(f => ({ ...f, [p.id]: { ...f[p.id], label: v } }))}
            placeholder="e.g. Movie Night!" />
          <ColorRow label="Section color" value={forms[p.id]?.color || '#FF6B6B'}
            onChange={v => setForms(f => ({ ...f, [p.id]: { ...f[p.id], color: v } }))} />
          <ColorRow label="Dark variant"  value={forms[p.id]?.darkColor || '#c0392b'}
            onChange={v => setForms(f => ({ ...f, [p.id]: { ...f[p.id], darkColor: v } }))} />
          <Btn onClick={() => save(p.id)} disabled={saving === p.id}>
            {saving === p.id ? 'Saving...' : 'Save'}
          </Btn>
        </div>
      ))}
    </div>
  )
}

// ── Security tab ───────────────────────────────────────────────────────────────
function SecurityTab({ onLogout }) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (pw.length < 4) return setMsg({ ok: false, text: 'At least 4 characters' })
    if (pw !== confirm) return setMsg({ ok: false, text: "Passwords don't match" })
    setSaving(true); setMsg(null)
    try {
      await api.changePassword(pw)
      setPw(''); setConfirm('')
      setMsg({ ok: true, text: 'Password changed!' })
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally { setSaving(false) }
  }

  const handleLogout = async () => {
    await api.logout()
    onLogout()
  }

  return (
    <div style={CARD}>
      <div className="text-white font-black mb-4">Change Parent Password</div>
      <Input label="New password" type="password" value={pw} onChange={setPw} placeholder="New password..." />
      <Input label="Confirm" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password..." />
      {msg && <div className={`text-sm mb-3 ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</div>}
      <div className="flex gap-3 mt-2">
        <Btn onClick={save} disabled={saving || !pw}>{saving ? 'Saving...' : 'Change Password'}</Btn>
        <Btn danger onClick={handleLogout}>Log Out</Btn>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
const TABS = ['Kids', 'Chores', 'Prizes', 'Security']

export default function ParentSettings({ state, isParent, setIsParent, onClose, onRefresh }) {
  const [tab, setTab] = useState('Kids')

  if (!isParent) {
    return <LoginPrompt onSuccess={() => setIsParent(true)} />
  }

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: PANEL_BG, fontFamily: "'Nunito', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={onClose} className="text-white/50 text-2xl hover:text-white" style={{ lineHeight: 1 }}>←</button>
        <div className="text-white text-2xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
          🔒 Parent Settings
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-black flex-shrink-0"
            style={{
              background: tab === t ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)',
              border: `1px solid ${tab === t ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.12)'}`,
              color: tab === t ? 'white' : 'rgba(255,255,255,0.4)',
            }}
          >{t}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'Kids'     && <KidsTab     kids={state.kids}     onRefresh={onRefresh} />}
            {tab === 'Chores'   && <ChoresTab   chores={state.chores} onRefresh={onRefresh} />}
            {tab === 'Prizes'   && <PrizesTab   prizes={state.prizes} onRefresh={onRefresh} />}
            {tab === 'Security' && <SecurityTab onLogout={() => { setIsParent(false); onClose() }} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
