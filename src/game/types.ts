export type ResourceId = 'timber' | 'ivory' | 'steel' | 'grain'

export type Resources = Record<ResourceId, number>

export type BuildingId =
  | 'throne'
  | 'timberYard'
  | 'ivoryQuarry'
  | 'steelForge'
  | 'grainField'
  | 'warehouse'
  | 'granary'
  | 'barracks'
  | 'stable'
  | 'siegeWorks'
  | 'royalCourt'
  | 'ramparts'

export type UnitId = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen'

export type ViewId = 'kingdom' | 'army' | 'map' | 'reports'

export interface BuildingDef {
  id: BuildingId
  name: string
  symbol: string
  description: string
  maxLevel: number
  baseCost: Resources
  costGrowth: number
  buildSeconds: number
  /** Production per hour at level 1 (resources buildings) */
  production?: Partial<Resources>
  storageBonus?: number
  defenseBonus?: number
  unlocks?: UnitId[]
}

export interface UnitDef {
  id: UnitId
  name: string
  symbol: string
  description: string
  cost: Resources
  trainSeconds: number
  attack: number
  defense: number
  speed: number
  carry: number
  upkeep: number
  requires: BuildingId
  minBuildingLevel: number
}

export interface BuildingSlot {
  buildingId: BuildingId | null
  level: number
}

export interface ConstructionJob {
  slotIndex: number
  buildingId: BuildingId
  targetLevel: number
  finishesAt: number
}

export interface TrainingJob {
  unitId: UnitId
  amount: number
  finishesAt: number
  startedAt: number
  perUnitSeconds: number
}

export type Army = Record<UnitId, number>

export interface March {
  id: string
  fromVillageId: string
  toVillageId: string
  army: Army
  kind: 'attack' | 'raid' | 'return'
  departsAt: number
  arrivesAt: number
  loot?: Resources
}

export interface BattleReport {
  id: string
  at: number
  attackerName: string
  defenderName: string
  attackerArmy: Army
  defenderArmy: Army
  attackerLosses: Army
  defenderLosses: Army
  loot: Resources
  victory: boolean
  summary: string
}

export interface Village {
  id: string
  name: string
  ownerId: string
  x: number
  y: number
  resources: Resources
  slots: BuildingSlot[]
  army: Army
  construction: ConstructionJob | null
  training: TrainingJob | null
  population: number
}

export interface Player {
  id: string
  name: string
  isHuman: boolean
  color: string
}

export interface GameState {
  version: 1
  startedAt: number
  lastTickAt: number
  players: Player[]
  villages: Village[]
  marches: March[]
  reports: BattleReport[]
  humanPlayerId: string
  selectedVillageId: string
}
