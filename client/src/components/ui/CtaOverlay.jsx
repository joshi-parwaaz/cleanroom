import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useScrollStore } from '../../hooks/useScrollStore'

export default function CtaOverlay() {
  const scene = useScrollStore((s) => s.scene)
  const visible = scene >= 5

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="pointer-events-auto text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-mono text-sm text-ink-700/40 tracking-widest uppercase mb-6"
            >
              Privacy Creates Trust
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-6xl font-semibold text-ink-900 mb-4 tracking-tight"
            >
              CleanRoom
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xl text-ink-700/60 mb-10 font-light max-w-md mx-auto"
            >
              Local-First PII/PHI Anonymization Engine
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="flex gap-4 justify-center"
            >
              <Link to="/console" className="btn-primary">
                Enter CleanRoom
              </Link>
              <a href="#how-it-works" className="btn-ghost">
                Learn More
              </a>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
