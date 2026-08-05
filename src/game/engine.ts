import {
  AI_NAMES,
  BUILDINGS,
  EMPTY_ARMY,
  EMPTY_RESOURCES,
  MAP_SIZE,
  PLAYER_COLORS,
  SLOT_OPTIONS,
  UNITS,
} from './constants'
import type {
  Army,
  BattleReport,
  BuildingId,
  ConstructionJob,
  GameState,
  March,
  Resources,
  UnitId,
  Village,
} from './types'

const uid = () => Math.random().toString(36).slice(2, 10)

export function scaleCost(base: Resources, level: number, growth: number): Resources {
  const m = Math.pow(growth, Math.max(0, level - 1))
  return {
    timber: Math.floor(base.timber * m),
    ivory: Math.floor(base.ivory * m),
    steel: Math.floor(base.steel * m),
    grain: Math.floor(base.grain * m),
  }
}

export function canAfford(have: Resources, cost: Resources): boolean {
  return (
    have.timber >= cost.timber &&
    have.ivory >= cost.ivory &&
    have.steel >= cost.steel &&
    have.grain >= cost.grain
  )
}

export function pay(have: Resources, cost: Resources): Resources {
  return {
    timber: have.timber - cost.timber,
    ivory: have.ivory - cost.ivory,
    steel: have.steel - cost.steel,
    grain: have.grain - cost.grain,
  }
}

export function addResources(a: Resources, b: Resources): Resources {
  return {
    timber: a.timber + b.timber,
    ivory: a.ivory + b.ivory,
    steel: a.steel + b.steel,
    grain: a.grain + b.grain,
  }
}

export function armyCount(army: Army): number {
  return Object.values(army).reduce((s, n) => s + n, 0)
}

export function armyStrength(army: Army, mode: 'attack' | 'defense'): number {
  return (Object.keys(UNITS) as UnitId[]).reduce((sum, id) => {
    const u = UNITS[id]
    const n = army[id] ?? 0
    return sum + n * (mode === 'attack' ? u.attack : u.defense)
  }, 0)
}

export function armyCarry(army: Army): number {
  return (Object.keys(UNITS) as UnitId[]).reduce(
    (sum, id) => sum + (army[id] ?? 0) * UNITS[id].carry,
    0,
  )
}

export function armyUpkeep(army: Army): number {
  return (Object.keys(UNITS) as UnitId[]).reduce(
    (sum, id) => sum + (army[id] ?? 0) * UNITS[id].upkeep,
    0,
  )
}

export function slowestSpeed(army: Army): number {
  let min = Infinity
  for (const id of Object.keys(UNITS) as UnitId[]) {
    if ((army[id] ?? 0) > 0) min = Math.min(min, UNITS[id].speed)
  }
  return min === Infinity ? 1 : min
}

export function travelSeconds(from: Village, to: Village, army: Army): number {
  const dist = Math.hypot(from.x - to.x, from.y - to.y)
  const speed = slowestSpeed(army)
  return Math.max(8, Math.round((dist / speed) * 60))
}

export function getBuildingLevel(village: Village, buildingId: BuildingId): number {
  return village.slots
    .filter((s) => s.buildingId === buildingId)
    .reduce((max, s) => Math.max(max, s.level), 0)
}

export function productionPerHour(village: Village): Resources {
  const prod = EMPTY_RESOURCES()
  for (const slot of village.slots) {
    if (!slot.buildingId || slot.level <= 0) continue
    const def = BUILDINGS[slot.buildingId]
    if (!def.production) continue
    for (const key of Object.keys(def.production) as (keyof Resources)[]) {
      const base = def.production[key] ?? 0
      prod[key] += Math.floor(base * slot.level * (1 + (slot.level - 1) * 0.15))
    }
  }
  return prod
}

