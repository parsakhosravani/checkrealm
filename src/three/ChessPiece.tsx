import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { UnitId } from '../game/types'

/**
 * Travian-style legion miniatures — every "piece" is a hand-posed soldier
 * in the classic browser-strategy art style: crested steel helmets, banded
 * armor over a colored tunic, curved tower shields, bare legs and sandals.
 * `color` is the faction tunic/shield cloth, `accent` the trim/emblem.
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

const STEEL = '#b8c2cc'
const SKIN = '#e0b088'
const LEATHER = '#7a5230'
const CREST_RED = '#c23b2e'

interface PartProps {
  cloth: string
  accent: string
}

/* ---------- shared anatomy ---------- */

function BareLeg({ x, forward = 0 }: { x: number; forward?: number }) {
  return (
    <group position={[x, 0.36, 0]} rotation={[forward, 0, 0]}>
      <mesh position={[0, -0.13, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.26, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* Sandal straps */}
      <mesh position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.03, 10]} />
        <meshStandardMaterial color={LEATHER} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.28, 0.035]} castShadow>
        <boxGeometry args={[0.1, 0.05, 0.19]} />
        <meshStandardMaterial color={LEATHER} roughness={0.85} />
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
      {/* Shoulder plate */}
      <mesh castShadow>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={STEEL} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Tunic sleeve + bare arm */}
      <mesh position={[0, -0.09, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.052, 0.1, 10]} />
        <meshStandardMaterial color={cloth} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.21, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.048, 0.16, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* Hand */}
      <mesh position={[0, -0.31, 0]} castShadow>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Tunic + lorica segmentata bands + pteruges skirt. */
function RomanTorso({ cloth, accent, broad = 1 }: PartProps & { broad?: number }) {
  return (
    <group>
      {/* Tunic under-layer */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.13 * broad, 0.17 * broad, 0.36, 12]} />
        <meshStandardMaterial color={cloth} roughness={0.7} />
      </mesh>
      {/* Banded armor */}
      {[0.74, 0.68, 0.62].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <cylinderGeometry
            args={[(0.135 + i * 0.008) * broad, (0.145 + i * 0.008) * broad, 0.055, 12]}
          />
          <meshStandardMaterial color={STEEL} roughness={0.3} metalness={0.75} />
        </mesh>
      ))}
      {/* Belt with apron */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.155 * broad, 0.155 * broad, 0.045, 12]} />
        <meshStandardMaterial color={LEATHER} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.42, 0.14 * broad]} castShadow>
        <boxGeometry args={[0.07, 0.16, 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Pteruges skirt strips */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.13 * broad, 0.4, Math.sin(a) * 0.13 * broad]}
            rotation={[0, -a, 0]}
            castShadow
          >
            <boxGeometry args={[0.07, 0.14, 0.02]} />
            <meshStandardMaterial color={cloth} roughness={0.75} />
          </mesh>
        )
      })}
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

/** Legionary galea: steel bowl, neck guard, cheek plates, optional crest. */
function Galea({ crest = false, crestColor = CREST_RED }: { crest?: boolean; crestColor?: string }) {
  return (
    <group position={[0, 0.97, 0]}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.12, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={STEEL} roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Neck guard */}
      <mesh position={[0, -0.005, -0.09]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.16, 0.02, 0.09]} />
        <meshStandardMaterial color={STEEL} roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Cheek plates */}
      {[-0.095, 0.095].map((x) => (
        <mesh key={x} position={[x, -0.02, 0.03]} castShadow>
          <boxGeometry args={[0.02, 0.09, 0.08]} />
          <meshStandardMaterial color={STEEL} roughness={0.25} metalness={0.8} />
        </mesh>
      ))}
      {crest && (
        <>
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.035, 0.09, 0.24]} />
            <meshStandardMaterial color={crestColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.11, -0.14]} rotation={[0.7, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.05, 0.1]} />
            <meshStandardMaterial color={crestColor} roughness={0.7} />
          </mesh>
        </>
      )}
    </group>
  )
}

function Cape({ cloth, length = 0.55, width = 0.34 }: { cloth: string; length?: number; width?: number }) {
  return (
    <mesh position={[0, 0.62, -0.15]} rotation={[0.18, 0, 0]} castShadow>
      <boxGeometry args={[width, length, 0.025]} />
      <meshStandardMaterial color={cloth} roughness={0.75} />
    </mesh>
  )
}

