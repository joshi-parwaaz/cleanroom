import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollStore } from '../../hooks/useScrollStore'

const FRAGMENTS = [
  { text: 'John Doe',         type: 'PERSON',  color: '#E8A87C' },
  { text: 'SSN: 821-41-9912', type: 'SSN',     color: '#E87C8A' },
  { text: 'jane@email.com',   type: 'EMAIL',   color: '#7CB9E8' },
  { text: 'Project Athena',   type: 'PROJECT', color: '#A87CE8' },
  { text: '(415) 203-9981',   type: 'PHONE',   color: '#7CE8B9' },
  { text: 'Account #8821049', type: 'ACCT',    color: '#E8D07C' },
  { text: '123 Maple St.',    type: 'ADDR',    color: '#E8A87C' },
  { text: 'MRN-00449821',     type: 'MRN',     color: '#E87C8A' },
  { text: 'Internal Notes',   type: 'DOC',     color: '#C0BDB8' },
  { text: 'Appointment ID',   type: 'DOC',     color: '#C0BDB8' },
  { text: 'sarah.m@corp.io',  type: 'EMAIL',   color: '#7CB9E8' },
  { text: 'Dr. Marcus Webb',  type: 'PERSON',  color: '#E8A87C' },
  { text: 'Policy #NX-2291',  type: 'ACCT',    color: '#E8D07C' },
  { text: 'DOB: 1984-03-12',  type: 'DATE',    color: '#7CE8B9' },
]

function FragmentCard({ data, initialPos, initialRot, scene }) {
  const ref = useRef()
  const { offset, speed } = useMemo(() => ({
    offset: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.4,
  }), [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.y = initialPos[1] + Math.sin(t * speed + offset) * 0.18
    ref.current.rotation.z = initialRot[2] + Math.sin(t * 0.3 + offset) * 0.04

    // Fade out as scene progresses to transformation
    const targetOpacity = scene >= 4 ? 0 : 1
    ref.current.children.forEach((child) => {
      if (child.material) {
        child.material.opacity = THREE.MathUtils.lerp(
          child.material.opacity ?? 1, targetOpacity, 0.03
        )
      }
    })
  })

  return (
    <group ref={ref} position={initialPos} rotation={initialRot}>
      {/* Card background */}
      <mesh>
        <planeGeometry args={[1.4, 0.35]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.85}
          roughness={0.1}
        />
      </mesh>
      {/* Entity text */}
      <Text
        position={[0, 0.02, 0.01]}
        fontSize={0.1}
        color={data.color}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/dmmonoregular/v1/aFTU7PB1QTsUX8KYvrGyIYSnbKX9Rl3V.woff"
      >
        {data.text}
      </Text>
      {/* Type label */}
      <Text
        position={[0, -0.1, 0.01]}
        fontSize={0.065}
        color="#9CA3AF"
        anchorX="center"
        anchorY="middle"
      >
        {data.type}
      </Text>
    </group>
  )
}

export default function FloatingFragments() {
  const scene = useScrollStore((s) => s.scene)

  const items = useMemo(() =>
    FRAGMENTS.map((f, i) => ({
      data: f,
      initialPos: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        -1 - Math.random() * 3,
      ],
      initialRot: [
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.15,
      ],
    })),
  [])

  return (
    <group>
      {items.map((item, i) => (
        <FragmentCard key={i} {...item} scene={scene} />
      ))}
    </group>
  )
}
