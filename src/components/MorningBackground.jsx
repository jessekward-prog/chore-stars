import { motion } from 'framer-motion'

function Cloud({ top, left, scale, duration, delay }) {
  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{ top, left, scale, opacity: 0.9 }}
      animate={{ x: [0, 30, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div className="relative" style={{ width: 90, height: 34 }}>
        <div className="absolute rounded-full bg-white" style={{ width: 56, height: 34, left: 0, top: 0 }} />
        <div className="absolute rounded-full bg-white" style={{ width: 40, height: 40, left: 24, top: -14 }} />
        <div className="absolute rounded-full bg-white" style={{ width: 44, height: 28, left: 46, top: 4 }} />
      </div>
    </motion.div>
  )
}

function Flower({ left, bottom, color, delay }) {
  return (
    <motion.div
      className="fixed pointer-events-none flex flex-col items-center"
      style={{ left, bottom }}
      animate={{ rotate: [-4, 4, -4] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div className="relative" style={{ width: 26, height: 26 }}>
        <div className="absolute rounded-full" style={{ width: 26, height: 26, background: color }} />
        <div className="absolute rounded-full bg-white" style={{ width: 12, height: 12, top: 7, left: 7, opacity: 0.85 }} />
        <div className="absolute rounded-full" style={{ width: 6, height: 6, top: 10, left: 10, background: '#FFD93D' }} />
      </div>
      <div style={{ width: 2, height: 14, background: '#4a7c3f' }} />
    </motion.div>
  )
}

// Ported from maths-cmd's Background.jsx (sky/sun/clouds/hills scene), stripped
// of its own layout wrapper so it can drop in as a decorative backdrop.
export default function MorningBackground() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #6FC6E8 0%, #A6E1F4 32%, #DFF3E3 62%, #EFF8E4 100%)' }} />

      <motion.div
        className="fixed rounded-full pointer-events-none"
        style={{
          top: '6%', right: '10%', width: 110, height: 110,
          background: 'radial-gradient(circle at 35% 35%, #FFF8DC 0%, #FFE066 45%, #FFC93C 100%)',
          boxShadow: '0 0 60px 20px rgba(255, 217, 102, 0.55)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Cloud top="12%" left="8%" scale={1} duration={14} delay={0} />
      <Cloud top="22%" left="62%" scale={0.7} duration={18} delay={2} />
      <Cloud top="6%" left="38%" scale={0.55} duration={16} delay={4} />

      <svg className="fixed bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '22vh' }}>
        <path d="M0,90 Q125,40 250,80 T500,70 V150 H0 Z" fill="#BCE6A0" />
        <path d="M0,120 Q140,80 280,110 T500,100 V150 H0 Z" fill="#8FCB6E" />
      </svg>

      <Flower left="6%" bottom="11vh" color="#FF6FA5" delay={0} />
      <Flower left="20%" bottom="14vh" color="#FFD93D" delay={0.6} />
      <Flower left="34%" bottom="9vh" color="#C77DFF" delay={1.4} />
      <Flower left="48%" bottom="13vh" color="#FF6FA5" delay={0.9} />
      <Flower left="62%" bottom="10vh" color="#FFD93D" delay={0.2} />
      <Flower left="76%" bottom="14vh" color="#C77DFF" delay={1.1} />
      <Flower left="90%" bottom="10vh" color="#FF6FA5" delay={0.5} />
    </>
  )
}
