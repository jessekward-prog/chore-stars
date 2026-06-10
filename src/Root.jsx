import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppState } from './hooks/useAppState.js'
import WelcomeScreen from './WelcomeScreen.jsx'
import SetupWizard from './SetupWizard.jsx'
import App from './App.jsx'
import ParentSettings from './ParentSettings.jsx'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)' }}>
      <motion.div className="text-6xl"
        animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
        ⭐
      </motion.div>
      <div className="text-white/40 text-lg mt-4 font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>
        Loading...
      </div>
    </div>
  )
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)' }}>
      <div className="text-5xl mb-4">😵</div>
      <div className="text-white text-xl font-black mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
        Couldn't connect to the server
      </div>
      <div className="text-white/40 text-sm mb-6 max-w-xs">{error}</div>
      <button onClick={onRetry}
        className="px-8 py-3 rounded-2xl text-white font-black"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontFamily: "'Fredoka One', cursive" }}>
        Try Again
      </button>
    </div>
  )
}

export default function Root() {
  const { state, loading, error, toggle, markDayComplete, markWheelSpun, refresh } = useAppState()
  const [screen, setScreen] = useState('welcome')
  const [isParent, setIsParent] = useState(false)

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} onRetry={refresh} />

  if (!state.setupComplete) {
    return <SetupWizard prizes={state.prizes} onComplete={refresh} />
  }

  if (screen === 'welcome') {
    return <WelcomeScreen kids={state.kids} onStart={() => setScreen('app')} />
  }

  if (screen === 'parent') {
    return (
      <ParentSettings
        state={state}
        isParent={isParent}
        setIsParent={setIsParent}
        onClose={() => setScreen('app')}
        onRefresh={refresh}
      />
    )
  }

  return (
    <App
      state={state}
      toggle={toggle}
      markDayComplete={markDayComplete}
      markWheelSpun={markWheelSpun}
      refresh={refresh}
      onOpenParent={() => setScreen('parent')}
    />
  )
}
