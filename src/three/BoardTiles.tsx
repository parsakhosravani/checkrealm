import { MAP_SIZE } from '../game/constants'

const TILE = 1.15
const GAP = 0.04
const STEP = TILE + GAP
const HALF = ((MAP_SIZE - 1) * STEP) / 2

export function boardToWorld(x: number, y: number): [number, number, number] {
  return [x * STEP - HALF, 0, y * STEP - HALF]
}

export function BoardTiles({
  onTileClick,
  highlight,
}: {
  onTileClick?: (x: number, y: number) => void
  highlight?: { x: number; y: number } | null
}) {
  const tiles = []
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const light = (x + y) % 2 === 0
      const [wx, , wz] = boardToWorld(x, y)
      const isHi = highlight?.x === x && highlight?.y === y
      tiles.push(
        <group key={`${x}-${y}`} position={[wx, 0, wz]}>
          <mesh
            receiveShadow
            position={[0, -0.06, 0]}
            onClick={(e) => {
              e.stopPropagation()
              onTileClick?.(x, y)
            }}
            onPointerOver={() => {
              if (onTileClick) document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default'
            }}
          >
            <boxGeometry args={[TILE, 0.12, TILE]} />
            <meshStandardMaterial
              color={isHi ? '#3d6b4f' : light ? '#2f5240' : '#1a3026'}
              roughness={0.75}
              metalness={0.05}
            />
          </mesh>
          {isHi && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[TILE * 0.92, TILE * 0.92]} />
              <meshBasicMaterial color="#c9a227" transparent opacity={0.22} />
            </mesh>
          )}
        </group>,
      )
    }
  }

  return (
    <group>
      {/* Board plinth */}
      <mesh receiveShadow position={[0, -0.22, 0]}>
        <boxGeometry args={[MAP_SIZE * STEP + 0.8, 0.28, MAP_SIZE * STEP + 0.8]} />
        <meshStandardMaterial color="#1a1510" roughness={0.65} metalness={0.15} />
      </mesh>
      <mesh receiveShadow position={[0, -0.08, 0]}>
        <boxGeometry args={[MAP_SIZE * STEP + 0.35, 0.08, MAP_SIZE * STEP + 0.35]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.55} metalness={0.2} />
      </mesh>
      {tiles}
    </group>
  )
}

export { TILE, STEP, HALF }
