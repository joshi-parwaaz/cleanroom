import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { useScrollStore } from './useScrollStore'

export function useLenis() {
  const setProgress = useScrollStore((s) => s.setProgress)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenis.on('scroll', ({ progress }) => {
      setProgress(progress)
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    const id = requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      cancelAnimationFrame(id)
    }
  }, [setProgress])
}
