import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del']

export default function PinModal({ kid, onSuccess, onCancel }) {
  const [entered, setEntered] = useState('')
  const [shake, setShake] = useState(false)

  const press = (d) => {
    if (d === 'del') {
      setEntered(e => e.slice(0, -1))
      return
    }
    if (d === null) return
    const next = entered + String(d)
    if (next.length > 4) return
    setEntered(next)
    if (next.length === 4) {
      if (next === kid.pin) {
        onSuccess()
      } else {
        setShake(true)
        setTimeout(() => { setEntered(''); setShake(false) }, 600)
      }
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0 }}
        transition={shake ? { duration: 0.4 } : { type: 'spring', stiffness: 380, damping: 28 }}
        className="rounded-3xl p-6 flex flex-col items-center gap-5 w-full max-w-xs"
        style={{
          background: `linear-gradient(160deg, #1a0a3d, #0d1a3d)`,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Kid identity */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black text-white overflow-hidden flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${kid.color_from}, ${kid.color_to})` }}
          >
            {kid.avatar_url
              ? <img src={kid.avatar_url} alt={kid.name} className="w-full h-full object-cover" />
              : kid.name[0]}
          </div>
          <div className="text-white text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
            {kid.name}'s Tab
          </div>
          <div className="text-white/40 text-sm font-bold">Enter PIN to switch</div>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="w-4 h-4 rounded-full"
              animate={i < entered.length
                ? { scale: [1, 1.3, 1], backgroundColor: ['#a78bfa', '#ffffff', '#a78bfa'] }
                : { backgroundColor: 'rgba(255,255,255,0.15)' }
              }
              transition={{ duration: 0.25 }}
              style={{ backgroundColor: i < entered.length ? '#a78bfa' : 'rgba(255,255,255,0.15)' }}
            />
          ))}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {DIGITS.map((d, i) => (
            <motion.button
              key={i}
              onClick={() => press(d)}
              disabled={d === null}
              className="h-14 rounded-2xl text-white text-xl font-black flex items-center justify-center"
              style={{
                background: d === null ? 'transparent' : 'rgba(255,255,255,0.1)',
                border: d === null ? 'none' : '1px solid rgba(255,255,255,0.15)',
                color: d === 'del' ? 'rgba(255,255,255,0.5)' : 'white',
                fontFamily: "'Fredoka One', cursive",
              }}
              whileTap={d !== null ? { scale: 0.88 } : {}}
            >
              {d === 'del' ? '⌫' : d === null ? '' : d}
            </motion.button>
          ))}
        </div>

        <button onClick={onCancel} className="text-white/30 text-sm font-bold">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  )
}
