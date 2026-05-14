import { motion } from 'framer-motion'
import { useScrollStore } from '../../hooks/useScrollStore'

const SCENES = ['Data', 'Arrival', 'Analysis', 'Transform', 'Reveal', 'Closure']

export default function ScrollProgress() {
  const scene = useScrollStore((s) => s.scene)

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {SCENES.map((label, i) => (
        <div key={i} className="flex items-center gap-2 group cursor-default">
          {/* Label */}
          <span className="text-xs text-ink-700/40 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
            {label}
          </span>
          {/* Dot */}
          <motion.div
            animate={{
              scale: scene === i ? 1.4 : 1,
              backgroundColor: scene === i ? '#2EC4C4' : '#D9CFBF',
            }}
            transition={{ duration: 0.3 }}
            className="w-2 h-2 rounded-full"
          />
        </div>
      ))}
    </div>
  )
}