export function storageCap(village: Village): { warehouse: number; granary: number } {
  const wh = getBuildingLevel(village, 'warehouse')
  const gr = getBuildingLevel(village, 'granary')
  return {
    warehouse: 800 + wh * (BUILDINGS.warehouse.storageBonus ?? 800),
    granary: 800 + gr * (BUILDINGS.granary.storageBonus ?? 800),
  }
}

export function wallBonus(village: Village): number {
  const lvl = getBuildingLevel(village, 'ramparts')
  return lvl * (BUILDINGS.ramparts.defenseBonus ?? 0.08)
}

export function calcPopulation(village: Village): number {
  const buildingPop = village.slots.reduce((s, slot) => s + slot.level * 2, 0)
  return buildingPop + armyUpkeep(village.army)
}

function clampResources(village: Village): void {
  const cap = storageCap(village)
  village.resources.timber = Math.min(village.resources.timber, cap.warehouse)
  village.resources.ivory = Math.min(village.resources.ivory, cap.warehouse)
  village.resources.steel = Math.min(village.resources.steel, cap.warehouse)
  village.resources.grain = Math.min(village.resources.grain, cap.granary)
}

function applyProduction(village: Village, seconds: number): void {
  const prod = productionPerHour(village)
  const factor = seconds / 3600
  village.resources.timber += prod.timber * factor
  village.resources.ivory += prod.ivory * factor
  village.resources.steel += prod.steel * factor
  village.resources.grain += prod.grain * factor

  // Upkeep drains grain
  const upkeep = armyUpkeep(village.army)
  village.resources.grain -= upkeep * (seconds / 3600) * 10
  if (village.resources.grain < 0) village.resources.grain = 0

  clampResources(village)
}

function finishConstruction(village: Village, now: number): void {
  const job = village.construction
  if (!job || job.finishesAt > now) return
  const slot = village.slots[job.slotIndex]
  slot.buildingId = job.buildingId
  slot.level = job.targetLevel
  village.construction = null
  village.population = calcPopulation(village)
}

function finishTraining(village: Village, now: number): void {
  const job = village.training
  if (!job || job.finishesAt > now) return
  village.army[job.unitId] = (village.army[job.unitId] ?? 0) + job.amount
  village.training = null
  village.population = calcPopulation(village)
}

function applyLosses(army: Army, lossRatio: number): { remaining: Army; losses: Army } {
  const remaining = EMPTY_ARMY()
  const losses = EMPTY_ARMY()
  for (const id of Object.keys(UNITS) as UnitId[]) {
    const n = army[id] ?? 0
    const lost = Math.min(n, Math.round(n * lossRatio))
    losses[id] = lost
    remaining[id] = n - lost
  }
  return { remaining, losses }
}

function lootFrom(defender: Village, capacity: number): Resources {
  const loot = EMPTY_RESOURCES()
  if (capacity <= 0) return loot
  const pool = [
    defender.resources.timber,
    defender.resources.ivory,
    defender.resources.steel,
    defender.resources.grain,
  ]
  const total = pool.reduce((a, b) => a + b, 0)
  if (total <= 0) return loot
  const take = Math.min(capacity, total * 0.5)
  const keys: (keyof Resources)[] = ['timber', 'ivory', 'steel', 'grain']
  let left = take
  for (const key of keys) {
    const share = (defender.resources[key] / total) * take
    const amount = Math.floor(Math.min(share, defender.resources[key], left))
    loot[key] = amount
    defender.resources[key] -= amount
    left -= amount
  }
  return loot
}

