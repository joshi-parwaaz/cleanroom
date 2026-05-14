import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5"
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-cyan-glow/20 border border-cyan-glow/40 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-cyan-glow" />
        </div>
        <span className="font-semibold text-lg tracking-wide text-ink-900">
          CleanRoom
        </span>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8 text-sm text-ink-700/60">
        <a href="#how-it-works" className="hover:text-ink-900 transition-colors">How it works</a>
        <a href="#features"     className="hover:text-ink-900 transition-colors">Features</a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
           className="hover:text-ink-900 transition-colors">GitHub</a>
      </div>

      {/* CTA */}
      <Link to="/console" className="btn-primary text-sm py-2 px-6">
        Launch Console
      </Link>
    </motion.nav>
  )
}
