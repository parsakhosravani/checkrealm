import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { UnitId } from '../game/types'

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

function PawnMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 0.4, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.68, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.35} />
      </mesh>
    </group>
  )
}

function RookMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.55, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.5]} />
        <meshStandardMaterial color={accent} roughness={0.35} metalness={0.3} />
      </mesh>
      {([-0.16, 0.16] as const).map((x) =>
        ([-0.16, 0.16] as const).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.98, z]} castShadow>
            <boxGeometry args={[0.12, 0.16, 0.12]} />
            <meshStandardMaterial color={accent} roughness={0.35} metalness={0.3} />
          </mesh>
        )),
      )}
    </group>
  )
}

function KnightMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.36, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 0.4, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0.08, 0.72, 0]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.38, 0.28, 0.22]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.35} />
      </mesh>
      <mesh position={[0.22, 0.82, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.35} />
      </mesh>
    </group>
  )
}

function BishopMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.2, 0.55, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.35} />
      </mesh>
      <mesh position={[0, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={accent} roughness={0.25} metalness={0.45} />
      </mesh>
    </group>
  )
}

function QueenMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.26, 0.6, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.92, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.2, 0.2, 8]} />
        <meshStandardMaterial color={accent} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.12, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}

function KingMesh({ color, accent }: { color: string; accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.4, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.28, 0.7, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.14, 16]} />
        <meshStandardMaterial color={accent} roughness={0.25} metalness={0.55} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 1.28, 0]} castShadow>
        <boxGeometry args={[0.22, 0.08, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

const MESH: Record<PieceKind, typeof PawnMesh> = {
  pawn: PawnMesh,
  rook: RookMesh,
  knight: KnightMesh,
  bishop: BishopMesh,
  queen: QueenMesh,
  king: KingMesh,
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
  const accentColor = accent ?? color
  const Body = useMemo(() => MESH[kind], [kind])

  useFrame(({ clock }) => {
    if (!ref.current) return
    if (bob) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.6) * 0.08
      ref.current.rotation.y = clock.elapsedTime * 0.35
    }
    if (selected) {
      ref.current.position.y = position[1] + 0.12 + Math.sin(clock.elapsedTime * 4) * 0.04
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
      <Body color={color} accent={accentColor} />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.45, 0.58, 32]} />
          <meshBasicMaterial color="#c9a227" transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  )
}
