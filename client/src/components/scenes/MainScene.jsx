import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import Robot from '../robot/Robot'
import FloatingFragments from './FloatingFragments'
import CameraController from './CameraController'
import RoomEnvironment from './RoomEnvironment'
import ScanBeam from './ScanBeam'
import HiddenMessage from './HiddenMessage'
import { useScrollStore } from '../../hooks/useScrollStore'

export default function MainScene() {
  const scene = useScrollStore((s) => s.scene)

  return (
    <Canvas
      camera={{ position: [0, 0.5, 7], fov: 50, near: 0.1, far: 50 }}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(180deg, #F8F6F2 0%, #F0EDE8 100%)',
        zIndex: 0,
      }}
    >
      <PerformanceMonitor
        onDecline={() => {/* reduce particle count if needed */}}
      />
      <Suspense fallback={null}>
        <CameraController />
        <RoomEnvironment />
        {/* Robot only appears from scene 1 onwards */}
        {scene >= 1 && (
          <Robot position={[0, -0.5, 0]} />
        )}
        <FloatingFragments />
        <ScanBeam />
        <HiddenMessage />
      </Suspense>
    </Canvas>
  )
}
