import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Plane } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollStore } from '../../hooks/useScrollStore'

export default function RoomEnvironment() {
  const ambientRef = useRef()
  const scene = useScrollStore((s) => s.scene)

  useFrame(() => {
    if (!ambientRef.current) return
    // Room gets brighter and warmer as scenes progress
    const targetIntensity = 0.6 + scene * 0.08
    ambientRef.current.intensity = THREE.MathUtils.lerp(
      ambientRef.current.intensity, targetIntensity, 0.04
    )
  })

  return (
    <>
      {/* Ambient fill */}
      <ambientLight ref={ambientRef} color="#FFF8F0" intensity={0.6} />

      {/* Key light — warm from upper left */}
      <directionalLight
        position={[-4, 6, 3]}
        color="#FFF5E8"
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Soft fill from right */}
      <directionalLight position={[5, 3, -2]} color="#E8F5FF" intensity={0.4} />

      {/* Ground bounce */}
      <directionalLight position={[0, -3, 2]} color="#FFF0E0" intensity={0.2} />

      {/* Atmospheric point lights */}
      <pointLight position={[-3, 2, 1]} color="#A8E6E6" intensity={0.5} distance={8} />
      <pointLight position={[3, 1, -2]} color="#FFD59E" intensity={0.3} distance={6} />

      {/* Floor */}
      <Plane
        receiveShadow
        args={[30, 30]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      >
        <meshStandardMaterial color="#F0EDE8" roughness={0.85} metalness={0} />
      </Plane>

      {/* Subtle back wall */}
      <Plane args={[30, 12]} position={[0, 4, -8]}>
        <meshStandardMaterial color="#F8F6F2" roughness={1} />
      </Plane>

      {/* Depth fog */}
      <fog attach="fog" args={['#F5F0EB', 10, 28]} />
    </>
  )
}
