import type { AnimalCategory } from './assetAnimalMapping'

export interface GameEventTemplate {
  id: number
  title: string
  /** Flavor text narrating the event in the farm metaphor */
  description: string
  icon: string
  /**
   * Optional multiplier applied on top of the raw CSV price change for
   * specific animal categories. A value of 1.5 means the sector earns 50%
   * more than its raw CSV movement; 0.5 means it earns half as much.
   * Absent entries default to 1.0 (no extra modifier).
   */
  sectorImpact: Partial<Record<AnimalCategory, number>>
  color: string
}

/**
 * 12 random events — one is rolled per round.
 * Titles, descriptions, icons, and sectorImpact values are placeholders
 * to be filled in by the game designer.
 */
export const GAME_EVENTS: GameEventTemplate[] = [
  {
    id: 1,
    title: 'Event 1 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#C4622D',
  },
  {
    id: 2,
    title: 'Event 2 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#1D5FA0',
  },
  {
    id: 3,
    title: 'Event 3 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#6D28D9',
  },
  {
    id: 4,
    title: 'Event 4 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#2D6A4F',
  },
  {
    id: 5,
    title: 'Event 5 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#B8860B',
  },
  {
    id: 6,
    title: 'Event 6 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#8B4513',
  },
  {
    id: 7,
    title: 'Event 7 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#475569',
  },
  {
    id: 8,
    title: 'Event 8 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#C4622D',
  },
  {
    id: 9,
    title: 'Event 9 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#1D5FA0',
  },
  {
    id: 10,
    title: 'Event 10 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#2D6A4F',
  },
  {
    id: 11,
    title: 'Event 11 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#6D28D9',
  },
  {
    id: 12,
    title: 'Event 12 — Placeholder',
    description: 'This event\'s flavor text and sector impact are yet to be defined.',
    icon: '🎲',
    sectorImpact: {},
    color: '#B8860B',
  },
]

export function getEventById(id: number): GameEventTemplate {
  return GAME_EVENTS.find(e => e.id === id) ?? GAME_EVENTS[0]
}
