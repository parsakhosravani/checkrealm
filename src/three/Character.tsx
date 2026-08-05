import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

export type CharacterRole = 'knight' | 'mage' | 'villager'
export type CharacterAnimation = 'idle' | 'walk' | 'cheer'

interface CharacterProps {
  role?: CharacterRole
  animation?: CharacterAnimation
  position?: [number, number, number]
  rotation?: number
  scale?: number
  skin?: string
  cloth?: string
  accent?: string
  /** Walk in a circle around `position` with this radius. */
  patrolRadius?: number
  patrolSpeed?: number
  patrolPhase?: number
}

const ROLE_DEFAULTS: Record<CharacterRole, { cloth: string; accent: string }> = {
  knight: { cloth: '#3d4a5c', accent: '#c9a227' },
  mage: { cloth: '#43305c', accent: '#8f6fd0' },
  villager: { cloth: '#5c4a32', accent: '#8a9a6a' },
}

function Limb({
  limbRef,
  position,
  size,
  color,
}: {
  limbRef: RefObject<Group | null>
  position: [number, number, number]
  size: [number, number, number]
  color: string
}) {
  return (
    <group ref={limbRef} position={position}>
      <mesh position={[0, -size[1] / 2, 0]} castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>
    </group>
  )
}

/**
 * A procedural low-poly hero: articulated head, torso, arms and legs with
 * idle / walk / cheer animations. Role changes the gear (helmet & sword,
 * wizard hat & staff, or a hood).
 */
export function Character({
  role = 'villager',
  animation = 'idle',
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  skin = '#d9a97c',
  cloth,
  accent,
  patrolRadius = 0,
  patrolSpeed = 0.5,
  patrolPhase = 0,
}: CharacterProps) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)

  const clothColor = cloth ?? ROLE_DEFAULTS[role].cloth
  const accentColor = accent ?? ROLE_DEFAULTS[role].accent

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + patrolPhase
    if (!root.current || !body.current) return

    const walking = animation === 'walk' || patrolRadius > 0
    const swing = walking ? Math.sin(t * 5) * 0.65 : Math.sin(t * 1.6) * 0.06

    if (armL.current && armR.current && legL.current && legR.current) {
      if (animation === 'cheer') {
        const lift = Math.PI - 0.3 + Math.sin(t * 6) * 0.25
        armL.current.rotation.x = lift
        armR.current.rotation.x = lift
        legL.current.rotation.x = 0
        legR.current.rotation.x = 0
        body.current.position.y = Math.abs(Math.sin(t * 6)) * 0.08
      } else {
        armL.current.rotation.x = swing
        armR.current.rotation.x = -swing
        legL.current.rotation.x = -swing * 0.85
        legR.current.rotation.x = swing * 0.85
        body.current.position.y = walking
          ? Math.abs(Math.sin(t * 5)) * 0.04
          : Math.sin(t * 1.6) * 0.02
      }
    }

    if (patrolRadius > 0) {
      const a = t * patrolSpeed
      root.current.position.x = position[0] + Math.cos(a) * patrolRadius
      root.current.position.z = position[2] + Math.sin(a) * patrolRadius
      root.current.rotation.y = -a - Math.PI / 2
    }
  })

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]} scale={scale}>
      <group ref={body}>
        {/* Torso */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[0.34, 0.42, 0.2]} />
          <meshStandardMaterial color={clothColor} roughness={0.55} metalness={role === 'knight' ? 0.35 : 0.05} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.36, 0.06, 0.22]} />
          <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.98, 0]} castShadow>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>

        {role === 'knight' && (
          <group>
            {/* Helmet */}
            <mesh position={[0, 1.02, 0]} castShadow>
              <sphereGeometry args={[0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color="#9aa5b5" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[0, 1.16, 0]} castShadow>
              <coneGeometry args={[0.04, 0.14, 8]} />
              <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.5} />
            </mesh>
            {/* Pauldrons */}
            {[-0.22, 0.22].map((x) => (
              <mesh key={x} position={[x, 0.8, 0]} castShadow>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshStandardMaterial color="#9aa5b5" roughness={0.35} metalness={0.6} />
              </mesh>
            ))}
          </group>
        )}

        {role === 'mage' && (
          <group>
            {/* Wizard hat */}
            <mesh position={[0, 1.12, 0]} castShadow>
              <cylinderGeometry args={[0.19, 0.19, 0.03, 16]} />
              <meshStandardMaterial color={clothColor} roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.24, 0]} castShadow>
              <coneGeometry args={[0.13, 0.26, 16]} />
              <meshStandardMaterial color={clothColor} roughness={0.6} />
            </mesh>
          </group>
        )}

        {role === 'villager' && (
          <mesh position={[0, 1.06, -0.02]} castShadow>
            <sphereGeometry args={[0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#6a5138" roughness={0.8} />
          </mesh>
        )}

        {/* Arms */}
        <Limb
          limbRef={armL}
          position={[-0.24, 0.8, 0]}
          size={[0.09, 0.36, 0.09]}
          color={clothColor}
        />
        <Limb
          limbRef={armR}
          position={[0.24, 0.8, 0]}
          size={[0.09, 0.36, 0.09]}
          color={clothColor}
        />

        {/* Gear held in the right hand */}
        {role === 'knight' && (
          <group position={[0.3, 0.45, 0.08]} rotation={[0.35, 0, -0.15]}>
            <mesh castShadow>
              <boxGeometry args={[0.03, 0.42, 0.03]} />
              <meshStandardMaterial color="#c8d2dc" roughness={0.2} metalness={0.85} />
            </mesh>
            <mesh position={[0, -0.2, 0]} castShadow>
              <boxGeometry args={[0.12, 0.03, 0.045]} />
              <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        )}
        {role === 'mage' && (
          <group position={[0.3, 0.55, 0.06]} rotation={[0.1, 0, -0.08]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.022, 0.028, 0.85, 8]} />
              <meshStandardMaterial color="#5c4630" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.48, 0]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial
                color={accentColor}
                emissive={accentColor}
                emissiveIntensity={1.4}
              />
            </mesh>
            <pointLight position={[0, 0.48, 0]} intensity={0.6} distance={2.2} color={accentColor} />
          </group>
        )}

        {/* Legs */}
        <Limb
          limbRef={legL}
          position={[-0.09, 0.42, 0]}
          size={[0.11, 0.4, 0.11]}
          color="#2c2620"
        />
        <Limb
          limbRef={legR}
          position={[0.09, 0.42, 0]}
          size={[0.11, 0.4, 0.11]}
          color="#2c2620"
        />
      </group>
    </group>
  )
}
