import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { BuildingId } from '../game/types'

/**
 * Travian-style village pieces: plaster-and-timber buildings with terracotta
 * roofs, a circular stone wall with towers and a gate, dirt roads, trees.
 */

export const PLASTER = '#efe2c4'
export const ROOF = '#b5502e'
export const ROOF_DARK = '#96401f'
export const WOOD = '#8a5a34'
export const STONE = '#a8a294'
export const STONE_DARK = '#8c8678'
export const DIRT = '#a5814f'
export const GRASS = '#79a844'

/* ---------- flora & terrain ---------- */

export function Tree({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.5, 8]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#4e7a2c" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.82, 0.05]} castShadow>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color="#5d8f36" roughness={0.9} />
      </mesh>
      <mesh position={[-0.15, 0.76, -0.06]} castShadow>
        <sphereGeometry args={[0.17, 10, 10]} />
        <meshStandardMaterial color="#578534" roughness={0.9} />
      </mesh>
    </group>
  )
}

export function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={[position[0], position[1] + 0.12 * scale, position[2]]} scale={scale} castShadow>
      <sphereGeometry args={[0.16, 8, 8]} />
      <meshStandardMaterial color="#5d8f36" roughness={0.95} />
    </mesh>
  )
}

export function Flowers({ position }: { position: [number, number, number] }) {
  const colors = ['#e0524a', '#e8c33c', '#e8e8e8']
  return (
    <group position={position}>
      {colors.map((c, i) => (
        <mesh key={i} position={[i * 0.09 - 0.09, 0.05, (i % 2) * 0.08]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={c} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- town wall ---------- */

function WallTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.9, 10]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.34, 0.14, 10]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.4, 0.42, 10]} />
        <meshStandardMaterial color={ROOF} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Circular stone wall with battlements, four towers and a south gate. */
export function TownWall({ radius = 5.4 }: { radius?: number }) {
  const segments = 36
  const gateHalf = 1.5 // segments skipped for the gate opening (south)

  const parts = useMemo(() => {
    const out: { x: number; z: number; angle: number; battlement: boolean }[] = []
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2
      // Gate faces the camera (positive z)
      const gateAngle = Math.PI / 2
      const diff = Math.abs(Math.atan2(Math.sin(a - gateAngle), Math.cos(a - gateAngle)))
      if (diff < (gateHalf / segments) * Math.PI * 2) continue
      out.push({
        x: Math.cos(a) * radius,
        z: Math.sin(a) * radius,
        angle: -a + Math.PI / 2,
        battlement: i % 2 === 0,
      })
    }
    return out
  }, [radius])

  const segLen = (2 * Math.PI * radius) / segments + 0.06

  return (
    <group>
      {parts.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.angle, 0]}>
          <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
            <boxGeometry args={[segLen, 0.64, 0.26]} />
            <meshStandardMaterial color={STONE} roughness={0.85} />
          </mesh>
          {p.battlement && (
            <mesh position={[0, 0.7, 0]} castShadow>
              <boxGeometry args={[segLen * 0.5, 0.14, 0.28]} />
              <meshStandardMaterial color={STONE_DARK} roughness={0.85} />
            </mesh>
          )}
        </group>
      ))}

      {/* Towers at the diagonals */}
      {[45, 135, 225, 315].map((deg) => {
        const a = (deg / 180) * Math.PI
        return <WallTower key={deg} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} />
      })}

      {/* Gatehouse (south, facing camera) */}
      <group position={[0, 0, radius]}>
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 0.5, 0]} castShadow>
            <boxGeometry args={[0.3, 1.0, 0.34]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[1.55, 0.22, 0.34]} />
          <meshStandardMaterial color={STONE} roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.32, 0]} castShadow>
          <coneGeometry args={[0.9, 0.4, 4]} />
          <meshStandardMaterial color={ROOF} roughness={0.7} />
        </mesh>
        {/* Open wooden doors */}
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0.42, 0.16]} rotation={[0, x > 0 ? -0.9 : 0.9, 0]} castShadow>
            <boxGeometry args={[0.42, 0.8, 0.05]} />
            <meshStandardMaterial color={WOOD} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------- building archetypes ---------- */

function GableRoof({
  width,
  depth,
  height = 0.34,
  y,
  color = ROOF,
}: {
  width: number
  depth: number
  height?: number
  y: number
  color?: string
}) {
  // A 4-sided cone squashed into a pyramid roof reads as terracotta from above.
  return (
    <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[Math.max(width, depth) * 0.78, height, 4]} />
      <meshStandardMaterial color={color} roughness={0.7} flatShading />
    </mesh>
  )
}

