import type { CsvDataMap, MultiplierMap } from './csvLoader'
import { getPriceAt } from './csvLoader'
import type { AnimalCategory } from '../data/assetAnimalMapping'
import { GAME_EVENTS } from '../data/events'
import type { GameEventTemplate } from '../data/events'

export const SESSION_START_DATE = new Date('2021-03-19T12:00:00Z')
export const TOTAL_ROUNDS = 7
export const UNIT_COST = 50

export const TIME_SKIP_OPTIONS: { days: number; label: string }[] = [
  { days: 3,   label: '3 days' },
  { days: 7,   label: '1 week' },
  { days: 14,  label: '2 weeks' },
  { days: 30,  label: '1 month' },
  { days: 60,  label: '2 months' },
  { days: 120, label: '4 months' },
  { days: 180, label: '6 months' },
  { days: 365, label: '12 months' },
  { days: 548, label: '18 months' },
]

export interface PortfolioItem {
  assetName: string
  animalName: string
  animalCategory: AnimalCategory
  units: number
  multiplier: number
}

export interface AssetPnl {
  assetName: string
  animalName: string
  animalCategory: AnimalCategory
  units: number
  multiplier: number
  startPrice: number | null
  endPrice: number | null
  /** Raw % change in the underlying asset (before game multiplier) */
  rawPct: number
  /** Effective % change: rawPct × gameMultiplier + eventBonusPct */
  effectivePct: number
  /** Additional % from the round event (0 if this asset is not affected) */
  eventBonusPct: number
  /** Whether this asset was impacted by the round's event */
  isEventAffected: boolean
  /** Dollar P&L: units × $100 × effectivePct */
  dollarPnl: number
}

export interface RoundResult {
  round: number
  /** IDs of all events that fired this round (always 2) */
  eventIds: number[]
  timeSkipDays: number
  startDate: Date
  endDate: Date
  assetResults: AssetPnl[]
  totalPnl: number
  portfolioValueBefore: number
  portfolioValueAfter: number
}

export function rollTimeSkips(): number[] {
  return Array.from({ length: TOTAL_ROUNDS }, () =>
    TIME_SKIP_OPTIONS[Math.floor(Math.random() * TIME_SKIP_OPTIONS.length)].days
  )
}

/**
 * Pick `count` events for a single round using weighted sampling with two
 * hard constraints:
 *
 * 1. **No asset overlap between the two events.**
 *    Once an event is chosen, every event that shares even one affected animal
 *    with it is excluded from subsequent picks.  This prevents both
 *    "good news + bad news for crypto" and "good news + good news for crypto"
 *    from appearing in the same round.
 *
 * 2. **Weight = Σ units held in affected assets.**
 *    Heavier positions attract more news — a concentrated bet is more exposed
 *    to market shocks.  Events that touch no held asset receive a tiny base
 *    weight (0.05) so they can still appear as rare background noise, but only
 *    when every relevant event is already excluded by rule 1.
 *
 * No duplicate event IDs are returned.  If the overlap constraint cannot be
 * satisfied (edge case: very small event pool), it is relaxed gracefully.
 */
export function pickEventsForRound(
  portfolio: Array<{ animalName: string; units: number }>,
  count: number = 2,
): number[] {
  const heldNames = new Set(portfolio.map(p => p.animalName))

  const getWeight = (event: GameEventTemplate): number =>
    event.affectedAnimalNames.reduce((sum, name) => {
      const item = portfolio.find(p => p.animalName === name)
      return sum + (item?.units ?? 0)
    }, 0)

  const chosen: GameEventTemplate[] = []
  let remaining = [...GAME_EVENTS]

  while (chosen.length < count && remaining.length > 0) {
    // Build the set of animals already spoken for by chosen events
    const usedAnimals = new Set(chosen.flatMap(e => e.affectedAnimalNames))

    // Candidates must not share any affected animal with already-chosen events
    let candidates = remaining.filter(
      e => !e.affectedAnimalNames.some(n => usedAnimals.has(n)),
    )
    // Safety fallback: if every remaining event overlaps, relax the constraint
    if (candidates.length === 0) candidates = [...remaining]

    // Give near-zero weight to events that touch no held asset so they only
    // appear when no relevant candidate survives the overlap filter
    const anyRelevant = candidates.some(e =>
      e.affectedAnimalNames.some(n => heldNames.has(n)),
    )
    const weights = candidates.map(e => {
      const w = getWeight(e)
      return w > 0 ? w : (anyRelevant ? 0.05 : 1)
    })

    const total = weights.reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    let idx = candidates.length - 1   // default: last (float-point safety)
    for (let i = 0; i < candidates.length; i++) {
      rand -= weights[i]
      if (rand <= 0) { idx = i; break }
    }

    const picked = candidates[idx]
    chosen.push(picked)
    remaining = remaining.filter(e => e.id !== picked.id)
  }

  return chosen.map(e => e.id)
}

