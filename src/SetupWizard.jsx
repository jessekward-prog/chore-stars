import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as api from './api.js'

const BG = 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)'

const KID_PALETTES = [
  { colorFrom: '#f472b6', colorTo: '#a855f7', tabFrom: '#e879f9', tabTo: '#9333ea' },
  { colorFrom: '#3b82f6', colorTo: '#06b6d4', tabFrom: '#3b82f6', tabTo: '#06b6d4' },
  { colorFrom: '#f97316', colorTo: '#eab308', tabFrom: '#f97316', tabTo: '#eab308' },
  { colorFrom: '#22c55e', colorTo: '#10b981', tabFrom: '#16a34a', tabTo: '#059669' },
  { colorFrom: '#ef4444', colorTo: '#f97316', tabFrom: '#dc2626', tabTo: '#ea580c' },
  { colorFrom: '#8b5cf6', colorTo: '#6366f1', tabFrom: '#7c3aed', tabTo: '#4f46e5' },
]

const PRESET_CHORES = [
  { emoji: '🌞', label: 'Wake Up & Stretch', colorFrom: '#facc15', colorTo: '#f97316', checkedFrom: '#b45309', checkedTo: '#c2410c', checkColor: '#ea580c' },
  { emoji: '👕', label: 'Get Dressed',       colorFrom: '#a78bfa', colorTo: '#e879f9', checkedFrom: '#6d28d9', checkedTo: '#a21caf', checkColor: '#7c3aed' },
  { emoji: '🥣', label: 'Eat Breakfast',     colorFrom: '#34d399', colorTo: '#2dd4bf', checkedFrom: '#065f46', checkedTo: '#134e4a', checkColor: '#047857' },
  { emoji: '🦷', label: 'Brush Teeth',       colorFrom: '#38bdf8', colorTo: '#67e8f9', checkedFrom: '#075985', checkedTo: '#164e63', checkColor: '#0369a1' },
  { emoji: '🛏️', label: 'Make Your Bed',    colorFrom: '#f472b6', colorTo: '#fb7185', checkedFrom: '#9d174d', checkedTo: '#9f1239', checkColor: '#be185d' },
  { emoji: '🎒', label: 'Pack Your Bag',     colorFrom: '#fb923c', colorTo: '#f87171', checkedFrom: '#c2410c', checkedTo: '#b91c1c', checkColor: '#b91c1c' },
  { emoji: '🧹', label: 'Clean Your Room',   colorFrom: '#4ade80', colorTo: '#22d3ee', checkedFrom: '#166534', checkedTo: '#164e63', checkColor: '#15803d' },
  { emoji: '🐶', label: 'Feed the Pet',      colorFrom: '#fbbf24', colorTo: '#fb923c', checkedFrom: '#92400e', checkedTo: '#9a3412', checkColor: '#b45309' },
  { emoji: '🍽️', label: 'Clear the Table',  colorFrom: '#c084fc', colorTo: '#818cf8', checkedFrom: '#7e22ce', checkedTo: '#3730a3', checkColor: '#7c3aed' },
  { emoji: '🚿', label: 'Take a Shower',     colorFrom: '#67e8f9', colorTo: '#a5b4fc', checkedFrom: '#164e63', checkedTo: '#312e81', checkColor: '#0369a1' },
  { emoji: '📚', label: 'Do Homework',       colorFrom: '#fde68a', colorTo: '#fca5a5', checkedFrom: '#92400e', checkedTo: '#991b1b', checkColor: '#b45309' },
  { emoji: '🗑️', label: 'Take Out Trash',   colorFrom: '#6ee7b7', colorTo: '#67e8f9', checkedFrom: '#065f46', checkedTo: '#164e63', checkColor: '#047857' },
]

const PRIZE_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF']
const PRIZE_DARK   = ['#c0392b', '#d4a017', '#27ae60', '#1a6fc4', '#8e44ad']

const STEPS = ['Kids', 'Chores', 'Prizes', 'Password']

let nextTempId = 1

// ── Step: Kids ────────────────────────────────────────────────────────────────

