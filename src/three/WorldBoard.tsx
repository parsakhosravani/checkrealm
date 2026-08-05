import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, Text } from '@react-three/drei'
import { MAP_SIZE } from '../game/constants'
import type { GameState, Village } from '../game/types'
import { BoardTiles, boardToWorld } from './BoardTiles'
import { ChessPiece } from './ChessPiece'
import { Atmosphere } from './Effects'
import { SceneLights } from './SceneLights'

interface WorldBoardProps {
  state: GameState
  selectedId: string | null
  onSelectVillage: (villageId: string) => void
}

function MarchMarkers({ state }: { state: GameState }) {
  return (
    <>
      {state.marches.map((m) => {
        const from = state.villages.find((v) => v.id === m.fromVillageId)
        const to = state.villages.find((v) => v.id === m.toVillageId)
        if (!from || !to) return null
        const progress = Math.min(
          1,
          Math.max(0, (Date.now() - m.departsAt) / (m.arrivesAt - m.departsAt)),
        )
        const [fx, , fz] = boardToWorld(from.x, from.y)
        const [tx, , tz] = boardToWorld(to.x, to.y)
        const x = fx + (tx - fx) * progress
        const z = fz + (tz - fz) * progress
        return (
          <ChessPiece
            key={m.id}
            kind="knight"
            color={m.kind === 'return' ? '#c9a227' : '#b54a3a'}
            accent="#f0e6d2"
            position={[x, 0.05, z]}
            scale={0.55}
            bob
          />
        )
      })}
    </>
  )
}

function KingdomMarker({
  village,
  color,
  isHuman,
  selected,
  onSelect,
}: {
  village: Village
  color: string
  isHuman: boolean
  selected: boolean
  onSelect: () => void
}) {
  const [x, , z] = boardToWorld(village.x, village.y)
  const level = village.slots.reduce((s, sl) => s + sl.level, 0)
  const scale = 0.85 + Math.min(0.45, level * 0.015)

  return (
    <group>
      <ChessPiece
        kind={isHuman ? 'king' : 'rook'}
        color={isHuman ? '#f0e6d2' : '#2a2420'}
        accent={color}
        position={[x, 0.02, z]}
        scale={scale}
        selected={selected}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      />
      <Text
        position={[x, 1.55 * scale, z]}
        fontSize={0.22}
        color="#f0e6d2"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0a100d"
      >
        {village.name.split(' ')[0]}
      </Text>
    </group>
  )
}

function WorldScene({ state, selectedId, onSelectVillage }: WorldBoardProps) {
  const selected = state.villages.find((v) => v.id === selectedId) ?? null
  const highlight = selected ? { x: selected.x, y: selected.y } : null

  const markers = useMemo(
    () =>
      state.villages.map((v) => {
        const player = state.players.find((p) => p.id === v.ownerId)!
        return (
          <KingdomMarker
            key={v.id}
            village={v}
            color={player.color}
            isHuman={v.ownerId === state.humanPlayerId}
            selected={v.id === selectedId}
            onSelect={() => onSelectVillage(v.id)}
          />
        )
      }),
    [state, selectedId, onSelectVillage],
  )

  return (
    <>
      <SceneLights />
      <Atmosphere emberCount={70} emberArea={20} fireflies={false} />
      <BoardTiles
        highlight={highlight}
        onTileClick={(x, y) => {
          const v = state.villages.find((vil) => vil.x === x && vil.y === y)
          if (v) onSelectVillage(v.id)
        }}
      />
      {markers}
      <MarchMarkers state={state} />
      <ContactShadows
        position={[0, -0.35, 0]}
        opacity={0.45}
        scale={MAP_SIZE * 2.2}
        blur={2.5}
        far={8}
      />
      <OrbitControls
        makeDefault
        enablePan
        minPolarAngle={0.35}
        maxPolarAngle={1.25}
        minDistance={8}
        maxDistance={22}
        target={[0, 0, 0]}
      />
    </>
  )
}

export function WorldBoard(props: WorldBoardProps) {
  return (
    <div className="scene-frame">
      <Canvas
        shadows="percentage"
        camera={{ position: [9, 11, 12], fov: 42, near: 0.1, far: 80 }}
        dpr={[1, 1.75]}
      >
        <Suspense fallback={null}>
          <WorldScene {...props} />
        </Suspense>
      </Canvas>
      <div className="scene-hint">Drag to orbit · Scroll to zoom · Click a keep to select</div>
    </div>
  )
}
