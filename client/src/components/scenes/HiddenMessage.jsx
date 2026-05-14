import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollStore } from '../../hooks/useScrollStore'

const WORDS = ['Privacy', 'Creates', 'Trust.']

export default function HiddenMessage() {
  const refs = useRef([])
  const scene = useScrollStore((s) => s.scene)

  const finalPositions = useMemo(() => [
    new THREE.Vector3(-1.4, 0.5, 0.5),
    new THREE.Vector3(0, 0.5, 0.5),
    new THREE.Vector3(1.35, 0.5, 0.5),
  ], [])

  const scatterPositions = useMemo(() => WORDS.map((_, i) => new THREE.Vector3(
    (Math.random() - 0.5) * 6,
    (Math.random() - 0.5) * 3,
    (Math.random() - 0.5) * 2 - 1,
  )), [])

  useFrame(() => {
    const revealed = scene >= 4
    refs.current.forEach((ref, i) => {
      if (!ref) return
      const target = revealed ? finalPositions[i] : scatterPositions[i]
      ref.position.lerp(target, revealed ? 0.03 : 0.008)

      // Fade in when revealed
      if (ref.material) {
        ref.material.opacity = THREE.MathUtils.lerp(
          ref.material.opacity ?? 0,
          revealed ? 1 : 0.15,
          0.04
        )
      }
    })
  })

  return (
    <group>
      {WORDS.map((word, i) => (
        <Text
          key={word}
          ref={(el) => (refs.current[i] = el)}
          position={scatterPositions[i].toArray()}
          fontSize={0.42}
          color="#0D0F12"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/spacegrotesk/v15/V8mDoQDjQSkFtoMM3T6r8E7mF71Q-gowFY.woff2"
          fillOpacity={0.15}
          outlineWidth={0}
        >
          {word}
        </Text>
      ))}
    </group>
  )
}
