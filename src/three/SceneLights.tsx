export function SceneLights() {
  return (
    <>
      <color attach="background" args={['#0a1410']} />
      <fog attach="fog" args={['#0a1410', 18, 42]} />
      <ambientLight intensity={0.85} color="#c8d5c4" />
      <hemisphereLight args={['#dfe8dc', '#1a3026', 0.55]} />
      <directionalLight
        castShadow
        position={[8, 14, 6]}
        intensity={1.9}
        color="#fff2d0"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <pointLight position={[-6, 6, -4]} intensity={0.45} color="#6fa88a" />
      <pointLight position={[4, 3, 8]} intensity={0.35} color="#c9a227" />
    </>
  )
}
