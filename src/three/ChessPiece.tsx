import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { UnitId } from '../game/types'

/**
 * Battlefield warriors — every "piece" is a hand-posed miniature soldier:
 * footman, lancer, war priest, bulwark guard, warqueen and the king himself.
 * `color` is the faction cloth, `accent` the trim/emblem.
 */
export type PieceKind = UnitId | 'king'

interface ChessPieceProps {
  kind: PieceKind
  color?: string
  accent?: string
  position?: [number, number, number]
  scale?: number
  selected?: boolean
  bob?: boolean
  onClick?: (e: { stopPropagation: () => void }) => void
}

const STEEL = '#aab4c2'
const STEEL_DARK = '#6e7885'
const SKIN = '#d9a97c'
const LEATHER = '#4a3826'

interface PartProps {
  cloth: string
  accent: string
}

/* ---------- shared anatomy ---------- */

function Leg({ x, forward = 0 }: { x: number; forward?: number }) {
  return (
    <group position={[x, 0.34, 0]} rotation={[forward, 0, 0]}>
      <mesh position={[0, -0.12, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.24, 10]} />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.45} metalness={0.5} />
      </mesh>
      {/* Boot */}
      <mesh position={[0, -0.28, 0.03]} castShadow>
        <boxGeometry args={[0.11, 0.09, 0.2]} />
        <meshStandardMaterial color={LEATHER} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Arm({
  x,
  raise = 0,
  spread = 0,
  cloth,
}: {
  x: number
  raise?: number
  spread?: number
  cloth: string
}) {
  const side = Math.sign(x)
  return (
    <group position={[x, 0.78, 0]} rotation={[raise, 0, side * spread]}>
      {/* Pauldron */}
      <mesh castShadow>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshStandardMaterial color={STEEL} roughness={0.3} metalness={0.75} />
      </mesh>
      <mesh position={[0, -0.16, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.26, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.6} />
      </mesh>
      {/* Gauntlet */}
      <mesh position={[0, -0.31, 0]} castShadow>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial color={STEEL_DARK} roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

function Torso({ cloth, accent, broad = 1 }: PartProps & { broad?: number }) {
  return (
    <group>
      {/* Cuirass */}
      <mesh position={[0, 0.66, 0]} castShadow>
        <cylinderGeometry args={[0.13 * broad, 0.17 * broad, 0.34, 12]} />
        <meshStandardMaterial color={STEEL} roughness={0.28} metalness={0.8} />
      </mesh>
      {/* Tabard */}
      <mesh position={[0, 0.6, 0.13 * broad]} castShadow>
        <boxGeometry args={[0.16 * broad, 0.3, 0.03]} />
        <meshStandardMaterial color={cloth} roughness={0.65} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <cylinderGeometry args={[0.15 * broad, 0.15 * broad, 0.05, 12]} />
        <meshStandardMaterial color={accent} roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Skirt of tassets */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.16 * broad, 0.19 * broad, 0.12, 12]} />
        <meshStandardMaterial color={cloth} roughness={0.7} />
      </mesh>
    </group>
  )
}

function Head({ y = 0.95 }: { y?: number }) {
  return (
    <mesh position={[0, y, 0]} castShadow>
      <sphereGeometry args={[0.11, 14, 14]} />
      <meshStandardMaterial color={SKIN} roughness={0.7} />
    </mesh>
  )
}

function Cape({ cloth, length = 0.55, width = 0.34 }: { cloth: string; length?: number; width?: number }) {
  return (
    <mesh position={[0, 0.62, -0.14]} rotation={[0.18, 0, 0]} castShadow>
      <boxGeometry args={[width, length, 0.025]} />
      <meshStandardMaterial color={cloth} roughness={0.75} />
    </mesh>
  )
}

function Crown({ accent, y, radius = 0.1, spikes = 5 }: { accent: string; y: number; radius?: number; spikes?: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius * 1.08, 0.06, 12]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>
      {Array.from({ length: spikes }, (_, i) => {
        const a = (i / spikes) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * radius * 0.85, 0.06, Math.sin(a) * radius * 0.85]} castShadow>
            <coneGeometry args={[0.02, 0.07, 6]} />
            <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
          </mesh>
        )
      })}
      {/* Jewel */}
      <mesh position={[0, 0.03, radius]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#e04848" emissive="#e04848" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

function Sword({
  position,
  rotation = [0, 0, 0],
  length = 0.5,
  accent,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  length?: number
  accent: string
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Blade */}
      <mesh position={[0, length / 2, 0]} castShadow>
        <boxGeometry args={[0.035, length, 0.012]} />
        <meshStandardMaterial color="#dde4ec" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Crossguard */}
      <mesh castShadow>
        <boxGeometry args={[0.14, 0.028, 0.03]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Grip + pommel */}
      <mesh position={[0, -0.07, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.11, 8]} />
        <meshStandardMaterial color={LEATHER} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.14, 0]} castShadow>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
}