/** Golden laurel wreath — for royalty. */
function Laurel({ y, accent }: { y: number; accent: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.105, 0.02, 8, 18]} />
        <meshStandardMaterial color={accent} roughness={0.25} metalness={0.85} />
      </mesh>
      {[-0.35, 0.35].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.1, 0.03, Math.cos(a) * 0.1]} castShadow>
          <coneGeometry args={[0.025, 0.06, 6]} />
          <meshStandardMaterial color={accent} roughness={0.25} metalness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/** Curved rectangular tower shield with gold boss and wing emblem. */
function Scutum({
  cloth,
  accent,
  position,
  rotation = [0, 0, 0],
  height = 0.55,
}: PartProps & {
  position: [number, number, number]
  rotation?: [number, number, number]
  height?: number
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Curved body: open cylinder segment */}
      <mesh rotation={[0, Math.PI + 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, height, 10, 1, true, 0, 1.1]} />
        <meshStandardMaterial color={cloth} roughness={0.55} side={2} />
      </mesh>
      {/* Rim */}
      {[height / 2, -height / 2].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, Math.PI + 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.305, 0.305, 0.02, 10, 1, true, 0, 1.1]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} side={2} />
        </mesh>
      ))}
      {/* Boss */}
      <mesh position={[0, 0, -0.3]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial color={accent} roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Wing emblem strokes */}
      {[-0.09, 0.09].map((x) => (
        <mesh key={x} position={[x, 0.1, -0.285]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
          <boxGeometry args={[0.02, 0.14, 0.012]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Gladius({
  position,
  rotation = [0, 0, 0],
  length = 0.4,
  accent,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  length?: number
  accent: string
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, length / 2, 0]} castShadow>
        <boxGeometry args={[0.04, length, 0.014]} />
        <meshStandardMaterial color="#e2e8ee" roughness={0.15} metalness={0.9} />
      </mesh>
      <mesh position={[0, length, 0]} castShadow>
        <coneGeometry args={[0.02, 0.06, 4]} />
        <meshStandardMaterial color="#e2e8ee" roughness={0.15} metalness={0.9} />
      </mesh>
      <mesh castShadow>
        <boxGeometry args={[0.1, 0.03, 0.03]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.06, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.09, 8]} />
        <meshStandardMaterial color={LEATHER} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.12, 0]} castShadow>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
}

/* ---------- the six soldiers ---------- */

/** Pawn — legionary with gladius and scutum. */
function Legionary({ cloth, accent }: PartProps) {
  return (
    <group>
      <BareLeg x={-0.08} />
      <BareLeg x={0.08} />
      <RomanTorso cloth={cloth} accent={accent} />
      <Arm x={-0.19} raise={-0.5} cloth={cloth} />
      <Arm x={0.19} raise={-1.2} cloth={cloth} />
      <Head />
      <Galea />
      <Scutum cloth={cloth} accent={accent} position={[-0.22, 0.6, 0.32]} />
      <Gladius position={[0.24, 0.64, 0.3]} rotation={[0.9, 0, 0]} accent={accent} />
    </group>
  )
}

/** Knight — crested cavalry lancer with spear and cape. */
function Lancer({ cloth, accent }: PartProps) {
  return (
    <group>
      <BareLeg x={-0.08} forward={-0.25} />
      <BareLeg x={0.08} forward={0.15} />
      <RomanTorso cloth={cloth} accent={accent} />
      <Cape cloth={cloth} length={0.5} />
      <Arm x={-0.19} raise={-0.5} cloth={cloth} />
      <Arm x={0.19} raise={-1.5} cloth={cloth} />
      <Head />
      <Galea crest crestColor={CREST_RED} />
      {/* Hasta spear with pennant */}
      <group position={[0.25, 0.6, 0.12]} rotation={[-0.28, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.016, 0.022, 1.15, 8]} />
          <meshStandardMaterial color={LEATHER} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.64, 0]} castShadow>
          <coneGeometry args={[0.033, 0.14, 8]} />
          <meshStandardMaterial color="#e2e8ee" roughness={0.15} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.5, 0.05]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.14, 0.07, 0.012]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
      </group>
      <Scutum cloth={cloth} accent={accent} position={[-0.22, 0.6, 0.3]} height={0.45} />
    </group>
  )
}

