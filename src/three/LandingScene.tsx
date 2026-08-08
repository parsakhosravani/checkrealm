import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { BoardTiles } from './BoardTiles'
import { Character } from './Character'
import { ChessPiece, type PieceKind } from './ChessPiece'
import { Atmosphere, TorchLight } from './Effects'

const LEGION_RED = '#c23b2e'
const LEGION_GOLD = '#e0b23c'
const HOST_DARK = '#41372a'
const HOST_STEEL = '#8fb8e8'

interface Deployment {
  kind: PieceKind
  x: number
  z: number
  scale?: number
}

/** Battle lines: the ivory host faces the ebony host across the field. */
const ARMY: Deployment[] = [
  { kind: 'king', x: 0, z: -3.0, scale: 1.18 },
  { kind: 'queen', x: -1.2, z: -3.0, scale: 1.08 },
  { kind: 'bishop', x: 1.2, z: -3.0 },
  { kind: 'knight', x: -2.4, z: -2.7 },
  { kind: 'knight', x: 2.4, z: -2.7 },
  { kind: 'rook', x: -3.6, z: -2.9 },
  { kind: 'rook', x: 3.6, z: -2.9 },
  { kind: 'pawn', x: -3.0, z: -1.6, scale: 0.92 },
  { kind: 'pawn', x: -1.8, z: -1.5, scale: 0.92 },
  { kind: 'pawn', x: -0.6, z: -1.6, scale: 0.92 },
  { kind: 'pawn', x: 0.6, z: -1.5, scale: 0.92 },
  { kind: 'pawn', x: 1.8, z: -1.6, scale: 0.92 },
  { kind: 'pawn', x: 3.0, z: -1.5, scale: 0.92 },
]

function Army({ color, accent, flip }: { color: string; accent: string; flip: boolean }) {
  const sign = flip ? -1 : 1
  return (
    <group rotation={[0, flip ? Math.PI : 0, 0]}>
      {ARMY.map((d, i) => (
        <ChessPiece
          key={i}
          kind={d.kind}
          color={color}
          accent={accent}
          position={[d.x * sign, 0.05, d.z]}
          scale={d.scale ?? 1}
        />
      ))}
    </group>
  )
}

function BattleDiorama() {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.07
  })

  return (
    <group ref={ref} position={[0, -0.5, 0]} rotation={[0.46, 0.5, 0]} scale={0.85}>
      <BoardTiles />
      <Army color={LEGION_RED} accent={LEGION_GOLD} flip={false} />
      <Army color={HOST_DARK} accent={HOST_STEEL} flip />

      {/* A duel already raging at the center of the field */}
      <Character role="knight" animation="cheer" position={[-0.65, 0.02, 0]} rotation={1.4} scale={0.95} />
      <Character
        role="knight"
        animation="cheer"
        position={[0.65, 0.02, 0]}
        rotation={-1.6}
        scale={0.95}
        cloth="#3a2c26"
        accent={HOST_STEEL}
      />
      <Character role="mage" animation="idle" position={[-2.2, 0.02, 0.7]} rotation={1.1} scale={0.9} />
      <Character
        role="villager"
        position={[0, 0.02, 0]}
        patrolRadius={4.9}
        patrolSpeed={0.3}
        scale={0.85}
      />
    </group>
  )
}

function LandingLights() {
  return (
    <>
      <color attach="background" args={['#9fc7dd']} />
      <fog attach="fog" args={['#b6d3c9', 18, 44]} />
      <ambientLight intensity={0.95} color="#fff6e0" />
      <directionalLight position={[6, 12, 5]} intensity={2.2} color="#fff3d6" castShadow />
      <hemisphereLight args={['#cfe6f5', '#6f9c4e', 0.6]} />
    </>
  )
}

export function LandingScene() {
  return (
    <div className="landing__canvas" aria-hidden>
      <Canvas
        shadows="percentage"
        camera={{ position: [0, 5.5, 12.5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <LandingLights />
          <Atmosphere emberCount={90} emberArea={20} />
          <TorchLight position={[-4, 2.5, 2]} />
          <TorchLight position={[4, 2.5, -2]} color="#c9a227" />
          <BattleDiorama />
        </Suspense>
      </Canvas>
    </div>
  )
}
