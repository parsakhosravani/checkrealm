export function SceneLights() {
  return (
    <>
      <color attach="background" args={['#9fc7dd']} />
      <fog attach="fog" args={['#b6d3c9', 24, 55]} />
      <ambientLight intensity={0.95} color="#fff6e0" />
      <hemisphereLight args={['#cfe6f5', '#6f9c4e', 0.7]} />
      <directionalLight
        castShadow
        position={[10, 16, 7]}
        intensity={2.1}
        color="#fff3d6"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={45}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.35} color="#cfe0f0" />
    </>
  )
}
