import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import type { PointLight } from 'three'

/** Flickering torch-like light for a warm, alive feel. */
export function TorchLight({
  position,
  color = '#e8a24a',
  intensity = 1.1,
  distance = 6,
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

/** Night-sky and drifting ember atmosphere shared by the game scenes. */
export function Atmosphere({
  emberCount = 60,
  emberArea = 14,
  fireflies = true,
}: {
  emberCount?: number
  emberArea?: number
  fireflies?: boolean
}) {
  return (
    <>
      <Stars radius={70} depth={30} count={1600} factor={3} saturation={0} fade speed={0.6} />
      <Sparkles
        count={emberCount}
        size={2.2}
        speed={0.35}
        opacity={0.55}
        scale={[emberArea, 5, emberArea]}
        position={[0, 2.2, 0]}
        color="#e0bc45"
      />
      {fireflies && (
        <Sparkles
          count={26}
          size={4}
          speed={0.18}
          opacity={0.4}
          scale={[emberArea * 0.7, 2.5, emberArea * 0.7]}
          position={[0, 1, 0]}
          color="#8fd0a0"
        />
      )}
    </>
  )
}
