import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollStore } from '../../hooks/useScrollStore'

// Camera keyframes per scene
const CAM_POSITIONS = [
  new THREE.Vector3(0, 0.5, 7),   // Scene 0 — wide establishing
  new THREE.Vector3(1.5, 0.8, 5), // Scene 1 — slight arc in
  new THREE.Vector3(0, 0.2, 4),   // Scene 2 — medium shot on robot
  new THREE.Vector3(-1, 0.6, 3.5),// Scene 3 — over-robot view
  new THREE.Vector3(0.5, 0.4, 3), // Scene 4 — close transformation
  new THREE.Vector3(0, 0.3, 4.5), // Scene 5 — pull back for CTA
]
const CAM_TARGETS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0.3, 0),
  new THREE.Vector3(0, 0.3, 0),
  new THREE.Vector3(0, 0.2, 0),
  new THREE.Vector3(0, 0, 0),
]

export default function CameraController() {
  const { camera } = useThree()
  const progress = useScrollStore((s) => s.progress)
  const mouseRef = useRef({ x: 0, y: 0 })

  if (typeof window !== 'undefined') {
    window.onmousemove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
  }

  useFrame(() => {
    const scaledProgress = progress * (CAM_POSITIONS.length - 1)
    const sceneIdx = Math.floor(scaledProgress)
    const t = scaledProgress - sceneIdx
    const nextIdx = Math.min(sceneIdx + 1, CAM_POSITIONS.length - 1)

    const targetPos = new THREE.Vector3().lerpVectors(
      CAM_POSITIONS[sceneIdx], CAM_POSITIONS[nextIdx], easeInOut(t)
    )
    const targetLook = new THREE.Vector3().lerpVectors(
      CAM_TARGETS[sceneIdx], CAM_TARGETS[nextIdx], easeInOut(t)
    )

    // Mouse parallax offset
    const mx = mouseRef.current.x * 0.12
    const my = mouseRef.current.y * 0.08

    camera.position.lerp(
      new THREE.Vector3(targetPos.x + mx, targetPos.y + my, targetPos.z),
      0.05
    )
    camera.lookAt(targetLook)
  })

  return null
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}