function resolveBattle(
  state: GameState,
  march: March,
  now: number,
): void {
  const attackerVillage = state.villages.find((v) => v.id === march.fromVillageId)
  const defender = state.villages.find((v) => v.id === march.toVillageId)
  if (!attackerVillage || !defender) return

  const attackerPlayer = state.players.find((p) => p.id === attackerVillage.ownerId)!
  const defenderPlayer = state.players.find((p) => p.id === defender.ownerId)!

  const atk = armyStrength(march.army, 'attack')
  const defBase = armyStrength(defender.army, 'defense')
  const def = defBase * (1 + wallBonus(defender))

  let victory: boolean
  let atkLossRatio: number
  let defLossRatio: number

  if (atk <= 0) {
    victory = false
    atkLossRatio = 1
    defLossRatio = 0
  } else if (def <= 0) {
    victory = true
    atkLossRatio = 0.05
    defLossRatio = 1
  } else {
    const ratio = atk / def
    victory = ratio >= 1
    if (victory) {
      atkLossRatio = Math.min(0.85, 0.9 / ratio)
      defLossRatio = Math.min(1, 0.55 * ratio)
    } else {
      atkLossRatio = Math.min(1, 0.7 / ratio)
      defLossRatio = Math.min(0.7, 0.35 * ratio)
    }
  }

  const atkResult = applyLosses(march.army, atkLossRatio)
  const defResult = applyLosses(defender.army, defLossRatio)
  defender.army = defResult.remaining
  defender.population = calcPopulation(defender)

  let loot = EMPTY_RESOURCES()
  if (victory) {
    loot = lootFrom(defender, armyCarry(atkResult.remaining))
  }

  const report: BattleReport = {
    id: uid(),
    at: now,
    attackerName: `${attackerPlayer.name} — ${attackerVillage.name}`,
    defenderName: `${defenderPlayer.name} — ${defender.name}`,
    attackerArmy: { ...march.army },
    defenderArmy: addArmy(defResult.remaining, defResult.losses),
    attackerLosses: atkResult.losses,
    defenderLosses: defResult.losses,
    loot,
    victory,
    summary: victory
      ? `${attackerPlayer.name} stormed ${defender.name} and seized spoils.`
      : `${defenderPlayer.name} held ${defender.name} against the assault.`,
  }
  state.reports.unshift(report)
  state.reports = state.reports.slice(0, 40)

  const survivors = atkResult.remaining
  if (armyCount(survivors) > 0) {
    const returnSecs = travelSeconds(defender, attackerVillage, survivors)
    state.marches.push({
      id: uid(),
      fromVillageId: defender.id,
      toVillageId: attackerVillage.id,
      army: survivors,
      kind: 'return',
      departsAt: now,
      arrivesAt: now + returnSecs * 1000,
      loot,
    })
  }
}

function addArmy(a: Army, b: Army): Army {
  const out = EMPTY_ARMY()
  for (const id of Object.keys(UNITS) as UnitId[]) {
    out[id] = (a[id] ?? 0) + (b[id] ?? 0)
  }
  return out
}

function processMarches(state: GameState, now: number): void {
  const pending: March[] = []
  for (const march of state.marches) {
    if (march.arrivesAt > now) {
      pending.push(march)
      continue
    }
    if (march.kind === 'return') {
      const home = state.villages.find((v) => v.id === march.toVillageId)
      if (home) {
        for (const id of Object.keys(UNITS) as UnitId[]) {
          home.army[id] = (home.army[id] ?? 0) + (march.army[id] ?? 0)
        }
        if (march.loot) {
          home.resources = addResources(home.resources, march.loot)
          clampResources(home)
        }
        home.population = calcPopulation(home)
      }
    } else {
      resolveBattle(state, march, now)
    }
  }
  state.marches = pending
}

function createVillage(
  id: string,
  name: string,
  ownerId: string,
  x: number,
  y: number,
  starter: boolean,
): Village {
  const slots = SLOT_OPTIONS.map((opts) => {
    const buildingId = opts[0]
    const isResource = [
      'timberYard',
      'ivoryQuarry',
      'steelForge',
      'grainField',
    ].includes(buildingId)
    const startsBuilt = starter && (isResource || buildingId === 'throne')
    return {
      buildingId,
      level: startsBuilt ? 1 : 0,
    }
  })

  const village: Village = {
    id,
    name,
    ownerId,
    x,
    y,
    resources: starter
      ? { timber: 400, ivory: 400, steel: 350, grain: 500 }
      : { timber: 200, ivory: 200, steel: 180, grain: 250 },
    slots,
    army: starter
      ? { pawn: 10, knight: 2, bishop: 0, rook: 0, queen: 0 }
      : { pawn: 5, knight: 0, bishop: 0, rook: 0, queen: 0 },
    construction: null,
    training: null,
    population: 0,
  }
  village.population = calcPopulation(village)
  return village
}

