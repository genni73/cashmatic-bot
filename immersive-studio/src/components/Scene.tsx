'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

function Centerpiece() {
  const coreRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.15
      coreRef.current.rotation.y += delta * 0.2
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.1
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.3
    }
  })

  return (
    <group>
      <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.4, 1]} />
          <MeshDistortMaterial
            color="#ff5a3c"
            attach="material"
            distort={0.45}
            speed={2}
            roughness={0.25}
            metalness={0.4}
          />
        </mesh>
      </Float>
      <mesh ref={ringRef}>
        <torusGeometry args={[2.6, 0.015, 16, 120]} />
        <meshBasicMaterial color="#3cc9ff" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.1, 0.008, 16, 120]} />
        <meshBasicMaterial color="#ff5a3c" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function CameraRig() {
  useFrame((state) => {
    const targetX = state.pointer.x * 0.6
    const targetY = state.pointer.y * 0.3
    state.camera.position.x += (targetX - state.camera.position.x) * 0.03
    state.camera.position.y += (targetY - state.camera.position.y) * 0.03
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#030304']} />
      <fog attach="fog" args={['#030304', 6, 13]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 4]} intensity={60} color="#ff8a3c" />
      <pointLight position={[-4, -2, -3]} intensity={40} color="#3cc9ff" />
      <pointLight position={[0, -4, 2]} intensity={20} color="#ffffff" />
      <Centerpiece />
      <Sparkles count={80} scale={8} size={2} speed={0.3} color="#ffffff" opacity={0.6} />
      <CameraRig />
    </Canvas>
  )
}
