import { create } from 'zustand'

/**
 * Global scroll progress store.
 * progress: 0 → 1 over the entire landing page scroll.
 * scene: 0-5 (which narrative scene is active)
 */
export const useScrollStore = create((set) => ({
  progress: 0,
  scene: 0,
  setProgress: (progress) => {
    const scene = Math.min(5, Math.floor(progress * 6))
    set({ progress, scene })
  },
}))