function pickPositions(count: number): { x: number; y: number }[] {
  const center = Math.floor(MAP_SIZE / 2)
  const spots: { x: number; y: number }[] = [{ x: center, y: center }]
  const candidates: { x: number; y: number; d: number }[] = []
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (x === center && y === center) continue
      const d = Math.hypot(x - center, y - center)
      if (d >= 2) candidates.push({ x, y, d })
    }
  }
  candidates.sort((a, b) => a.d - b.d)
  // Spread AI around the board
  const step = Math.max(1, Math.floor(candidates.length / (count - 1)))
  for (let i = 0; i < count - 1; i++) {
    const c = candidates[Math.min(i * step, candidates.length - 1)]
    spots.push({ x: c.x, y: c.y })
  }
  return spots
}

export function createNewGame(playerName: string): GameState {
  const now = Date.now()
  const humanId = 'player'
  const aiCount = 5
  const positions = pickPositions(1 + aiCount)

  const players = [
    {
      id: humanId,
      name: playerName.trim() || 'Sovereign',
      isHuman: true,
      color: PLAYER_COLORS[0],
    },
    ...AI_NAMES.slice(0, aiCount).map((name, i) => ({
      id: `ai-${i}`,
      name,
      isHuman: false,
      color: PLAYER_COLORS[i + 1],
    })),
  ]

  const villages: Village[] = players.map((p, i) => {
    const pos = positions[i]
    const name = p.isHuman ? 'King\'s Square' : `${p.name} Keep`
    return createVillage(`v-${p.id}`, name, p.id, pos.x, pos.y, true)
  })

  // Buff AI slightly so the board feels alive
  for (const v of villages) {
    if (v.ownerId === humanId) continue
    v.resources = { timber: 600, ivory: 600, steel: 500, grain: 700 }
    v.army = { pawn: 15, knight: 3, bishop: 2, rook: 0, queen: 0 }
    // Upgrade a few fields
    for (const slot of v.slots) {
      if (
        slot.buildingId &&
        ['timberYard', 'ivoryQuarry', 'steelForge', 'grainField'].includes(slot.buildingId)
      ) {
        slot.level = 2
      }
    }
    const barracks = v.slots.find((s) => s.buildingId === 'barracks')
    if (barracks) barracks.level = 1
    v.population = calcPopulation(v)
  }

  return {
    version: 1,
    startedAt: now,
    lastTickAt: now,
    players,
    villages,
    marches: [],
    reports: [],
    humanPlayerId: humanId,
    selectedVillageId: villages[0].id,
  }
}

export function tick(state: GameState, now = Date.now()): GameState {
  const next: GameState = structuredClone(state)
  const elapsed = Math.max(0, (now - next.lastTickAt) / 1000)
  if (elapsed <= 0) return next

  for (const village of next.villages) {
    applyProduction(village, elapsed)
    finishConstruction(village, now)
    finishTraining(village, now)
  }

  processMarches(next, now)
  runAi(next, now)
  next.lastTickAt = now
  return next
}

