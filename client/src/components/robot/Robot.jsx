import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScrollStore } from '../../hooks/useScrollStore'
import * as THREE from 'three'

export default function Robot({ position = [0, 0, 0] }) {
  const groupRef = useRef()
  const headRef = useRef()
  const eyeLeftRef = useRef()
  const eyeRightRef = useRef()
  const scene = useScrollStore((s) => s.scene)
  const progress = useScrollStore((s) => s.progress)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Gentle hover float
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.05

    // Head tilt based on scene
    if (headRef.current) {
      const targetTilt = scene === 2 ? 0.18 : scene === 3 ? -0.12 : 0
      headRef.current.rotation.z = THREE.MathUtils.lerp(
        headRef.current.rotation.z, targetTilt, 0.04
      )
      // Subtle idle look-around
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.15
    }

    // Eye glow pulse — more active during analysis scene
    const eyeIntensity = scene === 2 ? 1.5 + Math.sin(t * 3) * 0.5
                       : scene === 3 ? 2.0 + Math.sin(t * 5) * 0.8
                       : 0.8 + Math.sin(t * 1.5) * 0.2
    if (eyeLeftRef.current) eyeLeftRef.current.intensity = eyeIntensity
    if (eyeRightRef.current) eyeRightRef.current.intensity = eyeIntensity

    // Scene-based rotation toward the action
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      scene >= 2 ? -0.3 : 0.1,
      0.02
    )
  })

  const bodyMat = new THREE.MeshStandardMaterial({
    color: '#F0EDE8',
    roughness: 0.3,
    metalness: 0.1,
  })
  const accentCyanMat = new THREE.MeshStandardMaterial({
    color: '#2EC4C4',
    roughness: 0.1,
    metalness: 0.6,
    emissive: '#2EC4C4',
    emissiveIntensity: 0.4,
  })
  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#A8E6E6',
    emissive: '#2EC4C4',
    emissiveIntensity: 1.2,
    roughness: 0.0,
    metalness: 0.0,
  })

  return (
    <group ref={groupRef} position={position}>
      {/* ── Body ─────────────────────────────────────────────────────── */}
      <mesh material={bodyMat} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.38]} />
      </mesh>

      {/* Chest accent stripe */}
      <mesh position={[0, 0.05, 0.2]} material={accentCyanMat}>
        <boxGeometry args={[0.3, 0.06, 0.02]} />
      </mesh>

      {/* ── Neck ─────────────────────────────────────────────────────── */}
      <mesh position={[0, 0.42, 0]} material={bodyMat}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 12]} />
      </mesh>

      {/* ── Head ─────────────────────────────────────────────────────── */}
      <group ref={headRef} position={[0, 0.62, 0]}>
        <mesh material={bodyMat} castShadow>
          <boxGeometry args={[0.44, 0.36, 0.34]} />
        </mesh>

        {/* Eye housings */}
        <mesh position={[-0.1, 0.04, 0.17]} material={accentCyanMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        </mesh>
        <mesh position={[0.1, 0.04, 0.17]} material={accentCyanMat}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        </mesh>

        {/* Eye lenses */}
        <mesh position={[-0.1, 0.04, 0.2]} material={eyeMat}>
          <circleGeometry args={[0.045, 20]} />
        </mesh>
        <mesh position={[0.1, 0.04, 0.2]} material={eyeMat}>
          <circleGeometry args={[0.045, 20]} />
        </mesh>

        {/* Eye point lights */}
        <pointLight
          ref={eyeLeftRef}
          position={[-0.1, 0.04, 0.25]}
          color="#2EC4C4"
          intensity={0.8}
          distance={1.5}
        />
        <pointLight
          ref={eyeRightRef}
          position={[0.1, 0.04, 0.25]}
          color="#2EC4C4"
          intensity={0.8}
          distance={1.5}
        />

        {/* Antenna */}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
          <meshStandardMaterial color="#D9CFBF" />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial
            color="#FFD59E"
            emissive="#FFAA44"
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>

      {/* ── Arms ─────────────────────────────────────────────────────── */}
      <group position={[-0.38, 0.1, 0]}>
        <mesh material={bodyMat}>
          <capsuleGeometry args={[0.06, 0.25, 6, 8]} />
        </mesh>
      </group>
      <group position={[0.38, 0.1, 0]}>
        <mesh material={bodyMat}>
          <capsuleGeometry args={[0.06, 0.25, 6, 8]} />
        </mesh>
      </group>

      {/* ── Base / treads ────────────────────────────────────────────── */}
      <mesh position={[0, -0.42, 0]} material={bodyMat}>
        <boxGeometry args={[0.6, 0.12, 0.44]} />
      </mesh>
      {[-0.22, 0.22].map((x, i) => (
        <mesh key={i} position={[x, -0.44, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.12, 14]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#C5BEB4" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