function KidCard({ kid, onChange, onRemove, canRemove }) {
  const fileRef = useRef(null)
  const p = KID_PALETTES[kid.paletteIdx]

  return (
    <div className="rounded-2xl p-4 mb-3"
      style={{ background: `linear-gradient(135deg, ${p.colorFrom}22, ${p.colorTo}22)`, border: `1px solid ${p.colorFrom}55` }}>
      <div className="flex gap-3 items-center mb-3">
        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${p.colorFrom}, ${p.colorTo})` }}
          onClick={() => fileRef.current?.click()}>
          {kid.avatarPreview
            ? <img src={kid.avatarPreview} alt="" className="w-full h-full object-cover" />
            : <span className="text-2xl font-black text-white leading-none">
                {kid.name ? kid.name[0].toUpperCase() : '+'}
              </span>}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>photo</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files[0]
          if (!f) return
          onChange({ ...kid, avatarFile: f, avatarPreview: URL.createObjectURL(f) })
        }} />
        <input
          autoFocus={kid.name === ''}
          className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/30 font-bold focus:outline-none focus:bg-white/20"
          style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16 }}
          placeholder="Kid's name"
          value={kid.name}
          onChange={e => onChange({ ...kid, name: e.target.value })}
        />
        {canRemove && (
          <button onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors text-xl px-1">
            ✕
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {KID_PALETTES.map((pal, i) => (
          <button key={i} onClick={() => onChange({ ...kid, paletteIdx: i })}
            className="w-7 h-7 rounded-full transition-all"
            style={{
              background: `linear-gradient(135deg, ${pal.colorFrom}, ${pal.colorTo})`,
              transform: kid.paletteIdx === i ? 'scale(1.35)' : 'scale(1)',
              outline: kid.paletteIdx === i ? '2px solid white' : 'none',
              outlineOffset: '2px',
            }} />
        ))}
      </div>
    </div>
  )
}

function StepKids({ kids, setKids }) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">👧🧒</div>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Who's doing chores?
        </h2>
        <p className="text-white/40 text-sm mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Add each kid. Tap their circle to set a photo.
        </p>
      </div>
      {kids.map(kid => (
        <KidCard
          key={kid.tempId}
          kid={kid}
          onChange={updated => setKids(prev => prev.map(k => k.tempId === kid.tempId ? updated : k))}
          onRemove={() => setKids(prev => prev.filter(k => k.tempId !== kid.tempId))}
          canRemove={kids.length > 1}
        />
      ))}
      <button
        onClick={() => setKids(prev => [...prev, {
          tempId: nextTempId++,
          name: '',
          paletteIdx: prev.length % KID_PALETTES.length,
          avatarFile: null,
          avatarPreview: null,
        }])}
        className="w-full py-3 rounded-2xl font-bold border border-dashed border-white/20 text-white/50 hover:border-white/40 hover:text-white/70 transition-all"
        style={{ fontFamily: "'Nunito', sans-serif" }}>
        + Add another kid
      </button>
    </div>
  )
}

// ── Step: Chores ──────────────────────────────────────────────────────────────

function StepChores({ selected, setSelected, custom, setCustom }) {
  const [newEmoji, setNewEmoji] = useState('⭐')
  const [newLabel, setNewLabel] = useState('')

  const togglePreset = i => setSelected(prev => {
    const s = new Set(prev)
    s.has(i) ? s.delete(i) : s.add(i)
    return s
  })

  const addCustom = () => {
    if (!newLabel.trim()) return
    setCustom(prev => [...prev, {
      emoji: newEmoji || '⭐',
      label: newLabel.trim(),
      colorFrom: '#a78bfa', colorTo: '#e879f9',
      checkedFrom: '#6d28d9', checkedTo: '#a21caf',
      checkColor: '#7c3aed',
    }])
    setNewLabel('')
    setNewEmoji('⭐')
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">✅</div>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Daily chores
        </h2>
        <p className="text-white/40 text-sm mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Pick the ones they do every day. Add your own below.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PRESET_CHORES.map((chore, i) => {
          const on = selected.has(i)
          return (
            <button key={i} onClick={() => togglePreset(i)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
              style={{
                background: on
                  ? `linear-gradient(to right, ${chore.colorFrom}, ${chore.colorTo})`
                  : 'rgba(255,255,255,0.07)',
                border: on ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>
              <span className="text-lg">{chore.emoji}</span>
              <span className="text-sm font-bold text-white truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {chore.label}
              </span>
            </button>
          )
        })}
      </div>
      {custom.length > 0 && (
        <div className="space-y-1 mb-3">
          {custom.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10">
              <span>{c.emoji}</span>
              <span className="flex-1 text-sm font-bold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>{c.label}</span>
              <button onClick={() => setCustom(prev => prev.filter((_, j) => j !== i))}
                className="text-white/30 hover:text-red-400 transition-colors text-sm">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className="w-12 px-2 py-2 rounded-xl bg-white/10 text-white text-center focus:outline-none focus:bg-white/20"
          placeholder="🌟"
          value={newEmoji}
          onChange={e => setNewEmoji(e.target.value)}
        />
        <input
          className="flex-1 px-3 py-2 rounded-xl bg-white/10 text-white placeholder-white/30 focus:outline-none focus:bg-white/20"
          style={{ fontFamily: "'Nunito', sans-serif" }}
          placeholder="Add your own chore…"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
        />
        <button onClick={addCustom}
          className="px-4 py-2 rounded-xl bg-white/15 text-white font-bold hover:bg-white/25 transition-colors"
          style={{ fontFamily: "'Nunito', sans-serif" }}>
          Add
        </button>
      </div>
    </div>
  )
}

// ── Step: Prizes ──────────────────────────────────────────────────────────────

function StepPrizes({ prizes, setPrizes }) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🎡</div>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Weekly prizes!
        </h2>
        <p className="text-white/40 text-sm mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Name the 5 slots on the prize wheel.
        </p>
      </div>
      <div className="space-y-2">
        {prizes.map((label, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: PRIZE_COLORS[i] }} />
            <input
              className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white placeholder-white/30 font-bold focus:outline-none focus:bg-white/20"
              style={{ fontFamily: "'Nunito', sans-serif" }}
              placeholder={`Prize ${i + 1} (e.g. Movie Night)`}
              value={label}
              onChange={e => setPrizes(prev => prev.map((p, j) => j === i ? e.target.value : p))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step: Password ────────────────────────────────────────────────────────────

function StepPassword({ password, setPassword, confirm, setConfirm }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🔒</div>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Parent password
        </h2>
        <p className="text-white/40 text-sm mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Locks the settings screen so only you can change things.
        </p>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 font-bold focus:outline-none focus:bg-white/20 pr-14"
            style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16 }}
            placeholder="Choose a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            onClick={() => setShow(s => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs font-bold transition-colors"
            style={{ fontFamily: "'Nunito', sans-serif" }}>
            {show ? 'HIDE' : 'SHOW'}
          </button>
        </div>
        <input
          type={show ? 'text' : 'password'}
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 font-bold focus:outline-none focus:bg-white/20"
          style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16 }}
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        {confirm && password !== confirm && (
          <p className="text-red-400 text-sm px-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Passwords don't match
          </p>
        )}
        {password && password.length < 4 && (
          <p className="text-yellow-400 text-sm px-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
            At least 4 characters
          </p>
        )}
      </div>
    </div>
  )
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

export default function SetupWizard({ prizes: initialPrizes, onComplete }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Kids state
  const [kids, setKids] = useState([{
    tempId: nextTempId++, name: '', paletteIdx: 0, avatarFile: null, avatarPreview: null,
  }])

  // Chores state
  const [selectedChores, setSelectedChores] = useState(new Set([0, 1, 2, 3, 4, 5]))
  const [customChores, setCustomChores] = useState([])

  // Prizes state
  const [prizes, setPrizes] = useState(
    initialPrizes.map(p => p.label === '???' ? '' : p.label)
  )
  const prizeIds = initialPrizes.map(p => p.id)

  // Password state
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const canNext = () => {
    if (step === 0) return kids.length > 0 && kids.every(k => k.name.trim().length > 0)
    if (step === 1) return selectedChores.size + customChores.length > 0
    if (step === 2) return prizes.some(p => p.trim().length > 0)
    if (step === 3) return password.length >= 4 && password === confirm
    return true
  }

  const go = (delta) => {
    setDirection(delta)
    setStep(s => s + delta)
  }

  const handleFinish = async () => {
    setSubmitting(true)
    setSubmitError('')
    try {
      // 1. Change parent password
      await api.changePassword(password)

      // 2. Create kids, then upload avatars
      for (const kid of kids) {
        const p = KID_PALETTES[kid.paletteIdx]
        const created = await api.createKid({
          name: kid.name.trim(),
          colorFrom: p.colorFrom, colorTo: p.colorTo,
          tabFrom: p.tabFrom, tabTo: p.tabTo,
        })
        if (kid.avatarFile) {
          await api.uploadAvatar(created.id, kid.avatarFile)
        }
      }

      // 3. Create chores
      const choresToCreate = [
        ...[...selectedChores].map(i => PRESET_CHORES[i]),
        ...customChores,
      ]
      for (const chore of choresToCreate) {
        await api.createChore(chore)
      }

      // 4. Update prizes
      for (let i = 0; i < prizeIds.length; i++) {
        const label = prizes[i]?.trim() || `Prize ${i + 1}`
        await api.updatePrize(prizeIds[i], { label, color: PRIZE_COLORS[i], darkColor: PRIZE_DARK[i] })
      }

      // 5. Mark setup complete
      await api.completeSetup()

      // 6. Refresh app state
      onComplete()
    } catch (e) {
      setSubmitError(e.message)
      setSubmitting(false)
    }
  }

  const variants = {
    enter: d => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   d => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 }),
  }

  if (submitting && !submitError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: BG }}>
        <motion.div className="text-6xl mb-4"
          animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          ⭐
        </motion.div>
        <div className="text-white font-black text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Setting things up…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div className="pt-10 pb-4 px-6 text-center">
        <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Chore Stars ⭐
        </div>
        <div className="text-white/40 text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>
          First-time setup
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pb-6">
        {STEPS.map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              background: i <= step
                ? 'linear-gradient(to right, #a855f7, #3b82f6)'
                : 'rgba(255,255,255,0.15)',
            }} />
        ))}
      </div>

      {/* Step label */}
      <div className="text-center text-white/30 text-xs font-bold uppercase tracking-widest mb-2"
        style={{ fontFamily: "'Nunito', sans-serif" }}>
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}>
            {step === 0 && <StepKids kids={kids} setKids={setKids} />}
            {step === 1 && (
              <StepChores
                selected={selectedChores} setSelected={setSelectedChores}
                custom={customChores} setCustom={setCustomChores}
              />
            )}
            {step === 2 && <StepPrizes prizes={prizes} setPrizes={setPrizes} />}
            {step === 3 && (
              <StepPassword
                password={password} setPassword={setPassword}
                confirm={confirm} setConfirm={setConfirm}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error */}
      {submitError && (
        <div className="mx-5 mb-3 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-sm text-center"
          style={{ fontFamily: "'Nunito', sans-serif" }}>
          {submitError}
        </div>
      )}

      {/* Nav buttons */}
      <div className="px-5 pb-10 flex gap-3">
        {step > 0 && (
          <button onClick={() => go(-1)}
            className="flex-1 py-4 rounded-2xl text-white/60 font-black border border-white/15 hover:border-white/30 transition-all"
            style={{ fontFamily: "'Fredoka One', cursive", fontSize: 18 }}>
            Back
          </button>
        )}
        <button
          onClick={step < STEPS.length - 1 ? () => go(1) : handleFinish}
          disabled={!canNext() || submitting}
          className="flex-1 py-4 rounded-2xl text-white font-black transition-all"
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 18,
            background: canNext()
              ? 'linear-gradient(135deg, #a855f7, #3b82f6)'
              : 'rgba(255,255,255,0.1)',
            opacity: submitting ? 0.7 : 1,
          }}>
          {step < STEPS.length - 1 ? 'Next' : "Let's Go!"}
        </button>
      </div>
    </div>
  )
}