function runAi(state: GameState, now: number): void {
  for (const player of state.players) {
    if (player.isHuman) continue
    const village = state.villages.find((v) => v.ownerId === player.id)
    if (!village) continue

    // Build upgrades
    if (!village.construction) {
      const candidates = village.slots
        .map((slot, index) => ({ slot, index }))
        .filter(({ slot }) => {
          if (!slot.buildingId) return false
          const def = BUILDINGS[slot.buildingId]
          return slot.level < def.maxLevel
        })
        .sort((a, b) => a.slot.level - b.slot.level)

      for (const { slot, index } of candidates.slice(0, 4)) {
        const def = BUILDINGS[slot.buildingId!]
        const cost = scaleCost(def.baseCost, slot.level + 1, def.costGrowth)
        if (canAfford(village.resources, cost)) {
          village.resources = pay(village.resources, cost)
          const throneBonus = 1 - getBuildingLevel(village, 'throne') * 0.04
          const secs = Math.max(5, Math.round(def.buildSeconds * (slot.level + 1) * throneBonus))
          village.construction = {
            slotIndex: index,
            buildingId: slot.buildingId!,
            targetLevel: slot.level + 1,
            finishesAt: now + secs * 1000,
          }
          break
        }
      }
    }

    // Train pawns / knights
    if (!village.training) {
      const unitId: UnitId =
        getBuildingLevel(village, 'stable') >= 1 && Math.random() > 0.5
          ? 'knight'
          : getBuildingLevel(village, 'barracks') >= 1
            ? 'pawn'
            : (null as unknown as UnitId)
      if (unitId) {
        const def = UNITS[unitId]
        const amount = unitId === 'pawn' ? 5 : 2
        const totalCost: Resources = {
          timber: def.cost.timber * amount,
          ivory: def.cost.ivory * amount,
          steel: def.cost.steel * amount,
          grain: def.cost.grain * amount,
        }
        if (canAfford(village.resources, totalCost)) {
          village.resources = pay(village.resources, totalCost)
          village.training = {
            unitId,
            amount,
            startedAt: now,
            perUnitSeconds: def.trainSeconds,
            finishesAt: now + def.trainSeconds * amount * 1000,
          }
        }
      }
    }

    // Occasional raid on human or weaker neighbor
    if (Math.random() < 0.02 && armyCount(village.army) >= 12) {
      const humanVillage = state.villages.find((v) => v.ownerId === state.humanPlayerId)
      const targets = state.villages.filter((v) => v.ownerId !== player.id)
      const target =
        humanVillage && Math.random() < 0.55
          ? humanVillage
          : targets[Math.floor(Math.random() * targets.length)]
      if (!target) continue
      const alreadyMarching = state.marches.some(
        (m) => m.fromVillageId === village.id && m.kind !== 'return',
      )
      if (alreadyMarching) continue

      const send: Army = EMPTY_ARMY()
      send.pawn = Math.floor((village.army.pawn ?? 0) * 0.5)
      send.knight = Math.floor((village.army.knight ?? 0) * 0.4)
      send.bishop = Math.floor((village.army.bishop ?? 0) * 0.3)
      if (armyCount(send) < 5) continue

      for (const id of Object.keys(UNITS) as UnitId[]) {
        village.army[id] -= send[id]
      }
      village.population = calcPopulation(village)
      const secs = travelSeconds(village, target, send)
      state.marches.push({
        id: uid(),
        fromVillageId: village.id,
        toVillageId: target.id,
        army: send,
        kind: 'raid',
        departsAt: now,
        arrivesAt: now + secs * 1000,
      })
    }
  }
}