function RoundShield({ cloth, accent, x }: PartProps & { x: number }) {
  return (
    <group position={[x, 0.62, 0.1]} rotation={[0, Math.sign(x) * 0.5, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 18]} />
        <meshStandardMaterial color={cloth} roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[0.14, 0.015, 8, 20]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.025, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color={accent} roughness={0.25} metalness={0.7} />
      </mesh>
    </group>
  )
}

/* ---------- the six warriors ---------- */

function Footman({ cloth, accent }: PartProps) {
  return (
    <group>
      <Leg x={-0.08} />
      <Leg x={0.08} />
      <Torso cloth={cloth} accent={accent} />
      <Arm x={-0.19} raise={-0.35} cloth={cloth} />
      <Arm x={0.19} raise={-1.15} cloth={cloth} />
      <Head />
      {/* Kettle helm */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.115, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={STEEL} roughness={0.3} metalness={0.75} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.02, 14]} />
        <meshStandardMaterial color={STEEL} roughness={0.3} metalness={0.75} />
      </mesh>
      <RoundShield cloth={cloth} accent={accent} x={-0.24} />
      <Sword position={[0.24, 0.62, 0.28]} rotation={[0.9, 0, 0]} length={0.42} accent={accent} />
    </group>
  )
}

function Lancer({ cloth, accent }: PartProps) {
  return (
    <group>
      <Leg x={-0.08} forward={-0.25} />
      <Leg x={0.08} forward={0.15} />
      <Torso cloth={cloth} accent={accent} />
      <Cape cloth={cloth} length={0.5} />
      <Arm x={-0.19} raise={-0.5} cloth={cloth} />
      <Arm x={0.19} raise={-1.5} cloth={cloth} />
      <Head />
      {/* Great helm with plume */}
      <mesh position={[0, 0.99, 0]} castShadow>
        <cylinderGeometry args={[0.105, 0.115, 0.18, 12]} />
        <meshStandardMaterial color={STEEL} roughness={0.25} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.97, 0.1]} castShadow>
        <boxGeometry args={[0.09, 0.02, 0.03]} />
        <meshStandardMaterial color="#1a1510" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.14, -0.03]} rotation={[-0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.045, 0.24, 8]} />
        <meshStandardMaterial color={accent} roughness={0.55} />
      </mesh>
      {/* Lance */}
      <group position={[0.25, 0.6, 0.12]} rotation={[-0.28, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.024, 1.15, 8]} />
          <meshStandardMaterial color={LEATHER} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.64, 0]} castShadow>
          <coneGeometry args={[0.035, 0.14, 8]} />
          <meshStandardMaterial color="#dde4ec" roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Pennant */}
        <mesh position={[0, 0.5, 0.05]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.14, 0.07, 0.012]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
      </group>
      <RoundShield cloth={cloth} accent={accent} x={-0.24} />
    </group>
  )
}

function WarPriest({ cloth, accent }: PartProps) {
  return (
    <group>
      {/* Robe replaces legs */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.24, 0.55, 14]} />
        <meshStandardMaterial color={cloth} roughness={0.75} />
      </mesh>
      <Torso cloth={cloth} accent={accent} broad={0.95} />
      <Arm x={-0.18} raise={-0.9} cloth={cloth} />
      <Arm x={0.18} raise={-1.35} cloth={cloth} />
      <Head />
      {/* Hood + mitre */}
      <mesh position={[0, 1.0, -0.02]} castShadow>
        <sphereGeometry args={[0.125, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={cloth} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.14, 0]} castShadow>
        <coneGeometry args={[0.075, 0.22, 4]} />
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.35} />
      </mesh>
      {/* Staff with blessed orb */}
      <group position={[0.24, 0.55, 0.16]} rotation={[-0.1, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.026, 0.95, 8]} />
          <meshStandardMaterial color={LEATHER} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.53, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.3} />
        </mesh>
      </group>
    </group>
  )
}

function Bulwark({ cloth, accent }: PartProps) {
  return (
    <group>
      <Leg x={-0.1} />
      <Leg x={0.1} />
      <Torso cloth={cloth} accent={accent} broad={1.3} />
      <Arm x={-0.24} raise={-0.9} spread={0.15} cloth={cloth} />
      <Arm x={0.24} raise={-0.9} spread={0.15} cloth={cloth} />
      <Head y={0.98} />
      {/* Crenellated helm — the tower lives on */}
      <group position={[0, 1.06, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.115, 0.115, 0.12, 12]} />
          <meshStandardMaterial color={STEEL} roughness={0.3} metalness={0.75} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          return (
            <mesh key={i} position={[Math.cos(a) * 0.09, 0.09, Math.sin(a) * 0.09]} castShadow>
              <boxGeometry args={[0.05, 0.06, 0.05]} />
              <meshStandardMaterial color={STEEL} roughness={0.3} metalness={0.75} />
            </mesh>
          )
        })}
      </group>
      {/* Tower shield held front */}
      <group position={[0, 0.55, 0.26]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.62, 0.04]} />
          <meshStandardMaterial color={cloth} roughness={0.5} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.3, 0.5, 0.012]} />
          <meshStandardMaterial color={accent} roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow>
          <boxGeometry args={[0.42, 0.06, 0.06]} />
          <meshStandardMaterial color={STEEL_DARK} roughness={0.35} metalness={0.65} />
        </mesh>
      </group>
    </group>
  )
}

