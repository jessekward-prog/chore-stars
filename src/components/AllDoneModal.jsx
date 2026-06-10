import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SpinWheel from './SpinWheel'
import { fireAllDoneConfetti, startConfettiRain } from '../utils/confetti'
import { playAllDone, playWin } from '../utils/sounds'

const WIN_MESSAGES = ['INCREDIBLE!!!', 'YOU LEGEND!!!', 'OH MY GOODNESS!!!', 'UNSTOPPABLE!!!']

export default function AllDoneModal({ sections, kids, onClose }) {
  const [phase, setPhase] = useState('wheel')
  const [winner, setWinner] = useState(null)
  const msgRef = useRef(WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)])

  const teamColor = 'radial-gradient(ellipse at 60% 30%, #d946ef 0%, #3b82f6 55%, #0f0524 100%)'

  useEffect(() => {
    const stop = startConfettiRain()
    return stop
  }, [])

  const handleClaim = () => {
    playWin()
    fireAllDoneConfetti()
    setPhase('prize')
  }

  useEffect(() => {
    if (phase !== 'prize') return
    const t1 = setTimeout(() => fireAllDoneConfetti(), 600)
    const t2 = setTimeout(() => fireAllDoneConfetti(), 2000)
    const t3 = setTimeout(() => fireAllDoneConfetti(), 3500)
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [phase])

  const winSection = winner !== null ? sections[winner] : null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: teamColor }}
    >
      <AnimatePresence mode="wait">

        {phase === 'wheel' && (
          <motion.div key="wheel"
            className="flex flex-col items-center w-full px-4 pt-8 pb-10"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}>

            {['⭐', '🌟', '✨', '💫'].map((e, i) => (
              <motion.span key={i} className="fixed text-3xl pointer-events-none"
                style={{ left: `${8 + i * 26}%`, top: `${6 + (i % 2) * 8}%` }}
                animate={{ y: [0, -14, 0], rotate: [0, 20, -20, 0] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}>
                {e}
              </motion.span>
            ))}

            <motion.div className="text-6xl mb-2 flex gap-2"
              animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.7, delay: 0.1 }}>
              {kids.map((k, i) => (
                <span key={k.id}>{k.avatar_url ? '🏆' : k.name[0]}</span>
              ))}
            </motion.div>

            <motion.div className="text-white text-4xl mb-1"
              style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 24px rgba(255,255,255,0.5)' }}
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              {kids.map(k => k.name).join(' & ')}
            </motion.div>
            <motion.div className="text-yellow-300 text-xl font-black mb-6"
              style={{ fontFamily: "'Nunito', sans-serif", textShadow: '0 0 12px rgba(255,213,0,0.7)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              TEAM COMPLETE! 🎉 Spin your prize!
            </motion.div>

            <SpinWheel sections={sections} onResult={setWinner} />

            <AnimatePresence>
              {winner !== null && (
                <motion.button onClick={handleClaim}
                  className="mt-7 px-10 py-4 rounded-full text-white text-2xl shadow-2xl"
                  style={{
                    fontFamily: "'Fredoka One', cursive",
                    background: `linear-gradient(135deg, ${sections[winner].color}, ${sections[winner].dark_color})`,
                    boxShadow: `0 0 30px ${sections[winner].color}aa`,
                  }}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 360, delay: 0.3 }}
                  whileTap={{ scale: 0.9 }}>
                  🎉 HAVE A FUN DAY!
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'prize' && winSection && (
          <motion.div key="prize"
            className="fixed inset-0 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{ background: `radial-gradient(ellipse at center, ${winSection.color} 0%, ${winSection.dark_color} 50%, #000 100%)` }}>

            {['🎊', '🎉', '⭐', '🌟', '✨', '💫', '🎈', '🏆'].map((e, i) => (
              <motion.span key={i} className="absolute text-4xl pointer-events-none"
                style={{ left: `${(i * 33 + 5) % 90}%`, top: `${(i * 19 + 5) % 80}%` }}
                animate={{ y: [0, -25, 0], rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.4 + (i % 4) * 0.4, repeat: Infinity, delay: i * 0.18 }}>
                {e}
              </motion.span>
            ))}

            <motion.div className="text-9xl mb-4 relative z-10"
              animate={{ y: [0, -20, 0], rotate: [-8, 8, -8], scale: [1, 1.1, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
              🎁
            </motion.div>

            <motion.div className="text-white text-5xl relative z-10 mb-1 flex gap-3 items-center"
              style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 30px rgba(255,255,255,0.6)' }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}>
              {kids.map((k, i) => (
                <span key={k.id}>{i > 0 ? ' & ' : ''}{k.name}</span>
              ))}
            </motion.div>

            <motion.div className="text-yellow-300 text-3xl relative z-10 mb-2 text-center"
              style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 20px rgba(255,213,0,0.8)' }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18, type: 'spring' }}>
              {msgRef.current}
            </motion.div>

            <motion.div className="relative z-10 rounded-3xl px-8 py-5 mb-8 text-center"
              style={{
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: `3px solid ${winSection.color}`, boxShadow: `0 0 40px ${winSection.color}88`,
              }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}>
              <div className="text-white/70 text-lg mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>YOUR PRIZE:</div>
              <motion.div className="text-white text-5xl"
                style={{ fontFamily: "'Fredoka One', cursive", textShadow: `0 0 30px ${winSection.color}` }}
                animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                {winSection.label}
              </motion.div>
            </motion.div>

            <motion.button onClick={onClose}
              className="bg-white text-2xl px-10 py-4 rounded-full shadow-2xl relative z-10"
              style={{ fontFamily: "'Fredoka One', cursive", color: winSection.dark_color, boxShadow: '0 0 30px rgba(255,255,255,0.4)' }}
              whileTap={{ scale: 0.92 }} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, type: 'spring' }}>
              WOOHOO! 🙌
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
