import { motion } from 'framer-motion'

export default function ConfirmModal({ text, onConfirm, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="rounded-3xl p-6 flex flex-col gap-4 w-full max-w-xs"
        style={{
          background: 'linear-gradient(160deg, #1a0a3d, #0d1a3d)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-white text-lg font-bold text-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
          {text}
        </div>
        <div className="flex gap-3">
          <motion.button onClick={onCancel} whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 rounded-2xl font-black"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
            Cancel
          </motion.button>
          <motion.button onClick={onConfirm} whileTap={{ scale: 0.95 }}
            className="flex-1 py-3 rounded-2xl font-black"
            style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' }}>
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