function Warqueen({ cloth, accent }: PartProps) {
  return (
    <group>
      {/* Long battle gown */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.22, 0.6, 14]} />
        <meshStandardMaterial color={cloth} roughness={0.6} />
      </mesh>
      <Torso cloth={cloth} accent={accent} broad={0.9} />
      <Cape cloth={accent} length={0.62} width={0.3} />
      <Arm x={-0.17} raise={-0.4} cloth={cloth} />
      <Arm x={0.17} raise={-2.3} cloth={cloth} />
      <Head />
      {/* Flowing hair */}
      <mesh position={[0, 0.95, -0.07]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.16, 0.3, 0.05]} />
        <meshStandardMaterial color="#2c2118" roughness={0.85} />
      </mesh>
      <Crown accent={accent} y={1.07} radius={0.085} spikes={6} />
      {/* Sword raised to the sky */}
      <Sword position={[0.28, 1.02, 0.03]} rotation={[0, 0, -0.12]} length={0.55} accent={accent} />
    </group>
  )
}

function WarlordKing({ cloth, accent }: PartProps) {
  return (
    <group>
      <Leg x={-0.1} />
      <Leg x={0.1} />
      <Torso cloth={cloth} accent={accent} broad={1.15} />
      <Cape cloth={cloth} length={0.68} width={0.42} />
      {/* Fur mantle */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.23, 0.1, 12]} />
        <meshStandardMaterial color="#5a4632" roughness={0.95} />
      </mesh>
      <Arm x={-0.22} raise={-1.05} spread={0.1} cloth={cloth} />
      <Arm x={0.22} raise={-1.05} spread={-0.1} cloth={cloth} />
      <Head y={1.0} />
      {/* Beard */}
      <mesh position={[0, 0.93, 0.08]} castShadow>
        <coneGeometry args={[0.06, 0.14, 8]} />
        <meshStandardMaterial color="#8a7a64" roughness={0.9} />
      </mesh>
      <Crown accent={accent} y={1.14} radius={0.105} spikes={7} />
      {/* Greatsword planted point-down before him */}
      <group position={[0, 0.18, 0.3]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.05, 0.7, 0.016]} />
          <meshStandardMaterial color="#dde4ec" roughness={0.15} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.2, 0.035, 0.04]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.16, 8]} />
          <meshStandardMaterial color={LEATHER} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.0, 0]} castShadow>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

const WARRIOR: Record<PieceKind, (p: PartProps) => ReturnType<typeof Footman>> = {
  pawn: Footman,
  knight: Lancer,
  bishop: WarPriest,
  rook: Bulwark,
  queen: Warqueen,
  king: WarlordKing,
}

/** Approximate model heights, used to scale the miniature base. */
const BASE_RADIUS: Record<PieceKind, number> = {
  pawn: 0.34,
  knight: 0.38,
  bishop: 0.36,
  rook: 0.42,
  queen: 0.36,
  king: 0.44,
}

export function ChessPiece({
  kind,
  color = '#f0e6d2',
  accent,
  position = [0, 0, 0],
  scale = 1,
  selected = false,
  bob = false,
  onClick,
}: ChessPieceProps) {
  const ref = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const seed = useMemo(() => Math.random() * 20, [])
  const accentColor = accent ?? color
  const Body = WARRIOR[kind]
  const baseRadius = BASE_RADIUS[kind]

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed
    if (bob && ref.current) {
      // Marching: quick step-bounce with a forward lean.
      ref.current.position.y = position[1] + Math.abs(Math.sin(t * 6)) * 0.07
      ref.current.rotation.z = Math.sin(t * 6) * 0.05
    }
    if (selected && ref.current) {
      ref.current.position.y = position[1] + 0.1 + Math.sin(t * 4) * 0.04
    }
    if (inner.current) {
      // Breathing idle so the army feels alive.
      inner.current.scale.y = 1 + Math.sin(t * 1.8) * 0.012
      inner.current.rotation.y = bob ? 0 : Math.sin(t * 0.6) * 0.05
    }
  })

  return (
    <group
      ref={ref}
      position={position}
      scale={scale}
      onClick={onClick}
      onPointerOver={() => {
        document.body.style.cursor = onClick ? 'pointer' : 'default'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {/* Miniature base plate */}
      <mesh position={[0, 0.015, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[baseRadius, baseRadius * 1.12, 0.05, 20]} />
        <meshStandardMaterial color="#23201a" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.042, 0]}>
        <cylinderGeometry args={[baseRadius * 0.92, baseRadius * 0.92, 0.012, 20]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.15} />
      </mesh>

      <group ref={inner} position={[0, 0.05, 0]}>
        <Body cloth={color} accent={accentColor} />
      </group>

      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[baseRadius * 1.3, baseRadius * 1.65, 32]} />
          <meshBasicMaterial color="#c9a227" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  )
}
