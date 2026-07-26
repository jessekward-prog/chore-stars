import { motion } from 'framer-motion'

export default function WelcomeScreen({ kids, onStart, onOpenParent }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)', fontFamily: "'Nunito', sans-serif" }}
    >
      <button onClick={onOpenParent}
        className="fixed top-6 right-6 z-20 text-white/30 hover:text-white/70 text-2xl transition-colors"
        style={{ lineHeight: 1, minWidth: 44, minHeight: 44 }}>
        🔒
      </button>
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

      {/* Planet decorations */}
      <motion.div className="fixed text-6xl pointer-events-none" style={{ top: '8%', right: '10%' }}
        animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
        🪐
      </motion.div>
      <motion.div className="fixed text-4xl pointer-events-none" style={{ bottom: '12%', left: '8%' }}
        animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        🌙
      </motion.div>
      <motion.div className="fixed text-3xl pointer-events-none" style={{ top: '20%', left: '5%' }}
        animate={{ rotate: [-10, 10, -10], scale: [1, 1.15, 1] }} transition={{ duration: 4, repeat: Infinity }}>
        ✨
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-white text-5xl text-center mb-2"
        style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 30px rgba(200,100,255,0.8)' }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1, scale: [1, 1.03, 1] }}
        transition={{ duration: 0.6, scale: { duration: 3, repeat: Infinity } }}
      >
        ⭐ Chore Stars ⭐
      </motion.div>

      <motion.div
        className="text-white/50 text-lg font-bold mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Ready to be champions?
      </motion.div>

      {/* Kid cards */}
      <div className="flex gap-5 mb-12 relative z-10">
        {kids.map((kid, i) => (
          <motion.div key={kid.id}
            className="flex flex-col items-center gap-3"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.15, type: 'spring', stiffness: 260 }}
          >
            <motion.div
              className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl shadow-2xl"
              style={{ background: kid.accent_color || '#8b5cf6' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
            >
              {kid.avatar_url
                ? <img src={kid.avatar_url} alt={kid.name} className="w-full h-full object-cover rounded-3xl" />
                : <span>{kid.name[0]}</span>
              }
            </motion.div>
            <div className="text-white text-xl font-black" style={{ fontFamily: "'Fredoka One', cursive" }}>
              {kid.name}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Let's Go button */}
      <motion.button
        onClick={onStart}
        className="relative z-10 px-14 py-5 rounded-full text-white text-3xl shadow-2xl"
        style={{
          fontFamily: "'Fredoka One', cursive",
          background: 'linear-gradient(135deg, #FFD700 0%, #FF6347 100%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1,
          boxShadow: [
            '0 0 20px rgba(255,200,0,0.4)',
            '0 0 50px rgba(255,200,0,0.9)',
            '0 0 20px rgba(255,200,0,0.4)',
          ],
        }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 260,
          boxShadow: { duration: 1.4, repeat: Infinity, delay: 0.8 },
        }}
        whileTap={{ scale: 0.93 }}
      >
        🚀 LET'S DO CHORES!
      </motion.button>

    </div>
  )
}