function HouseBody({
  width = 0.6,
  depth = 0.5,
  height = 0.4,
  color = PLASTER,
}: {
  width?: number
  depth?: number
  height?: number
  color?: string
}) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Door */}
      <mesh position={[0, height * 0.3, depth / 2 + 0.005]}>
        <boxGeometry args={[0.14, height * 0.55, 0.02]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      {/* Timber frame stripes */}
      {[-width / 2 + 0.05, width / 2 - 0.05].map((x) => (
        <mesh key={x} position={[x, height / 2, depth / 2 + 0.002]}>
          <boxGeometry args={[0.04, height, 0.015]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

function SimpleHouse() {
  return (
    <group>
      <HouseBody />
      <GableRoof width={0.66} depth={0.56} y={0.52} />
    </group>
  )
}

/** Throne — the keep: stone hall with a banner tower. */
function Keep({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.64, 0.7]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>
      <GableRoof width={0.9} depth={0.76} y={0.78} height={0.4} />
      {/* Tower */}
      <group position={[0.28, 0, -0.18]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.2, 1.2, 10]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.32, 0]} castShadow>
          <coneGeometry args={[0.22, 0.34, 10]} />
          <meshStandardMaterial color={ROOF_DARK} roughness={0.7} />
        </mesh>
        {/* Banner */}
        <mesh position={[0, 1.58, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
        <mesh position={[0.08, 1.62, 0]} castShadow>
          <boxGeometry args={[0.16, 0.1, 0.012]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
      </group>
      <mesh position={[0, 0.28, 0.36]}>
        <boxGeometry args={[0.2, 0.36, 0.02]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
    </group>
  )
}

/** Royal Court — classical colonnaded temple. */
function Temple() {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.16, 0.62]} />
        <meshStandardMaterial color="#d8d2c0" roughness={0.75} />
      </mesh>
      {[-0.28, -0.09, 0.09, 0.28].map((x) =>
        [-0.2, 0.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.38, z]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.44, 8]} />
            <meshStandardMaterial color="#e8e2d0" roughness={0.7} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.64, 0]} castShadow>
        <boxGeometry args={[0.84, 0.08, 0.66]} />
        <meshStandardMaterial color="#d8d2c0" roughness={0.75} />
      </mesh>
      <GableRoof width={0.8} depth={0.6} y={0.76} height={0.26} color="#c8b890" />
    </group>
  )
}

/** Grain field — golden crop rows. */
function GrainField() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.05, 0.75]} />
        <meshStandardMaterial color="#7a6034" roughness={0.95} />
      </mesh>
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]} castShadow>
          <boxGeometry args={[0.1, 0.12, 0.68]} />
          <meshStandardMaterial color="#d9b545" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** Timber yard — hut plus a stack of logs. */
function TimberYard() {
  return (
    <group>
      <group position={[-0.15, 0, -0.08]} scale={0.8}>
        <HouseBody />
        <GableRoof width={0.66} depth={0.56} y={0.52} color={ROOF_DARK} />
      </group>
      <group position={[0.32, 0, 0.18]} rotation={[0, 0.4, 0]}>
        {[
          [0, 0.07, 0],
          [0.11, 0.07, 0],
          [-0.11, 0.07, 0],
          [0.055, 0.17, 0],
          [-0.055, 0.17, 0],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.42, 8]} />
            <meshStandardMaterial color={WOOD} roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Ivory quarry — pale stone blocks and a lean-to. */
function Quarry() {
  return (
    <group>
      {[
        [0.18, 0.1, 0.14, 0.2],
        [-0.12, 0.08, 0.2, 0.16],
        [0.02, 0.22, 0.05, 0.13],
        [-0.24, 0.07, -0.12, 0.12],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, i, 0]} castShadow>
          <dodecahedronGeometry args={[s, 0]} />
          <meshStandardMaterial color="#e3dcc8" roughness={0.85} />
        </mesh>
      ))}
      <group position={[-0.15, 0, -0.2]} scale={0.65}>
        <HouseBody />
        <GableRoof width={0.66} depth={0.56} y={0.52} color="#8f7a4f" />
      </group>
    </group>
  )
}

