import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollStore } from '../../hooks/useScrollStore'

export default function ScanBeam() {
  const ref = useRef()
  const scene = useScrollStore((s) => s.scene)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const visible = scene === 2 || scene === 3

    // Fade in/out
    ref.current.material.opacity = THREE.MathUtils.lerp(
      ref.current.material.opacity, visible ? 0.18 : 0, 0.06
    )

    if (visible) {
      // Sweep motion
      ref.current.position.x = Math.sin(t * 0.7) * 2.5
      ref.current.rotation.z = Math.sin(t * 0.4) * 0.08
    }
  })

  return (
    <mesh ref={ref} position={[0, 0, 0.5]}>
      <planeGeometry args={[0.08, 6]} />
      <meshBasicMaterial
        color="#2EC4C4"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