export function advanceDate(baseDate: Date, days: number): Date {
  const d = new Date(baseDate.getTime())
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export function getTimeSkipLabel(days: number): string {
  const opt = TIME_SKIP_OPTIONS.find(o => o.days === days)
  return opt?.label ?? `${days} days`
}

/**
 * Calculates per-asset and aggregate P&L for a single round.
 * All events in `events` are applied — their bonuses stack for assets
 * that appear in more than one event's affectedAnimalNames.
 *
 * Formula (per event that affects the asset):
 *   eventBonusPct += (±1) × event.eventNumber × csvMultiplier / 100
 *   effectivePct   = rawPct × gameMultiplier + totalEventBonusPct
 *   dollarPnl      = units × UNIT_COST × effectivePct
 */
export function calculateRoundPnl(
  round: number,
  events: GameEventTemplate[],
  portfolio: PortfolioItem[],
  startDate: Date,
  endDate: Date,
  timeSkipDays: number,
  csvData: CsvDataMap,
  multiplierMap: MultiplierMap,
  portfolioValueBefore: number,
): RoundResult {
  const assetResults: AssetPnl[] = portfolio.map(item => {
    const startPrice = getPriceAt(csvData, item.assetName, startDate)
    const endPrice   = getPriceAt(csvData, item.assetName, endDate)

    let rawPct = 0
    if (startPrice != null && endPrice != null && startPrice > 0) {
      rawPct = (endPrice - startPrice) / startPrice
    }

    const csvMult = multiplierMap.get(item.assetName) ?? 1

    // Accumulate bonus from every event that touches this asset
    let eventBonusPct   = 0
    let isEventAffected = false
    for (const event of events) {
      if (event.affectedAnimalNames.includes(item.animalName)) {
        isEventAffected = true
        eventBonusPct  += (event.isPositive ? 1 : -1) * event.eventNumber * csvMult / 100
      }
    }

    const effectivePct = rawPct * item.multiplier + eventBonusPct
    const dollarPnl    = item.units * UNIT_COST * effectivePct

    return {
      assetName: item.assetName,
      animalName: item.animalName,
      animalCategory: item.animalCategory,
      units: item.units,
      multiplier: item.multiplier,
      startPrice,
      endPrice,
      rawPct,
      effectivePct,
      eventBonusPct,
      isEventAffected,
      dollarPnl,
    }
  })

  const totalPnl            = assetResults.reduce((s, r) => s + r.dollarPnl, 0)
  const portfolioValueAfter = portfolioValueBefore + totalPnl

  return {
    round,
    eventIds: events.map(e => e.id),
    timeSkipDays,
    startDate,
    endDate,
    assetResults,
    totalPnl,
    portfolioValueBefore,
    portfolioValueAfter,
  }
}

/** Format a Date to a short human-readable string, e.g. "Mar 2021" */
export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Format a dollar amount with sign, e.g. "+$420.50" */
export function formatPnl(amount: number): string {
  const sign = amount >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(amount).toFixed(2)}`
}

/** Format a percentage with sign and 2 dp, e.g. "+12.50%" */
export function formatPct(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${(pct * 100).toFixed(2)}%`
}
