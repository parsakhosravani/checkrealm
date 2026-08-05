import { Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls, Text } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'
import { BUILDINGS } from '../game/constants'
import type { BuildingId, Village } from '../game/types'
import { Character } from './Character'
import { ChessPiece, type PieceKind } from './ChessPiece'
import { Atmosphere, TorchLight } from './Effects'
import { SceneLights } from './SceneLights'

interface KingdomSceneProps {
  village: Village
  selectedSlot: number | null
  onSelectSlot: (index: number) => void
}

const SLOT_LAYOUT: [number, number][] = [
  [0, 0], // throne center
  [-2.2, -2.2],
  [-0.7, -2.2],
  [0.7, -2.2],
  [2.2, -2.2],
  [-2.2, -0.7],
  [-0.7, -0.7],
  [0.7, -0.7],
  [2.2, -0.7],
  [-2.2, 0.7],
  [-0.7, 0.7],
  [0.7, 0.7],
  [2.2, 0.7],
  [-2.6, 2.2],
  [-1.55, 2.2],
  [-0.5, 2.2],
  [0.5, 2.2],
  [1.55, 2.2],
  [2.6, 2.2],
  [-3.4, 0],
  [3.4, 0],
  [-3.2, -1.5],
  [3.2, -1.5],
  [-3.2, 1.5],
  [3.2, 1.5],
  [0, 3.2],
]

function buildingPiece(id: BuildingId): PieceKind {
  switch (id) {
    case 'throne':
      return 'king'
    case 'barracks':
      return 'pawn'
    case 'stable':
      return 'knight'
    case 'siegeWorks':
      return 'rook'
    case 'royalCourt':
      return 'queen'
    case 'ramparts':
      return 'rook'
    case 'ivoryQuarry':
      return 'bishop'
    case 'steelForge':
      return 'knight'
    case 'grainField':
      return 'pawn'
    default:
      return 'bishop'
  }
}

function BuildingMarker({
  index,
  buildingId,
  level,
  selected,
  constructing,
  onSelect,
}: {
  index: number
  buildingId: BuildingId
  level: number
  selected: boolean
  constructing: boolean
  onSelect: () => void
}) {
  const ref = useRef<Group>(null)
  const [x, z] = SLOT_LAYOUT[index] ?? [0, 0]
  const def = BUILDINGS[buildingId]
  const scale = 0.45 + level * 0.08
  const color = level === 0 ? '#4a5548' : index % 2 === 0 ? '#f0e6d2' : '#2a2420'
  const accent = level === 0 ? '#6a7568' : '#c9a227'

  useFrame(({ clock }) => {
    if (!ref.current || !constructing) return
    ref.current.rotation.y = clock.elapsedTime * 1.2
  })

  return (
    <group ref={ref} position={[x, 0, z]}>
      {/* Pedestal */}
      <mesh
        receiveShadow
        position={[0, -0.02, 0]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <cylinderGeometry args={[0.55, 0.62, 0.1, 16]} />
        <meshStandardMaterial
          color={selected ? '#3d6b4f' : '#1a3026'}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {level > 0 || constructing ? (
        <ChessPiece
          kind={buildingPiece(buildingId)}
          color={color}
          accent={accent}
          position={[0, 0.05, 0]}
          scale={scale}
          selected={selected}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        />
      ) : (
        <mesh
          position={[0, 0.15, 0]}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <boxGeometry args={[0.35, 0.2, 0.35]} />
          <meshStandardMaterial color="#3a453c" roughness={0.8} transparent opacity={0.7} />
        </mesh>
      )}
      <Text
        position={[0, 1.35 * Math.max(scale, 0.5), 0]}
        fontSize={0.16}
        color={selected ? '#e0bc45' : '#cbbfa8'}
        anchorX="center"
        outlineWidth={0.015}
        outlineColor="#0a100d"
      >
        {def.name.split(' ')[0]}
        {level > 0 ? ` ${level}` : ''}
      </Text>
    </group>
  )
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <circleGeometry args={[7.5, 64]} />
        <meshStandardMaterial color="#14261c" roughness={0.9} />
      </mesh>
      {/* Inner checkered plaza */}
      {Array.from({ length: 49 }, (_, i) => {
        const x = (i % 7) - 3
        const z = Math.floor(i / 7) - 3
        const light = (x + z) % 2 === 0
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x * 1.05, -0.05, z * 1.05]}
            receiveShadow
          >
            <planeGeometry args={[1.0, 1.0]} />
            <meshStandardMaterial
              color={light ? '#2a4535' : '#1a3026'}
              roughness={0.85}
            />
          </mesh>
        )
      })}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[8.2, 8.6, 0.5, 48]} />
        <meshStandardMaterial color="#1a1510" roughness={0.7} metalness={0.15} />
      </mesh>
    </group>
  )
}

function KingdomWorld({ village, selectedSlot, onSelectSlot }: KingdomSceneProps) {
  const markers = useMemo(
    () =>
      village.slots.map((slot, index) => {
        if (!slot.buildingId) return null
        return (
          <BuildingMarker
            key={index}
            index={index}
            buildingId={slot.buildingId}
            level={slot.level}
            selected={selectedSlot === index}
            constructing={village.construction?.slotIndex === index}
            onSelect={() => onSelectSlot(index)}
          />
        )
      }),
    [village, selectedSlot, onSelectSlot],
  )

  const population = village.population

  return (
    <>
      <SceneLights />
      <Atmosphere emberCount={50} emberArea={13} />
      <TorchLight position={[-2.5, 1.6, 2.5]} />
      <TorchLight position={[2.5, 1.6, -2.5]} color="#c9a227" />
      <Ground />
      {markers}

      {/* Citizens of the realm — more villagers as the kingdom grows */}
      <Character role="knight" position={[0.9, 0, 1.1]} rotation={-2.2} scale={0.72} />
      <Character
        role="villager"
        position={[0, 0, 0]}
        patrolRadius={4.6}
        patrolSpeed={0.3}
        scale={0.62}
      />
      {population > 60 && (
        <Character
          role="villager"
          position={[0, 0, 0]}
          patrolRadius={5.4}
          patrolSpeed={-0.24}
          patrolPhase={40}
          scale={0.62}
          cloth="#4a5c3d"
        />
      )}
      {population > 120 && (
        <Character role="mage" position={[-1.1, 0, 1.3]} rotation={2.1} scale={0.7} />
      )}

      <ContactShadows position={[0, -0.06, 0]} opacity={0.5} scale={16} blur={2.8} far={10} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.4}
        maxPolarAngle={1.3}
        minDistance={6}
        maxDistance={16}
        target={[0, 0.4, 0]}
      />
    </>
  )
}

export function KingdomScene(props: KingdomSceneProps) {
  return (
    <div className="scene-frame scene-frame--kingdom">
      <Canvas
        shadows="percentage"
        camera={{ position: [7, 8, 9], fov: 40, near: 0.1, far: 60 }}
        dpr={[1, 1.75]}
      >
        <Suspense fallback={null}>
          <KingdomWorld {...props} />
        </Suspense>
      </Canvas>
      <div className="scene-hint">Click a structure to inspect · Drag to orbit</div>
    </div>
  )
}