/** Bishop — augur priest in robes with a blessed staff. */
function Augur({ cloth, accent }: PartProps) {
  return (
    <group>
      {/* Long robe */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.24, 0.55, 14]} />
        <meshStandardMaterial color={cloth} roughness={0.75} />
      </mesh>
      {/* Sash */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.145, 0.155, 0.06, 12]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.66, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 12]} />
        <meshStandardMaterial color={cloth} roughness={0.75} />
      </mesh>
      <Arm x={-0.18} raise={-0.9} cloth={cloth} />
      <Arm x={0.18} raise={-1.35} cloth={cloth} />
      <Head />
      {/* Hood */}
      <mesh position={[0, 1.0, -0.02]} castShadow>
        <sphereGeometry args={[0.125, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={cloth} roughness={0.8} />
      </mesh>
      <Laurel y={1.05} accent={accent} />
      {/* Staff with blessed orb */}
      <group position={[0.24, 0.55, 0.16]} rotation={[-0.1, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.024, 0.95, 8]} />
          <meshStandardMaterial color={LEATHER} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.53, 0]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
        </mesh>
      </group>
    </group>
  )
}

/** Rook — heavy wall-breaker behind a full-height scutum. */
function Bulwark({ cloth, accent }: PartProps) {
  return (
    <group>
      <BareLeg x={-0.1} />
      <BareLeg x={0.1} />
      <RomanTorso cloth={cloth} accent={accent} broad={1.3} />
      <Arm x={-0.24} raise={-0.9} spread={0.15} cloth={cloth} />
      <Arm x={0.24} raise={-0.9} spread={0.15} cloth={cloth} />
      <Head y={0.98} />
      <Galea crest crestColor={cloth} />
      {/* Full tower shield held front */}
      <Scutum cloth={cloth} accent={accent} position={[0, 0.55, 0.34]} height={0.78} />
    </group>
  )
}

/** Queen — laurel-crowned commander with raised gladius. */
function Warqueen({ cloth, accent }: PartProps) {
  return (
    <group>
      {/* Long battle gown */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.22, 0.6, 14]} />
        <meshStandardMaterial color={cloth} roughness={0.6} />
      </mesh>
      <RomanTorso cloth={cloth} accent={accent} broad={0.9} />
      <Cape cloth={accent} length={0.62} width={0.3} />
      <Arm x={-0.17} raise={-0.4} cloth={cloth} />
      <Arm x={0.17} raise={-2.3} cloth={cloth} />
      <Head />
      {/* Flowing hair */}
      <mesh position={[0, 0.95, -0.07]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.16, 0.3, 0.05]} />
        <meshStandardMaterial color="#4a3018" roughness={0.85} />
      </mesh>
      <Laurel y={1.06} accent={accent} />
      <Gladius position={[0.28, 1.02, 0.03]} rotation={[0, 0, -0.12]} length={0.5} accent={accent} />
    </group>
  )
}

/** King — the imperator: laurel, breastplate, cape, sword planted. */
function Imperator({ cloth, accent }: PartProps) {
  return (
    <group>
      <BareLeg x={-0.1} />
      <BareLeg x={0.1} />
      <RomanTorso cloth={cloth} accent={accent} broad={1.15} />
      <Cape cloth={cloth} length={0.68} width={0.42} />
      {/* Shoulder mantle */}
      <mesh position={[0, 0.82, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.22, 0.09, 12]} />
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.5} />
      </mesh>
      <Arm x={-0.22} raise={-1.05} spread={0.1} cloth={cloth} />
      <Arm x={0.22} raise={-1.05} spread={-0.1} cloth={cloth} />
      <Head y={1.0} />
      <Laurel y={1.13} accent={accent} />
      {/* Greatsword planted point-down */}
      <group position={[0, 0.18, 0.3]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.05, 0.7, 0.016]} />
          <meshStandardMaterial color="#e2e8ee" roughness={0.15} metalness={0.9} />
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
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      </group>
    </group>
  )
}

const WARRIOR: Record<PieceKind, (p: PartProps) => ReturnType<typeof Legionary>> = {
  pawn: Legionary,
  knight: Lancer,
  bishop: Augur,
  rook: Bulwark,
  queen: Warqueen,
  king: Imperator,
}

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
      // Marching: quick step-bounce with a slight sway.
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
      {/* Miniature grass base plate */}
      <mesh position={[0, 0.015, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[baseRadius, baseRadius * 1.12, 0.05, 20]} />
        <meshStandardMaterial color="#5d7a3a" roughness={0.8} />
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