/** Steel forge — hut with chimney and inner glow. */
function Forge() {
  return (
    <group>
      <HouseBody color="#cdbfa4" />
      <GableRoof width={0.66} depth={0.56} y={0.52} color="#6f6a60" />
      <mesh position={[0.2, 0.62, -0.1]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.12]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.85} />
      </mesh>
      {/* Ember glow at the door */}
      <mesh position={[0, 0.14, 0.27]}>
        <boxGeometry args={[0.12, 0.16, 0.02]} />
        <meshStandardMaterial color="#e8862a" emissive="#e8622a" emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

/** Warehouse / granary — barn with a silo. */
function Barn({ silo = false }: { silo?: boolean }) {
  return (
    <group>
      <group scale={[1.15, 0.95, 1.05]}>
        <HouseBody width={0.7} depth={0.55} color="#d8c49a" />
        <GableRoof width={0.76} depth={0.6} y={0.5} height={0.3} />
      </group>
      {silo && (
        <group position={[0.42, 0, -0.12]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.17, 0.6, 10]} />
            <meshStandardMaterial color={PLASTER} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.68, 0]} castShadow>
            <coneGeometry args={[0.19, 0.22, 10]} />
            <meshStandardMaterial color="#c8a052" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/** Military halls — long house with a banner. */
function MilitaryHall({ accent, fence = false }: { accent: string; fence?: boolean }) {
  return (
    <group>
      <HouseBody width={0.78} depth={0.5} height={0.42} color="#d3c2a0" />
      <GableRoof width={0.82} depth={0.56} y={0.56} height={0.32} color={ROOF_DARK} />
      {/* Banner post */}
      <mesh position={[0.44, 0.4, 0.2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.8, 6]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      <mesh position={[0.52, 0.68, 0.2]} castShadow>
        <boxGeometry args={[0.16, 0.11, 0.012]} />
        <meshStandardMaterial color={accent} roughness={0.6} />
      </mesh>
      {fence &&
        [-0.3, -0.1, 0.1, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.1, 0.42]} castShadow>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            <meshStandardMaterial color={WOOD} roughness={0.9} />
          </mesh>
        ))}
    </group>
  )
}

/** Siege works — workshop with a catapult in the yard. */
function SiegeWorks() {
  return (
    <group>
      <group position={[-0.18, 0, -0.1]} scale={0.85}>
        <HouseBody color="#cdbfa4" />
        <GableRoof width={0.66} depth={0.56} y={0.52} color={ROOF_DARK} />
      </group>
      {/* Catapult */}
      <group position={[0.32, 0, 0.2]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.2]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.22, 0]} rotation={[0, 0, 0.7]} castShadow>
          <boxGeometry args={[0.34, 0.05, 0.05]} />
          <meshStandardMaterial color={LEATHERISH} roughness={0.9} />
        </mesh>
        <mesh position={[0.16, 0.34, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}
const LEATHERISH = '#6f4a28'

/** Ramparts — a stout stone watchtower. */
function Watchtower() {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.3, 0.9, 10]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.26, 0.14, 10]} />
        <meshStandardMaterial color={STONE_DARK} roughness={0.85} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.24, 1.09, Math.sin(a) * 0.24]} castShadow>
            <boxGeometry args={[0.1, 0.12, 0.1]} />
            <meshStandardMaterial color={STONE_DARK} roughness={0.85} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Empty slot — a staked-out building plot. */
export function BuildingPlot() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.03, 14]} />
        <meshStandardMaterial color={DIRT} roughness={0.95} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        return (
          <mesh key={i} position={[Math.cos(a) * 0.32, 0.1, Math.sin(a) * 0.32]} castShadow>
            <boxGeometry args={[0.04, 0.18, 0.04]} />
            <meshStandardMaterial color={WOOD} roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Wooden scaffold shown while a building is under construction. */
function Scaffold() {
  return (
    <group>
      {[-0.36, 0.36].map((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.35, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
            <meshStandardMaterial color={WOOD} roughness={0.9} />
          </mesh>
        )),
      )}
      {[-0.3, 0.3].map((z) => (
        <mesh key={z} position={[0, 0.6, z]} castShadow>
          <boxGeometry args={[0.78, 0.035, 0.035]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export function BuildingModel({
  buildingId,
  level,
  accent = '#c23b2e',
  constructing = false,
}: {
  buildingId: BuildingId
  level: number
  accent?: string
  constructing?: boolean
}) {
  const ref = useRef<Group>(null)
  const scale = 0.72 + Math.min(level, 10) * 0.045

  useFrame(({ clock }) => {
    if (!ref.current || !constructing) return
    // Gentle "being built" pulse.
    ref.current.scale.setScalar(scale * (1 + Math.sin(clock.elapsedTime * 5) * 0.02))
  })

  const body = useMemo(() => {
    switch (buildingId) {
      case 'throne':
        return <Keep accent={accent} />
      case 'royalCourt':
        return <Temple />
      case 'grainField':
        return <GrainField />
      case 'timberYard':
        return <TimberYard />
      case 'ivoryQuarry':
        return <Quarry />
      case 'steelForge':
        return <Forge />
      case 'warehouse':
        return <Barn />
      case 'granary':
        return <Barn silo />
      case 'barracks':
        return <MilitaryHall accent={accent} />
      case 'stable':
        return <MilitaryHall accent={accent} fence />
      case 'siegeWorks':
        return <SiegeWorks />
      case 'ramparts':
        return <Watchtower />
      default:
        return <SimpleHouse />
    }
  }, [buildingId, accent])

  return (
    <group ref={ref} scale={scale}>
      {body}
      {constructing && <Scaffold />}
    </group>
  )
}
