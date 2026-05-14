import { AnimatePresence, motion } from 'framer-motion'
import { useScrollStore } from '../../hooks/useScrollStore'

const SCENES = [
  {
    title: 'Human Data Everywhere.',
    body: 'Every document carries fragments of identity — names, numbers, histories. Quietly exposed.',
  },
  {
    title: 'Something Arrives.',
    body: 'Careful. Curious. Designed to understand before it acts.',
  },
  {
    title: 'Understanding, Not Surveillance.',
    body: 'The system reads context. Recognises what matters. Prepares to protect.',
  },
  {
    title: 'Transformation.',
    body: 'Each sensitive entity is replaced — consistently, intelligently — across the entire document.',
  },
  {
    title: null,
    body: null,
  },
  {
    title: 'The Room is Clean.',
    body: 'Trust emerges from protected information.',
  },
]

const variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.4 } },
}

export default function SceneOverlay() {
  const scene = useScrollStore((s) => s.scene)
  const current = SCENES[scene] || SCENES[0]

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-end pb-24 px-10">
      <AnimatePresence mode="wait">
        {current.title && (
          <motion.div
            key={scene}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-lg"
          >
            <h2 className="text-3xl font-semibold text-ink-900 mb-2 leading-tight">
              {current.title}
            </h2>
            <p className="text-lg text-ink-700/70 font-light">
              {current.body}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
