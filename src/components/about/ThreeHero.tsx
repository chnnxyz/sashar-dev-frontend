import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 600 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const purple = new THREE.Color('#8b5cf6')
    const white = new THREE.Color('#e5e7eb')

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8

      const t = Math.random()
      const c = purple.clone().lerp(white, t * 0.35)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [count])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * 0.035
    ref.current.rotation.x = Math.sin(t * 0.018) * 0.1
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.055} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

function CameraRig({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, 5)
  }, [camera])

  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 0.4, 0.025)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.current.y * 0.2, 0.025)
  })

  return null
}

export function ThreeHero() {
  const mouse = useRef({ x: 0, y: 0 })
  const [webGLSupported, setWebGLSupported] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')
      if (!gl) setWebGLSupported(false)
    } catch {
      setWebGLSupported(false)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  return (
    <div
      className="relative h-[52vh] w-full select-none overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Three.js particle canvas — fills the container */}
      {webGLSupported && (
        <Canvas
          className="absolute inset-0"
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: '#0d0d0f' }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#8b5cf6" />
          <Particles count={600} />
          <CameraRig mouse={mouse} />
        </Canvas>
      )}

      {/* HTML text overlay — always visible, no font-loading dependency */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-tight"
          style={{
            color: '#a78bfa',
            textShadow: '0 0 40px rgba(139,92,246,0.7), 0 0 80px rgba(109,40,217,0.4)',
          }}
        >
          Sasha Ruiz de Aguirre
        </h1>
        <p
          className="mt-4 text-xs sm:text-sm tracking-[0.25em] uppercase font-medium"
          style={{ color: '#9ca3af', textShadow: '0 0 20px rgba(139,92,246,0.3)' }}
        >
          Machine Learning Engineer · Backend Developer
        </p>
      </div>

      {/* Bottom fade into page background */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, transparent, #0d0d0f)' }} />
    </div>
  )
}