export function upgradeBuilding(
  state: GameState,
  villageId: string,
  slotIndex: number,
): GameState | { error: string } {
  const next = structuredClone(state)
  const village = next.villages.find((v) => v.id === villageId)
  if (!village) return { error: 'Kingdom not found.' }
  if (village.ownerId !== next.humanPlayerId) return { error: 'Not your kingdom.' }
  if (village.construction) return { error: 'A construction is already underway.' }

  const slot = village.slots[slotIndex]
  if (!slot?.buildingId) return { error: 'Empty slot.' }
  const def = BUILDINGS[slot.buildingId]
  if (slot.level >= def.maxLevel) return { error: 'Already at maximum rank.' }

  const cost = scaleCost(def.baseCost, slot.level + 1, def.costGrowth)
  if (!canAfford(village.resources, cost)) return { error: 'Insufficient resources.' }

  village.resources = pay(village.resources, cost)
  const throneBonus = 1 - getBuildingLevel(village, 'throne') * 0.04
  const secs = Math.max(5, Math.round(def.buildSeconds * (slot.level + 1) * throneBonus))
  const job: ConstructionJob = {
    slotIndex,
    buildingId: slot.buildingId,
    targetLevel: slot.level + 1,
    finishesAt: Date.now() + secs * 1000,
  }
  village.construction = job
  return next
}

export function trainUnits(
  state: GameState,
  villageId: string,
  unitId: UnitId,
  amount: number,
): GameState | { error: string } {
  const next = structuredClone(state)
  const village = next.villages.find((v) => v.id === villageId)
  if (!village) return { error: 'Kingdom not found.' }
  if (village.ownerId !== next.humanPlayerId) return { error: 'Not your kingdom.' }
  if (village.training) return { error: 'Troops are already being trained.' }
  if (amount < 1 || amount > 50) return { error: 'Train between 1 and 50 units.' }

  const def = UNITS[unitId]
  const level = getBuildingLevel(village, def.requires)
  if (level < def.minBuildingLevel) {
    return { error: `Requires ${BUILDINGS[def.requires].name} rank ${def.minBuildingLevel}.` }
  }

  const totalCost: Resources = {
    timber: def.cost.timber * amount,
    ivory: def.cost.ivory * amount,
    steel: def.cost.steel * amount,
    grain: def.cost.grain * amount,
  }
  if (!canAfford(village.resources, totalCost)) return { error: 'Insufficient resources.' }

  village.resources = pay(village.resources, totalCost)
  const now = Date.now()
  village.training = {
    unitId,
    amount,
    startedAt: now,
    perUnitSeconds: def.trainSeconds,
    finishesAt: now + def.trainSeconds * amount * 1000,
  }
  return next
}

export function sendAttack(
  state: GameState,
  fromVillageId: string,
  toVillageId: string,
  army: Army,
  kind: 'attack' | 'raid' = 'attack',
): GameState | { error: string } {
  const next = structuredClone(state)
  const from = next.villages.find((v) => v.id === fromVillageId)
  const to = next.villages.find((v) => v.id === toVillageId)
  if (!from || !to) return { error: 'Invalid destination.' }
  if (from.ownerId !== next.humanPlayerId) return { error: 'Not your kingdom.' }
  if (from.id === to.id) return { error: 'Cannot march on yourself.' }
  if (armyCount(army) < 1) return { error: 'Select at least one piece.' }

  for (const id of Object.keys(UNITS) as UnitId[]) {
    if ((army[id] ?? 0) > (from.army[id] ?? 0)) {
      return { error: `Not enough ${UNITS[id].name}s.` }
    }
  }

  for (const id of Object.keys(UNITS) as UnitId[]) {
    from.army[id] -= army[id] ?? 0
  }
  from.population = calcPopulation(from)

  const now = Date.now()
  const secs = travelSeconds(from, to, army)
  next.marches.push({
    id: uid(),
    fromVillageId: from.id,
    toVillageId: to.id,
    army: { ...EMPTY_ARMY(), ...army },
    kind,
    departsAt: now,
    arrivesAt: now + secs * 1000,
  })
  return next
}

export function getHumanVillage(state: GameState): Village {
  return (
    state.villages.find((v) => v.id === state.selectedVillageId) ??
    state.villages.find((v) => v.ownerId === state.humanPlayerId)!
  )
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m <= 0) return `${r}s`
  return `${m}m ${r.toString().padStart(2, '0')}s`
}

export function formatNumber(n: number): string {
  return Math.floor(n).toLocaleString()
}
