import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { Group, PointLight } from 'three'

/** Flickering torch-like light — braziers, forges. */
export function TorchLight({
  position,
  color = '#e8a24a',
  intensity = 0.9,
  distance = 5,
}: {
  position: [number, number, number]
  color?: string
  intensity?: number
  distance?: number
}) {
  const ref = useRef<PointLight>(null)
  const seed = useRef(Math.random() * 100)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + seed.current
    ref.current.intensity =
      intensity * (0.85 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.07)
  })

  return <pointLight ref={ref} position={position} color={color} distance={distance} decay={2} />
}

/** A lazy drifting cloud made of soft overlapping puffs. */
function DriftingCloud({
  position,
  scale = 1,
  speed = 0.14,
}: {
  position: [number, number, number]
  scale?: number
  speed?: number
}) {
  const ref = useRef<Group>(null)
  const seed = useRef(Math.random() * 40)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * speed + seed.current
    ref.current.position.x = position[0] + Math.sin(t) * 6
    ref.current.position.z = position[2] + Math.cos(t * 0.6) * 3
  })

  const puffs: [number, number, number, number][] = [
    [0, 0, 0, 1.1],
    [1.2, 0.15, 0.3, 0.85],
    [-1.1, 0.1, -0.2, 0.8],
    [0.4, 0.4, -0.4, 0.7],
    [-0.5, 0.35, 0.5, 0.65],
  ]

  return (
    <group ref={ref} position={position} scale={scale}>
      {puffs.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[s, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/** Daylight atmosphere: drifting clouds, floating pollen and butterflies of light. */
export function Atmosphere({
  emberCount = 40,
  emberArea = 14,
  fireflies = true,
  clouds = true,
}: {
  emberCount?: number
  emberArea?: number
  fireflies?: boolean
  clouds?: boolean
}) {
  return (
    <>
      {clouds && (
        <>
          <DriftingCloud position={[-8, 9, -6]} scale={1.3} />
          <DriftingCloud position={[7, 11, -9]} scale={1.7} speed={0.1} />
          <DriftingCloud position={[2, 10, 7]} scale={1.1} speed={0.18} />
        </>
      )}
      {/* Sunlit pollen drifting over the field */}
      <Sparkles
        count={emberCount}
        size={1.8}
        speed={0.25}
        opacity={0.5}
        scale={[emberArea, 4, emberArea]}
        position={[0, 2, 0]}
        color="#fff4c0"
      />
      {fireflies && (
        <Sparkles
          count={18}
          size={3.2}
          speed={0.14}
          opacity={0.35}
          scale={[emberArea * 0.7, 2, emberArea * 0.7]}
          position={[0, 0.8, 0]}
          color="#eaffb0"
        />
      )}
    </>
  )
}
