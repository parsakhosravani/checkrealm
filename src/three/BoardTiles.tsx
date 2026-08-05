import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { MAP_SIZE } from '../game/constants'

const TILE = 1.15
const GAP = 0.04
const STEP = TILE + GAP
const HALF = ((MAP_SIZE - 1) * STEP) / 2

export function boardToWorld(x: number, y: number): [number, number, number] {
  return [x * STEP - HALF, 0, y * STEP - HALF]
}

/** Deterministic per-tile pseudo-random so the terrain never flickers. */
function rand(x: number, y: number, salt = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453
  return n - Math.floor(n)
}

function Rock({ position, size }: { position: [number, number, number]; size: number }) {
  return (
    <mesh position={position} rotation={[size * 7, size * 13, size * 5]} castShadow>
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color="#4c463c" roughness={0.95} />
    </mesh>
  )
}

function GrassTuft({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      {[-0.04, 0, 0.05].map((dx, i) => (
        <mesh key={i} position={[dx, 0.05, i * 0.03 - 0.03]} rotation={[0, i, dx * 4]} castShadow>
          <coneGeometry args={[0.015, 0.14, 4]} />
          <meshStandardMaterial color="#3f5c33" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** A tattered war banner on a wooden pole, waving gently. */
export function WarBanner({
  position,
  color = '#c9a227',
  height = 1.9,
  phase = 0,
}: {
  position: [number, number, number]
  color?: string
  height?: number
  phase?: number
}) {
  const flag = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flag.current) return
    const t = clock.elapsedTime + phase
    flag.current.rotation.y = Math.sin(t * 1.4) * 0.28
    flag.current.rotation.x = Math.sin(t * 2.1) * 0.06
  })

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, height, 8]} />
        <meshStandardMaterial color="#4a3826" roughness={0.85} />
      </mesh>
      <mesh position={[0, height + 0.04, 0]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>
      <group ref={flag} position={[0, height - 0.28, 0]}>
        <mesh position={[0.24, 0, 0]} castShadow>
          <boxGeometry args={[0.46, 0.4, 0.02]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* Torn tip */}
        <mesh position={[0.42, -0.26, 0]} rotation={[0, 0, 0.6]} castShadow>
          <boxGeometry args={[0.16, 0.14, 0.02]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

/** A crackling brazier — battlefield firelight. */
export function Brazier({ position }: { position: [number, number, number] }) {
  const flame = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!flame.current) return
    const t = clock.elapsedTime + position[0] * 3
    flame.current.scale.setScalar(0.9 + Math.sin(t * 8) * 0.12 + Math.sin(t * 19) * 0.06)
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.1, 0.28, 10]} />
        <meshStandardMaterial color="#33302a" roughness={0.6} metalness={0.5} />
      </mesh>
      <group ref={flame} position={[0, 0.38, 0]}>
        <mesh>
          <coneGeometry args={[0.11, 0.3, 8]} />
          <meshStandardMaterial color="#e8862a" emissive="#e8622a" emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshStandardMaterial color="#f5c542" emissive="#f5c542" emissiveIntensity={2} />
        </mesh>
      </group>
      <pointLight position={[0, 0.55, 0]} color="#e8942a" intensity={1.4} distance={5} decay={2} />
    </group>
  )
}

/**
 * The battlefield: a chess-like grid of scarred earth and mossy stone,
 * ringed by an earthen rampart with war banners and braziers.
 */
export function BoardTiles({
  onTileClick,
  highlight,
}: {
  onTileClick?: (x: number, y: number) => void
  highlight?: { x: number; y: number } | null
}) {
  const tiles = useMemo(() => {
    const out = []
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const light = (x + y) % 2 === 0
        const [wx, , wz] = boardToWorld(x, y)
        const h = 0.1 + rand(x, y) * 0.05
        const tint = rand(x, y, 1)
        // Mossy field squares vs scorched earth squares.
        const base = light
          ? tint > 0.5
            ? '#31533f'
            : '#2c4b39'
          : tint > 0.5
            ? '#22312a'
            : '#263229'
        out.push({ x, y, wx, wz, h, base, jitter: (rand(x, y, 2) - 0.5) * 0.05 })
      }
    }
    return out
  }, [])

  const props = useMemo(() => {
    const rocks: { position: [number, number, number]; size: number }[] = []
    const tufts: { position: [number, number, number]; scale: number }[] = []
    for (const t of tiles) {
      const r = rand(t.x, t.y, 3)
      if (r > 0.86) {
        rocks.push({
          position: [t.wx + (rand(t.x, t.y, 4) - 0.5) * 0.7, 0.08, t.wz + (rand(t.x, t.y, 5) - 0.5) * 0.7],
          size: 0.05 + rand(t.x, t.y, 6) * 0.06,
        })
      } else if (r > 0.62) {
        tufts.push({
          position: [t.wx + (rand(t.x, t.y, 7) - 0.5) * 0.8, 0.05, t.wz + (rand(t.x, t.y, 8) - 0.5) * 0.8],
          scale: 0.7 + rand(t.x, t.y, 9) * 0.7,
        })
      }
    }
    return { rocks, tufts }
  }, [tiles])

  const edge = MAP_SIZE * STEP
  const corner = HALF + 1.0

  return (
    <group>
      {/* Earthen rampart around the field */}
      <mesh receiveShadow position={[0, -0.26, 0]}>
        <cylinderGeometry args={[edge * 0.78, edge * 0.86, 0.34, 10]} />
        <meshStandardMaterial color="#241f16" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[edge + 0.7, 0.14, edge + 0.7]} />
        <meshStandardMaterial color="#33402e" roughness={0.9} />
      </mesh>

      {tiles.map((t) => {
        const isHi = highlight?.x === t.x && highlight?.y === t.y
        return (
          <group key={`${t.x}-${t.y}`} position={[t.wx, t.jitter * 0.4, t.wz]}>
            <mesh
              receiveShadow
              position={[0, -0.06, 0]}
              rotation={[0, t.jitter, 0]}
              onClick={(e) => {
                e.stopPropagation()
                onTileClick?.(t.x, t.y)
              }}
              onPointerOver={() => {
                if (onTileClick) document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default'
              }}
            >
              <boxGeometry args={[TILE, t.h, TILE]} />
              <meshStandardMaterial
                color={isHi ? '#3d6b4f' : t.base}
                roughness={0.9}
                metalness={0.02}
              />
            </mesh>
            {isHi && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                <planeGeometry args={[TILE * 0.92, TILE * 0.92]} />
                <meshBasicMaterial color="#c9a227" transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        )
      })}

      {props.rocks.map((r, i) => (
        <Rock key={`rock-${i}`} {...r} />
      ))}
      {props.tufts.map((t, i) => (
        <GrassTuft key={`tuft-${i}`} {...t} />
      ))}

      {/* War banners and firelight at the corners */}
      <WarBanner position={[-corner, 0, -corner]} color="#f0e6d2" phase={0} />
      <WarBanner position={[corner, 0, -corner]} color="#c9a227" phase={2} />
      <WarBanner position={[-corner, 0, corner]} color="#b54a3a" phase={4} />
      <WarBanner position={[corner, 0, corner]} color="#2a2420" phase={6} />
      <Brazier position={[-corner, 0, 0]} />
      <Brazier position={[corner, 0, 0]} />
    </group>
  )
}

export { TILE, STEP, HALF }
