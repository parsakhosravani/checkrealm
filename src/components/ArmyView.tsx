import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Float, OrbitControls } from '@react-three/drei'
import { RESOURCE_META, UNITS } from '../game/constants'
import {
  canAfford,
  formatDuration,
  formatNumber,
  getBuildingLevel,
} from '../game/engine'
import type { Resources, UnitId, Village } from '../game/types'
import { ChessPiece } from '../three/ChessPiece'
import { SceneLights } from '../three/SceneLights'

interface ArmyViewProps {
  village: Village
  now: number
  onTrain: (unitId: UnitId, amount: number) => void
}

const UNIT_ORDER: UnitId[] = ['pawn', 'bishop', 'knight', 'rook', 'queen']

function ArmyPreview({ focus }: { focus: UnitId }) {
  return (
    <>
      <SceneLights />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color="#79a844" roughness={0.9} />
      </mesh>
      <Float key={focus} speed={1.4} floatIntensity={0.35} rotationIntensity={0.2}>
        <ChessPiece
          key={focus}
          kind={focus}
          color="#f0e6d2"
          accent="#c9a227"
          position={[0, 0.05, 0]}
          scale={1.4}
        />
      </Float>
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={8} blur={2.5} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={7}
        minPolarAngle={0.6}
        maxPolarAngle={1.35}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </>
  )
}

export function ArmyView({ village, now, onTrain }: ArmyViewProps) {
  const [amounts, setAmounts] = useState<Record<UnitId, number>>({
    pawn: 5,
    bishop: 2,
    knight: 2,
    rook: 1,
    queen: 1,
  })
  const [focus, setFocus] = useState<UnitId>('pawn')
  const job = village.training

  return (
    <section className="view-3d">
      <div className="scene-frame scene-frame--army">
        <Canvas shadows="percentage" camera={{ position: [2.8, 2.4, 3.4], fov: 40 }} dpr={[1, 1.75]}>
          <Suspense fallback={null}>
            <ArmyPreview focus={focus} />
          </Suspense>
        </Canvas>
        <div className="scene-hint">Preview · auto-rotating 3D piece</div>
      </div>

      <aside className="hud-panel">
        <div className="panel__head">
          <div>
            <h2>Training Grounds</h2>
            <p>Muster chess pieces for raid and conquest.</p>
          </div>
        </div>

        {job && (
          <div className="queue-banner">
            Training {job.amount}× {UNITS[job.unitId].name} —{' '}
            {formatDuration(job.finishesAt - now)} remaining
          </div>
        )}

        <div className="unit-list">
          {UNIT_ORDER.map((id) => {
            const def = UNITS[id]
            const level = getBuildingLevel(village, def.requires)
            const unlocked = level >= def.minBuildingLevel
            const amount = amounts[id]
            const totalCost: Resources = {
              timber: def.cost.timber * amount,
              ivory: def.cost.ivory * amount,
              steel: def.cost.steel * amount,
              grain: def.cost.grain * amount,
            }
            const affordable = canAfford(village.resources, totalCost)

            return (
              <article
                key={id}
                className={`unit-card${focus === id ? ' unit-card--focus' : ''}`}
                onClick={() => setFocus(id)}
              >
                <div className="unit-card__symbol" aria-hidden>
                  {def.symbol}
                </div>
                <div>
                  <h3>
                    {def.name}
                    {!unlocked && (
                      <span style={{ color: 'var(--ivory-dim)', fontWeight: 400 }}>
                        {' '}
                        · locked
                      </span>
                    )}
                    <span style={{ color: 'var(--ivory-dim)', fontWeight: 400 }}>
                      {' '}
                      · garrison {village.army[id] ?? 0}
                    </span>
                  </h3>
                  <p>{def.description}</p>
                  <div className="unit-card__stats">
                    <span>Atk {def.attack}</span>
                    <span>Def {def.defense}</span>
                    <span>Spd {def.speed}</span>
                    <span>Carry {def.carry}</span>
                  </div>
                  <div className="unit-card__stats">
                    {(Object.keys(totalCost) as (keyof Resources)[]).map((rid) => (
                      <span
                        key={rid}
                        style={{
                          color:
                            village.resources[rid] < totalCost[rid]
                              ? 'var(--danger)'
                              : undefined,
                        }}
                      >
                        {RESOURCE_META[rid].symbol}
                        {formatNumber(totalCost[rid])}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="unit-card__train">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={amount}
                    disabled={!unlocked || !!job}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setAmounts((prev) => ({
                        ...prev,
                        [id]: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn--gold"
                    style={{ padding: '0.5rem 0.7rem', fontSize: '0.72rem' }}
                    disabled={!unlocked || !!job || !affordable}
                    onClick={(e) => {
                      e.stopPropagation()
                      onTrain(id, amount)
                    }}
                  >
                    Train
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </aside>
    </section>
  )
}
