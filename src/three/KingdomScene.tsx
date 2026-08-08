import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, Text } from '@react-three/drei'
import { BUILDINGS } from '../game/constants'
import type { BuildingId, Village } from '../game/types'
import { Character } from './Character'
import { Atmosphere } from './Effects'
import { SceneLights } from './SceneLights'
import {
  BuildingModel,
  BuildingPlot,
  Bush,
  Flowers,
  GRASS,
  DIRT,
  TownWall,
  Tree,
} from './Village'

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

const TREES: [number, number, number][] = [
  [-6.6, 0, -3.4],
  [6.9, 0, -2.2],
  [-7.2, 0, 1.8],
  [6.4, 0, 3.6],
  [-4.5, 0, -6.2],
  [4.2, 0, -6.7],
  [-3.2, 0, 6.9],
  [2.4, 0, 7.3],
  [7.4, 0, 0.6],
  [-6.2, 0, 4.4],
  [1.2, 0, -7.5],
  [-1.6, 0, -7.1],
]

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
  const [x, z] = SLOT_LAYOUT[index] ?? [0, 0]
  const def = BUILDINGS[buildingId]

  return (
    <group position={[x, 0, z]}>
      {/* Clickable lot */}
      <mesh
        receiveShadow
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
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
        <circleGeometry args={[0.58, 20]} />
        <meshStandardMaterial
          color={selected ? '#c8b26a' : level > 0 || constructing ? '#8fae56' : DIRT}
          roughness={0.9}
        />
      </mesh>

      <group
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {level > 0 || constructing ? (
          <BuildingModel buildingId={buildingId} level={Math.max(level, 1)} constructing={constructing} />
        ) : (
          <BuildingPlot />
        )}
      </group>

      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.6, 0.72, 32]} />
          <meshBasicMaterial color="#c9a227" transparent opacity={0.9} />
        </mesh>
      )}

      <Text
        position={[0, 1.35, 0]}
        fontSize={0.17}
        color={selected ? '#7a5a10' : '#3d3020'}
        anchorX="center"
        outlineWidth={0.016}
        outlineColor="#f5ecd8"
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
      {/* Countryside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <circleGeometry args={[16, 48]} />
        <meshStandardMaterial color="#6c9a3e" roughness={0.95} />
      </mesh>
      {/* Village green inside the wall */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[5.5, 48]} />
        <meshStandardMaterial color={GRASS} roughness={0.9} />
      </mesh>
      {/* Ring road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <ringGeometry args={[3.95, 4.55, 48]} />
        <meshStandardMaterial color={DIRT} roughness={0.95} />
      </mesh>
      {/* Plaza around the keep */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <circleGeometry args={[1.05, 24]} />
        <meshStandardMaterial color={DIRT} roughness={0.95} />
      </mesh>
      {/* Radial paths from plaza to ring road */}
      {[0, 90, 180, 270].map((deg) => (
        <mesh
          key={deg}
          rotation={[-Math.PI / 2, 0, (deg / 180) * Math.PI]}
          position={[0, -0.035, 0]}
          receiveShadow
        >
          <planeGeometry args={[0.5, 8.6]} />
          <meshStandardMaterial color={DIRT} roughness={0.95} />
        </mesh>
      ))}
      {/* Road out the gate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 8]} receiveShadow>
        <planeGeometry args={[0.9, 6]} />
        <meshStandardMaterial color="#b08a55" roughness={0.95} />
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
      <Atmosphere emberCount={30} emberArea={12} />
      <Ground />
      <TownWall radius={5.4} />
      {markers}

      {TREES.map((p, i) => (
        <Tree key={i} position={p} scale={0.9 + (i % 3) * 0.25} />
      ))}
      <Bush position={[3.6, 0, 3.4]} />
      <Bush position={[-3.7, 0, 3.1]} scale={1.3} />
      <Bush position={[3.4, 0, -3.4]} scale={0.9} />
      <Flowers position={[1.6, 0, 1.4]} />
      <Flowers position={[-1.7, 0, 1.2]} />
      <Flowers position={[1.3, 0, -1.6]} />

      {/* Citizens — more villagers as the settlement grows */}
      <Character role="knight" position={[0.9, 0, 1.2]} rotation={-2.2} scale={0.62} />
      <Character
        role="villager"
        position={[0, 0, 0]}
        patrolRadius={4.25}
        patrolSpeed={0.3}
        scale={0.56}
      />
      {population > 60 && (
        <Character
          role="villager"
          position={[0, 0, 0]}
          patrolRadius={2.6}
          patrolSpeed={-0.24}
          patrolPhase={40}
          scale={0.56}
          cloth="#4a6a3d"
        />
      )}
      {population > 120 && (
        <Character role="mage" position={[-1.1, 0, 1.3]} rotation={2.1} scale={0.6} />
      )}

      <ContactShadows position={[0, -0.02, 0]} opacity={0.35} scale={18} blur={2.6} far={10} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={1.25}
        minDistance={7}
        maxDistance={18}
        target={[0, 0.3, 0]}
      />
    </>
  )
}

export function KingdomScene(props: KingdomSceneProps) {
  return (
    <div className="scene-frame scene-frame--kingdom">
      <Canvas
        shadows="percentage"
        camera={{ position: [8, 9, 10], fov: 40, near: 0.1, far: 80 }}
        dpr={[1, 1.75]}
      >
        <Suspense fallback={null}>
          <KingdomWorld {...props} />
        </Suspense>
      </Canvas>
      <div className="scene-hint">Click a building to inspect · Drag to orbit</div>
    </div>
  )
}
