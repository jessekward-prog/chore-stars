import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del']

export default function SwitchKidModal({ kids, onSuccess, onCancel, canCancel = false }) {
  const [entered, setEntered] = useState('')
  const [shake, setShake] = useState(false)

  const pinnedKids = kids.filter(k => k.pin)

  const press = (d) => {
    if (d === 'del') { setEntered(e => e.slice(0, -1)); return }
    if (d === null) return
    const next = entered + String(d)
    if (next.length > 4) return
    setEntered(next)

    if (next.length === 4) {
      const match = pinnedKids.find(k => k.pin === next)
      if (match) {
        onSuccess(match.id)
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
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={shake ? { x: [-12, 12, -12, 12, 0] } : { scale: 1, y: 0 }}
        transition={shake ? { duration: 0.4 } : { type: 'spring', stiffness: 380, damping: 28 }}
        className="rounded-3xl p-6 flex flex-col items-center gap-5 w-full max-w-xs"
        style={{
          background: 'linear-gradient(160deg, #1a0a3d, #0d1a3d)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <motion.div
          className="text-5xl"
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🔒
        </motion.div>
        <div className="text-white text-2xl text-center" style={{ fontFamily: "'Fredoka One', cursive" }}>
          Whose turn is it?
        </div>
        <div className="text-white/40 text-sm text-center font-bold">
          Enter your 4-digit code
        </div>

        {/* Dot indicators */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="w-5 h-5 rounded-full"
              animate={i < entered.length
                ? { scale: [1, 1.35, 1], backgroundColor: ['#a78bfa', '#ffffff', '#a78bfa'] }
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
              type="button"
              onClick={() => press(d)}
              disabled={d === null}
              className="h-16 rounded-2xl text-white text-2xl font-black flex items-center justify-center"
              style={{
                background: d === null ? 'transparent' : 'rgba(255,255,255,0.1)',
                border: d === null ? 'none' : '1px solid rgba(255,255,255,0.15)',
                color: d === 'del' ? 'rgba(255,255,255,0.5)' : 'white',
                fontFamily: "'Fredoka One', cursive",
              }}
              whileTap={d !== null ? { scale: 0.85, background: 'rgba(255,255,255,0.25)' } : {}}
            >
              {d === 'del' ? '⌫' : d === null ? '' : d}
            </motion.button>
          ))}
        </div>

        {canCancel && (
          <button type="button" onClick={onCancel} className="text-white/30 text-sm font-bold mt-1">
            Cancel
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
