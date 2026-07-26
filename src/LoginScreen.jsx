import { useState } from 'react'
import { motion } from 'framer-motion'
import * as api from './api.js'
import { haptics } from './utils/haptics.js'

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del']

export default function LoginScreen({ onSuccess }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fail = (message) => {
    haptics.error()
    setError(message)
    setShake(true)
    setTimeout(() => { setShake(false); setPin('') }, 500)
  }

  const submit = async (fullPin) => {
    if (!username.trim()) return fail('Enter a username first')
    setLoading(true); setError('')
    try {
      const fn = mode === 'login' ? api.login : api.signup
      await fn(username.trim(), fullPin)
      haptics.success()
      onSuccess()
    } catch (e) {
      fail(e.message)
    } finally {
      setLoading(false)
    }
  }

  const pressDigit = (d) => {
    if (loading) return
    if (d === 'del') { setPin(p => p.slice(0, -1)); return }
    if (d === null) return
    haptics.tap()
    const next = pin + String(d)
    if (next.length > 4) return
    setPin(next)
    if (next.length === 4) submit(next)
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setPin(''); setError('')
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)', fontFamily: "'Nunito', sans-serif" }}>

      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-white"
            style={{ width: (i % 3) + 1, height: (i % 3) + 1, left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, opacity: 0.3 }}
            animate={{ opacity: [0.1, 0.8, 0.1] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i * 0.3) % 4 }}
          />
        ))}
      </div>

      <motion.div className="text-white text-5xl text-center mb-1 relative z-10"
        style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 30px rgba(200,100,255,0.8)' }}
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
        ⭐ Chore Stars ⭐
      </motion.div>
      <div className="text-white/50 text-lg font-bold mb-8 relative z-10">
        {mode === 'login' ? 'Welcome back!' : 'Start your own chore chart'}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, opacity: 1 }}
        transition={shake ? { duration: 0.4 } : { type: 'spring', stiffness: 380, damping: 28 }}
        className="relative z-10 rounded-3xl p-6 flex flex-col items-center gap-4 w-full max-w-xs"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          disabled={loading}
          autoCapitalize="none"
          className="w-full rounded-xl px-4 py-3 text-white text-center outline-none"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 16 }}
        />

        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-4 h-4 rounded-full"
              style={{ background: i < pin.length ? '#a78bfa' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>

        {error && <div className="text-red-400 text-sm text-center">{error}</div>}

        <div className="grid grid-cols-3 gap-3 w-full">
          {DIGITS.map((d, i) => (
            <motion.button
              key={i}
              onClick={() => pressDigit(d)}
              disabled={d === null || loading}
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
      </motion.div>

      <button onClick={switchMode} className="relative z-10 text-white/40 text-sm font-bold mt-6 underline"
        style={{ minHeight: 44 }}>
        {mode === 'login' ? "New here? Create an account" : 'Already have an account? Log in'}
      </button>
    </div>
  )
}
