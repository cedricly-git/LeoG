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
 * Pick `count` events for a single round, prioritising events that affect
 * the animals the player has actually selected.  Relevant events come first
 * (shuffled), then irrelevant ones fill any remaining slots.  No duplicates.
 */
export function pickEventsForRound(
  selectedAnimalNames: string[],
  count: number = 2,
): number[] {
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

  const relevant   = GAME_EVENTS.filter(e =>
    e.affectedAnimalNames.some(n => selectedAnimalNames.includes(n)),
  )
  const irrelevant = GAME_EVENTS.filter(e =>
    !e.affectedAnimalNames.some(n => selectedAnimalNames.includes(n)),
  )

  const pool   = [...shuffle(relevant), ...shuffle(irrelevant)]
  const chosen: number[] = []
  for (const e of pool) {
    if (chosen.length >= count) break
    chosen.push(e.id)
  }
  return chosen
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
