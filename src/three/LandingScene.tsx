import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Group } from 'three'
import { BoardTiles } from './BoardTiles'
import { ChessPiece } from './ChessPiece'

function RotatingBoard() {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.1
  })

  return (
    <group ref={ref} position={[0, -0.2, 0]} rotation={[0.42, 0.55, 0]} scale={1.05}>
      <BoardTiles />
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <ChessPiece kind="king" color="#f0e6d2" accent="#c9a227" position={[0, 0.05, 0]} scale={1.2} />
      </Float>
      <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.5}>
        <ChessPiece kind="queen" color="#2a2420" accent="#c9a227" position={[-2.4, 0.05, -1.2]} scale={1.05} />
      </Float>
      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.45}>
        <ChessPiece kind="knight" color="#f0e6d2" accent="#8b6914" position={[2.4, 0.05, 1.2]} scale={1} />
      </Float>
      <Float speed={1.3} rotationIntensity={0.18} floatIntensity={0.55}>
        <ChessPiece kind="rook" color="#2a2420" accent="#4a8f6f" position={[1.2, 0.05, -2.4]} scale={1} />
      </Float>
      <Float speed={1.5} rotationIntensity={0.22} floatIntensity={0.5}>
        <ChessPiece kind="bishop" color="#f0e6d2" accent="#4a6a8b" position={[-1.2, 0.05, 2.4]} scale={0.95} />
      </Float>
      <ChessPiece kind="pawn" color="#2a2420" accent="#c9a227" position={[3.6, 0.05, -2.4]} scale={0.8} />
      <ChessPiece kind="pawn" color="#f0e6d2" accent="#c9a227" position={[-3.6, 0.05, 2.4]} scale={0.8} />
    </group>
  )
}

function LandingLights() {
  return (
    <>
      <color attach="background" args={['#0a1410']} />
      <fog attach="fog" args={['#0a1410', 16, 36]} />
      <ambientLight intensity={0.65} color="#d5e0d2" />
      <directionalLight position={[6, 12, 5]} intensity={1.6} color="#fff2d0" castShadow />
      <pointLight position={[-5, 5, -3]} intensity={0.7} color="#6fa88a" />
      <pointLight position={[3, 4, 6]} intensity={0.8} color="#c9a227" />
    </>
  )
}

export function LandingScene() {
  return (
    <div className="landing__canvas" aria-hidden>
      <Canvas
        shadows="percentage"
        camera={{ position: [0, 5.5, 12], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <LandingLights />
          <RotatingBoard />
        </Suspense>
      </Canvas>
    </div>
  )
}
